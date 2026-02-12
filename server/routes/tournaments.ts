import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getDb } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// ── Helpers ──────────────────────────────────────────────────────

function verifyToken(req: any): any | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAuth(req: any, res: any): any | null {
    const user = verifyToken(req);
    if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return null;
    }
    return user;
}

function requireAdmin(req: any, res: any): any | null {
    const user = verifyToken(req);
    if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return null;
    }
    if (user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return null;
    }
    return user;
}

// ── Validation ───────────────────────────────────────────────────

const createTournamentSchema = z.object({
    name: z.string().min(2).max(100),
    gameMode: z.string().default('battle-royale'),
    format: z.enum([
        'single-elimination', 'double-elimination', 'round-robin',
        'swiss', 'battle-royale', 'group-knockout',
    ]),
    participantType: z.enum(['team', 'player']).default('team'),
    maxParticipants: z.number().int().min(2).max(128).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    formatConfig: z.record(z.any()).optional().default({}),
    phases: z.array(z.object({
        label: z.string().min(1),
        route: z.string().optional(),
    })).optional(),
});

const updateTournamentSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    status: z.enum(['draft', 'registration', 'active', 'paused', 'completed', 'cancelled']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    formatConfig: z.record(z.any()).optional(),
});

const reportMatchSchema = z.object({
    winnerId: z.string().optional(),
    score1: z.number().int().min(0).default(0),
    score2: z.number().int().min(0).default(0),
    lobbyResults: z.array(z.object({
        participantId: z.string(),
        rank: z.number().int().min(1).optional(),
        score: z.number().int().min(0).optional(),
        kills: z.number().int().min(0).optional(),
    })).optional(),
});

// ── Engine: Bracket/Schedule Generation ──────────────────────────

function nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

function generateKnockoutBracket(
    tournamentId: string,
    participants: { id: string; participant_id: string; seed: number | null }[],
    formatConfig: any,
    db: any
) {
    const bestOf = formatConfig.bestOf || 1;

    // Sort by seed (nulls last), then random within same seed
    const seeded = [...participants].sort((a, b) => {
        if (a.seed === null && b.seed === null) return Math.random() - 0.5;
        if (a.seed === null) return 1;
        if (b.seed === null) return -1;
        return a.seed - b.seed;
    });

    const bracketSize = nextPowerOf2(seeded.length);

    // Pad with BYEs
    const bracket: (string | null)[] = seeded.map(p => p.participant_id);
    while (bracket.length < bracketSize) bracket.push(null);

    // Standard seeding: 1v16, 8v9, 5v12, etc.
    const seededBracket: (string | null)[] = new Array(bracketSize).fill(null);
    function placeSeed(pos: number, low: number, high: number) {
        if (low === high) {
            seededBracket[pos] = bracket[low] || null;
            return;
        }
        const mid = Math.floor((low + high) / 2);
        placeSeed(pos * 2, low, mid);
        placeSeed(pos * 2 + 1, mid + 1, high);
    }
    if (bracketSize > 1) {
        placeSeed(1, 0, bracketSize - 1);
    }

    // Flatten from tree to pairs
    const flatBracket: (string | null)[] = [];
    for (let i = bracketSize; i < bracketSize * 2; i++) {
        flatBracket.push(seededBracket[i] || bracket[i - bracketSize] || null);
    }

    // Fallback: just use seeded order if tree didn't work well
    const finalBracket = flatBracket.some(x => x !== null) ? flatBracket : bracket;

    // Generate round 1 matches
    const totalRounds = Math.log2(bracketSize);
    const insertMatch = db.prepare(
        'INSERT INTO matches (id, tournament_id, round_number, match_number, participant1_id, participant2_id, best_of, status, match_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const round1Matches: string[] = [];

    const genMatches = db.transaction(() => {
        const round1Label = `Round 1`;
        // Round 1
        for (let i = 0; i < finalBracket.length; i += 2) {
            const p1 = finalBracket[i];
            const p2 = finalBracket[i + 1];
            const matchId = randomUUID();
            const matchNum = Math.floor(i / 2) + 1;

            // If one side is BYE, auto-advance the other
            if (!p1 && !p2) continue; // both byes — skip
            if (!p1 || !p2) {
                const winner = p1 || p2;
                insertMatch.run(matchId, tournamentId, 1, matchNum, p1, p2, bestOf, 'completed', round1Label);
                db.prepare("UPDATE matches SET winner_id = ?, completed_at = datetime('now') WHERE id = ?").run(winner, matchId);
            } else {
                insertMatch.run(matchId, tournamentId, 1, matchNum, p1, p2, bestOf, 'pending', round1Label);
            }
            round1Matches.push(matchId);
        }

        // Create placeholder matches for later rounds
        let matchesInRound = Math.floor(finalBracket.length / 2);
        for (let round = 2; round <= totalRounds; round++) {
            matchesInRound = Math.floor(matchesInRound / 2);
            const roundLabel = round === totalRounds ? "Final" : round === totalRounds - 1 ? "Semifinal" : `Round ${round}`;
            for (let m = 1; m <= matchesInRound; m++) {
                insertMatch.run(randomUUID(), tournamentId, round, m, null, null, bestOf, 'pending', roundLabel);
            }
        }
    });

    genMatches();
    return { totalRounds, totalMatches: bracketSize - 1 };
}

function generateDoubleEliminationBracket(
    tournamentId: string,
    participants: { id: string; participant_id: string; seed: number | null }[],
    formatConfig: any,
    db: any
) {
    const bestOf = formatConfig.bestOf || 1;
    const seeded = [...participants].sort((a, b) => {
        if (a.seed === null && b.seed === null) return Math.random() - 0.5;
        if (a.seed === null) return 1;
        if (b.seed === null) return -1;
        return a.seed - b.seed;
    });

    const n = seeded.length;
    const bracketSize = nextPowerOf2(n);
    const wbRounds = Math.log2(bracketSize);

    // 1. Generate Winners Bracket (same as Single Elimination)
    const bracket: (string | null)[] = seeded.map(p => p.participant_id);
    while (bracket.length < bracketSize) bracket.push(null);

    const seededBracket: (string | null)[] = new Array(bracketSize).fill(null);
    function placeSeed(pos: number, low: number, high: number) {
        if (low === high) {
            seededBracket[pos] = bracket[low] || null;
            return;
        }
        const mid = Math.floor((low + high) / 2);
        placeSeed(pos * 2, low, mid);
        placeSeed(pos * 2 + 1, mid + 1, high);
    }
    if (bracketSize > 1) placeSeed(1, 0, bracketSize - 1);

    const flatWB: (string | null)[] = [];
    for (let i = bracketSize; i < bracketSize * 2; i++) {
        flatWB.push(seededBracket[i] || bracket[i - bracketSize] || null);
    }

    const insertMatch = db.prepare(
        'INSERT INTO matches (id, tournament_id, round_number, match_number, participant1_id, participant2_id, best_of, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    db.transaction(() => {
        // Winners Bracket Rounds
        let wbMatchesInRound = bracketSize / 2;
        for (let round = 1; round <= wbRounds; round++) {
            for (let m = 1; m <= wbMatchesInRound; m++) {
                let p1: string | null = null;
                let p2: string | null = null;
                let status = 'pending';
                let winnerId: string | null = null;

                if (round === 1) {
                    p1 = flatWB[(m - 1) * 2];
                    p2 = flatWB[(m - 1) * 2 + 1];
                    // Handle BYEs
                    if (p1 && !p2) { status = 'completed'; winnerId = p1; }
                    else if (!p1 && p2) { status = 'completed'; winnerId = p2; }
                    else if (!p1 && !p2) continue; // Skip if both null (shouldn't happen with power of 2)
                }

                const matchId = randomUUID();
                insertMatch.run(matchId, tournamentId, round, m, p1, p2, bestOf, status);
                if (winnerId) {
                    db.prepare("UPDATE matches SET winner_id = ?, completed_at = datetime('now') WHERE id = ?").run(winnerId, matchId);
                }
            }
            wbMatchesInRound /= 2;
        }

        // 2. Losers Bracket (LB)
        // LB has 2 * (wbRounds - 1) rounds
        // Rounds: 101, 102, 103, 104...
        // LB Round 1: Losers from WB Round 1
        // LB Round 2: Winners from LB R1 vs Losers from WB Round 2
        // LB Round 3: Winners from LB R2 (pairs)
        // LB Round 4: Winners from LB R3 vs Losers from WB Round 3
        // ... and so on.

        let lbMatchesInRound = bracketSize / 4;
        if (lbMatchesInRound < 1) lbMatchesInRound = 0; // for 2 players, LB is just WB loser vs WB winner again? No, DE needs min 3-4 players for real LB.

        for (let lbRound = 1; lbRound <= 2 * (wbRounds - 1); lbRound++) {
            for (let m = 1; m <= lbMatchesInRound; m++) {
                insertMatch.run(randomUUID(), tournamentId, 100 + lbRound, m, null, null, bestOf, 'pending');
            }
            // LB match count only halves every OTHER round
            if (lbRound % 2 === 0) lbMatchesInRound /= 2;
        }

        // 3. Grand Final (WB Winner vs LB Winner)
        // Round 200
        insertMatch.run(randomUUID(), tournamentId, 200, 1, null, null, bestOf, 'pending');
        // Bracket reset match (Round 201)
        insertMatch.run(randomUUID(), tournamentId, 201, 1, null, null, bestOf, 'pending');
    })();

    return { wbRounds, totalMatches: (bracketSize - 1) * 2 };
}

function generateRoundRobinSchedule(
    tournamentId: string,
    participants: { id: string; participant_id: string }[],
    formatConfig: any,
    db: any
) {
    const ids = participants.map(p => p.participant_id);
    const isDouble = formatConfig.doubleRoundRobin || false;

    // Add BYE if odd
    if (ids.length % 2 !== 0) ids.push('BYE');
    const n = ids.length;

    const insertMatch = db.prepare(
        'INSERT INTO matches (id, tournament_id, round_number, match_number, participant1_id, participant2_id, best_of, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const genMatches = db.transaction(() => {
        const teams = [...ids];

        for (let round = 0; round < n - 1; round++) {
            let matchNum = 1;
            for (let i = 0; i < n / 2; i++) {
                const home = teams[i];
                const away = teams[n - 1 - i];
                if (home !== 'BYE' && away !== 'BYE') {
                    insertMatch.run(
                        randomUUID(), tournamentId,
                        round + 1, matchNum,
                        home, away, 1, 'pending'
                    );
                    matchNum++;
                }
            }
            // Rotate (keep first fixed)
            const last = teams.pop()!;
            teams.splice(1, 0, last);
        }

        // Double round robin: reverse fixtures
        if (isDouble) {
            const teams2 = [...ids];
            for (let round = 0; round < n - 1; round++) {
                let matchNum = 1;
                for (let i = 0; i < n / 2; i++) {
                    const home = teams2[n - 1 - i]; // reversed
                    const away = teams2[i];
                    if (home !== 'BYE' && away !== 'BYE') {
                        insertMatch.run(
                            randomUUID(), tournamentId,
                            n - 1 + round + 1, matchNum,
                            home, away, 1, 'pending'
                        );
                        matchNum++;
                    }
                }
                const last = teams2.pop()!;
                teams2.splice(1, 0, last);
            }
        }
    });

    const totalRounds = isDouble ? (n - 1) * 2 : n - 1;
    const matchesPerRound = Math.floor(n / 2);
    return { totalRounds, totalMatches: isDouble ? n * (n - 1) : (n * (n - 1)) / 2 };
}

function generateBattleRoyaleLobbies(
    tournamentId: string,
    participants: { id: string; participant_id: string }[],
    formatConfig: any,
    db: any
) {
    const maxPerLobby = formatConfig.maxParticipantsPerLobby || 20;
    const setSize = formatConfig.setSize || participants.length;
    const groupLabels = formatConfig.groupLabels || [];

    const insertMatch = db.prepare(
        'INSERT INTO matches (id, tournament_id, round_number, match_number, best_of, status, match_label) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertMP = db.prepare(
        'INSERT INTO match_participants (id, match_id, participant_id) VALUES (?, ?, ?)'
    );

    let totalMatches = 0;

    db.transaction(() => {
        const numSets = Math.ceil(participants.length / setSize);

        for (let s = 0; s < numSets; s++) {
            const setParticipants = participants.slice(s * setSize, (s + 1) * setSize);
            const numLobbiesInSet = Math.ceil(setParticipants.length / maxPerLobby);
            const setLabel = groupLabels[s] || (numSets > 1 ? `Set ${s + 1}` : "");

            for (let i = 0; i < numLobbiesInSet; i++) {
                const matchId = randomUUID();
                const lobbyNumInSet = i + 1;
                const matchLabel = setLabel ? `${setLabel} - Lobby ${lobbyNumInSet}` : `Lobby ${lobbyNumInSet}`;

                // round_number used as set index internally for sorting if needed
                insertMatch.run(matchId, tournamentId, s + 1, totalMatches + 1, 1, 'pending', matchLabel);

                const lobbyParticipants = setParticipants.slice(i * maxPerLobby, (i + 1) * maxPerLobby);
                lobbyParticipants.forEach(p => {
                    insertMP.run(randomUUID(), matchId, p.participant_id);
                });
                totalMatches++;
            }
        }
    })();

    return { totalRounds: 1, totalMatches };
}

function generateSwissRound(
    tournamentId: string,
    round: number,
    participants: { id: string; participant_id: string; seed: number | null }[],
    formatConfig: any,
    db: any
) {
    const bestOf = formatConfig.bestOf || 1;
    let pairings: [string, string | null][] = [];

    if (round === 1) {
        // Round 1: seeded or random
        const seeded = [...participants].sort((a, b) => {
            if (a.seed === null && b.seed === null) return Math.random() - 0.5;
            if (a.seed === null) return 1;
            if (b.seed === null) return -1;
            return a.seed - b.seed;
        });
        const ids = seeded.map(p => p.participant_id);
        for (let i = 0; i < ids.length; i += 2) {
            pairings.push([ids[i], ids[i + 1] || null]);
        }
    } else {
        // Future rounds: pair by record (simplified for now)
        // In a real system, we'd fetch standings and avoid repeat opponents.
        // For now, let's at least sort by wins.
        const matches = db.prepare("SELECT * FROM matches WHERE tournament_id = ? AND status = 'completed'").all(tournamentId);

        const scores: Record<string, number> = {};
        participants.forEach(p => scores[p.participant_id] = 0);
        matches.forEach((m: any) => {
            if (m.winner_id) scores[m.winner_id]++;
        });

        const sorted = [...participants].sort((a, b) => (scores[b.participant_id] || 0) - (scores[a.participant_id] || 0));
        const ids = sorted.map(p => p.participant_id);
        for (let i = 0; i < ids.length; i += 2) {
            pairings.push([ids[i], ids[i + 1] || null]);
        }
    }

    const insertMatch = db.prepare(
        'INSERT INTO matches (id, tournament_id, round_number, match_number, participant1_id, participant2_id, best_of, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    db.transaction(() => {
        pairings.forEach((p, i) => {
            const matchId = randomUUID();
            const status = p[1] === null ? 'completed' : 'pending';
            insertMatch.run(matchId, tournamentId, round, i + 1, p[0], p[1], bestOf, status);
            if (p[1] === null) {
                db.prepare("UPDATE matches SET winner_id = ?, completed_at = datetime('now') WHERE id = ?").run(p[0], matchId);
            }
        });
    })();

    return { currentRound: round, totalMatches: pairings.length };
}

function generateGroups(
    tournamentId: string,
    participants: { id: string; participant_id: string }[],
    formatConfig: any,
    db: any
) {
    const playersPerGroup = formatConfig.playersPerGroup || 4;
    const groupLabels = formatConfig.groupLabels || [];
    const numGroups = Math.ceil(participants.length / playersPerGroup);

    // Assign groups
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const updateParticipant = db.prepare('UPDATE tournament_participants SET group_number = ? WHERE tournament_id = ? AND participant_id = ?');

    db.transaction(() => {
        shuffled.forEach((p, i) => {
            const groupNum = Math.floor(i / playersPerGroup) + 1;
            updateParticipant.run(groupNum, tournamentId, p.participant_id);
        });

        // Generate Round Robin for each group
        for (let g = 1; g <= numGroups; g++) {
            const groupParticipants = shuffled.filter((_, i) => Math.floor(i / playersPerGroup) + 1 === g);
            const ids = groupParticipants.map(p => p.participant_id);
            const groupLabel = groupLabels[g - 1] || `Group ${g}`;

            if (ids.length % 2 !== 0) ids.push('BYE');
            const n = ids.length;
            const teams = [...ids];

            const insertMatch = db.prepare(
                'INSERT INTO matches (id, tournament_id, round_number, match_number, participant1_id, participant2_id, best_of, status, match_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );

            for (let round = 0; round < n - 1; round++) {
                for (let i = 0; i < n / 2; i++) {
                    const home = teams[i];
                    const away = teams[n - 1 - i];
                    if (home !== 'BYE' && away !== 'BYE') {
                        // Round numbers in Group Stage: Group Number * 100 + Round Number
                        const roundLabel = `${groupLabel} - Round ${round + 1}`;
                        insertMatch.run(randomUUID(), tournamentId, g * 100 + (round + 1), i + 1, home, away, 1, 'pending', roundLabel);
                    }
                }
                const last = teams.pop()!;
                teams.splice(1, 0, last);
            }
        }
    })();

    return { numGroups, totalRoundsPerGroup: playersPerGroup % 2 === 0 ? playersPerGroup - 1 : playersPerGroup };
}

// ── GET /api/tournaments/active — Currently active tournament ────

router.get('/active', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();

        const tournament: any = db.prepare(
            "SELECT * FROM tournaments WHERE status IN ('active', 'registration') ORDER BY created_at DESC LIMIT 1"
        ).get();

        if (!tournament) {
            return res.json({ success: true, tournament: null, phases: [] });
        }

        const phases = db.prepare(
            'SELECT * FROM tournament_phases WHERE tournament_id = ? ORDER BY phase_number ASC'
        ).all(tournament.id);

        const participantCount: any = db.prepare(
            'SELECT COUNT(*) AS count FROM tournament_participants WHERE tournament_id = ?'
        ).get(tournament.id);

        res.json({
            success: true,
            tournament: { ...tournament, participant_count: participantCount.count },
            phases,
        });
    } catch (error) {
        console.error('Active tournament error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── POST /api/tournaments — Create tournament (admin) ────────────

router.post('/', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const body = createTournamentSchema.parse(req.body);
        const db = getDb();

        const tournamentId = randomUUID();

        const createTournament = db.transaction(() => {
            db.prepare(`
                INSERT INTO tournaments (id, name, game_mode, format, format_config, participant_type, max_participants, start_date, end_date, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                tournamentId,
                body.name,
                body.gameMode,
                body.format,
                JSON.stringify(body.formatConfig),
                body.participantType,
                body.maxParticipants || null,
                body.startDate || null,
                body.endDate || null,
                admin.id
            );

            // Create phases if provided
            if (body.phases && body.phases.length > 0) {
                const insertPhase = db.prepare(
                    'INSERT INTO tournament_phases (id, tournament_id, phase_number, label, status, route) VALUES (?, ?, ?, ?, ?, ?)'
                );
                body.phases.forEach((phase, index) => {
                    insertPhase.run(
                        randomUUID(),
                        tournamentId,
                        index + 1,
                        phase.label,
                        index === 0 ? 'current' : 'locked',
                        phase.route || null
                    );
                });
            }
        });

        createTournament();

        res.status(201).json({
            success: true,
            tournament: { id: tournamentId, name: body.name, format: body.format, status: 'draft' },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Create tournament error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/tournaments — List tournaments ──────────────────────

router.get('/', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();

        const tournaments = db.prepare(`
            SELECT t.*,
                u.username AS created_by_name,
                (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS participant_count,
                (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = t.id) AS match_count,
                (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = t.id AND m.status = 'completed') AS completed_matches
            FROM tournaments t
            JOIN users u ON t.created_by = u.id
            ORDER BY t.created_at DESC
        `).all();

        res.json({ success: true, tournaments });
    } catch (error) {
        console.error('List tournaments error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/tournaments/:id — Tournament detail ─────────────────

router.get('/:id', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const { id } = req.params;

        const tournament: any = db.prepare(`
            SELECT t.*, u.username AS created_by_name
            FROM tournaments t
            JOIN users u ON t.created_by = u.id
            WHERE t.id = ?
        `).get(id);

        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const phases = db.prepare(
            'SELECT * FROM tournament_phases WHERE tournament_id = ? ORDER BY phase_number ASC'
        ).all(id);

        const participants = db.prepare(`
            SELECT tp.*, 
                CASE 
                    WHEN t2.participant_type = 'team' THEN tm.name
                    ELSE u.username
                END AS participant_name,
                CASE
                    WHEN t2.participant_type = 'team' THEN (SELECT u2.username FROM users u2 WHERE u2.id = tm.leader_id)
                    ELSE u.codm_ign
                END AS extra_info
            FROM tournament_participants tp
            JOIN tournaments t2 ON tp.tournament_id = t2.id
            LEFT JOIN teams tm ON tp.participant_id = tm.id AND t2.participant_type = 'team'
            LEFT JOIN users u ON tp.participant_id = u.id AND t2.participant_type = 'player'
            WHERE tp.tournament_id = ?
            ORDER BY tp.seed ASC NULLS LAST, tp.created_at ASC
        `).all(id);

        res.json({ success: true, tournament, phases, participants });
    } catch (error) {
        console.error('Tournament detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── PUT /api/tournaments/:id — Update tournament ─────────────────

router.put('/:id', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const body = updateTournamentSchema.parse(req.body);
        const db = getDb();
        const { id } = req.params;

        const tournament: any = db.prepare('SELECT id, status FROM tournaments WHERE id = ?').get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (body.name) { updates.push('name = ?'); values.push(body.name); }
        if (body.status) { updates.push('status = ?'); values.push(body.status); }
        if (body.startDate) { updates.push('start_date = ?'); values.push(body.startDate); }
        if (body.endDate) { updates.push('end_date = ?'); values.push(body.endDate); }
        if (body.formatConfig) { updates.push('format_config = ?'); values.push(JSON.stringify(body.formatConfig)); }

        if (updates.length > 0) {
            updates.push("updated_at = datetime('now')");
            values.push(id);
            db.prepare(`UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        res.json({ success: true, message: 'Tournament updated' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Update tournament error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── POST /api/tournaments/:id/participants — Add participants ────

router.post('/:id/participants', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const db = getDb();
        const { id } = req.params;
        const { participantIds } = req.body as { participantIds: string[] };

        if (!Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ success: false, message: 'participantIds array required' });
        }

        const tournament: any = db.prepare('SELECT id, max_participants FROM tournaments WHERE id = ?').get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const currentCount: any = db.prepare(
            'SELECT COUNT(*) AS count FROM tournament_participants WHERE tournament_id = ?'
        ).get(id);

        if (tournament.max_participants && currentCount.count + participantIds.length > tournament.max_participants) {
            return res.status(400).json({ success: false, message: 'Would exceed max participants' });
        }

        const insert = db.prepare(
            'INSERT OR IGNORE INTO tournament_participants (id, tournament_id, participant_id, seed) VALUES (?, ?, ?, ?)'
        );

        const addAll = db.transaction(() => {
            participantIds.forEach((pid, index) => {
                insert.run(randomUUID(), id, pid, currentCount.count + index + 1);
            });
        });

        addAll();

        const newCount: any = db.prepare(
            'SELECT COUNT(*) AS count FROM tournament_participants WHERE tournament_id = ?'
        ).get(id);

        res.json({ success: true, message: `${participantIds.length} participants added`, totalParticipants: newCount.count });
    } catch (error) {
        console.error('Add participants error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── POST /api/tournaments/:id/generate — Generate bracket ────────

router.post('/:id/generate', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const db = getDb();
        const { id } = req.params;

        const tournament: any = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const participants = db.prepare(
            'SELECT * FROM tournament_participants WHERE tournament_id = ? AND status = ? ORDER BY seed ASC NULLS LAST'
        ).all(id, 'active') as any[];

        if (participants.length < 2) {
            return res.status(400).json({ success: false, message: 'Need at least 2 participants to generate' });
        }

        // Clear existing matches for regeneration
        db.prepare('DELETE FROM matches WHERE tournament_id = ?').run(id);

        const currentPhase: any = db.prepare('SELECT * FROM tournament_phases WHERE tournament_id = ? AND status = ?').get(id, 'current');
        const phaseNum = currentPhase ? currentPhase.phase_number : 1;

        const formatConfig = JSON.parse(tournament.format_config || '{}');
        let result;

        switch (tournament.format) {
            case 'single-elimination':
                result = generateKnockoutBracket(id, participants, formatConfig, db);
                break;
            case 'double-elimination':
                result = generateDoubleEliminationBracket(id, participants, formatConfig, db);
                break;
            case 'round-robin':
                result = generateRoundRobinSchedule(id, participants, formatConfig, db);
                break;
            case 'battle-royale':
                // BR can have multiple rounds of lobbies
                result = generateBattleRoyaleLobbies(id, participants, formatConfig, db);
                break;
            case 'swiss':
                // Swiss generates the current round
                result = generateSwissRound(id, phaseNum, participants, formatConfig, db);
                break;
            case 'group-knockout':
                // Group Stage for Phase 1, Knockout for Phase 2+
                if (phaseNum === 1) {
                    result = generateGroups(id, participants, formatConfig, db);
                } else {
                    result = generateKnockoutBracket(id, participants, formatConfig, db);
                }
                break;
            default:
                return res.status(400).json({ success: false, message: `Format '${tournament.format}' generation not yet implemented` });
        }

        // Activate the tournament
        db.prepare("UPDATE tournaments SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(id);

        res.json({ success: true, message: 'Bracket generated', ...result });
    } catch (error) {
        console.error('Generate bracket error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── POST /api/tournaments/:id/advance-phase — Advance phase ─────

router.post('/:id/advance-phase', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const db = getDb();
        const { id } = req.params;

        const phases = db.prepare(
            'SELECT * FROM tournament_phases WHERE tournament_id = ? ORDER BY phase_number ASC'
        ).all(id) as any[];

        if (phases.length === 0) {
            return res.status(400).json({ success: false, message: 'No phases defined for this tournament' });
        }

        const currentPhase = phases.find((p: any) => p.status === 'current');
        if (!currentPhase) {
            return res.status(400).json({ success: false, message: 'No current phase found' });
        }

        const tournament: any = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
        const formatConfig = JSON.parse(tournament.format_config || '{}');
        const qualCount = formatConfig.qualificationCount || 0;

        const nextPhase = phases.find((p: any) => p.phase_number === currentPhase.phase_number + 1);

        const advance = db.transaction(() => {
            // 1. Logic for qualification (Eliminate players)
            if (qualCount > 0) {
                const { standings } = calculateStandings(tournament, db);
                const qualifiedIds = new Set<string>();

                if (tournament.format === 'group-knockout') {
                    // Top N from each group
                    const groups: Record<number, any[]> = {};
                    standings.forEach((s: any) => {
                        const g = s.group_number || 0;
                        if (!groups[g]) groups[g] = [];
                        groups[g].push(s);
                    });

                    Object.values(groups).forEach(groupStandings => {
                        groupStandings.sort((a, b) => b.points - a.points || b.pointDiff - a.pointDiff);
                        groupStandings.slice(0, qualCount).forEach(s => qualifiedIds.add(s.participant_id));
                    });
                } else {
                    // Top N overall (e.g. from BR lobbies or Swiss)
                    standings.slice(0, qualCount).forEach(s => qualifiedIds.add(s.participant_id));
                }

                if (qualifiedIds.size > 0) {
                    const allParticipants = db.prepare('SELECT participant_id FROM tournament_participants WHERE tournament_id = ?').all(id) as any[];
                    const eliminate = db.prepare("UPDATE tournament_participants SET status = 'eliminated' WHERE tournament_id = ? AND participant_id = ?");

                    allParticipants.forEach(p => {
                        if (!qualifiedIds.has(p.participant_id)) {
                            eliminate.run(id, p.participant_id);

                            // Also update user's tournament status if they are eliminated from the only tournament they're in
                            // (Simplified: just set to eliminated for now)
                            db.prepare("UPDATE users SET tournament_status = 'eliminated' WHERE id = ? AND role = 'PLAYER'").run(p.participant_id);
                        }
                    });
                }
            }

            // 2. Complete current phase
            db.prepare("UPDATE tournament_phases SET status = 'completed', completed_at = datetime('now') WHERE id = ?")
                .run(currentPhase.id);

            // 3. Activate next phase (if exists)
            if (nextPhase) {
                db.prepare("UPDATE tournament_phases SET status = 'current', started_at = datetime('now') WHERE id = ?")
                    .run(nextPhase.id);
            } else {
                // All phases complete — mark tournament as completed
                db.prepare("UPDATE tournaments SET status = 'completed', updated_at = datetime('now') WHERE id = ?")
                    .run(id);
            }
        });

        advance();

        res.json({
            success: true,
            message: nextPhase ? `Advanced to phase ${nextPhase.phase_number}: ${nextPhase.label}` : 'Tournament completed — all phases finished',
            completedPhase: currentPhase.label,
            nextPhase: nextPhase ? nextPhase.label : null,
        });
    } catch (error) {
        console.error('Advance phase error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/tournaments/:id/matches — Get matches ───────────────

router.get('/:id/matches', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const { id } = req.params;
        const round = req.query.round ? parseInt(req.query.round as string) : undefined;

        const tournament: any = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const participantType = tournament.participant_type;

        let query: string;
        let params: any[];

        if (participantType === 'team') {
            query = `
                SELECT m.*,
                    t1.name AS participant1_name,
                    t2.name AS participant2_name,
                    tw.name AS winner_name
                FROM matches m
                LEFT JOIN teams t1 ON m.participant1_id = t1.id
                LEFT JOIN teams t2 ON m.participant2_id = t2.id
                LEFT JOIN teams tw ON m.winner_id = tw.id
                WHERE m.tournament_id = ?
                ${round ? 'AND m.round_number = ?' : ''}
                ORDER BY m.round_number ASC, m.match_number ASC
            `;
        } else {
            query = `
                SELECT m.*,
                    u1.username AS participant1_name,
                    u2.username AS participant2_name,
                    uw.username AS winner_name
                FROM matches m
                LEFT JOIN users u1 ON m.participant1_id = u1.id
                LEFT JOIN users u2 ON m.participant2_id = u2.id
                LEFT JOIN users uw ON m.winner_id = uw.id
                WHERE m.tournament_id = ?
                ${round ? 'AND m.round_number = ?' : ''}
                ORDER BY m.round_number ASC, m.match_number ASC
            `;
        }

        params = round ? [id, round] : [id];
        const matches = db.prepare(query).all(...params);

        // Group by round
        const rounds: Record<number, any[]> = {};
        (matches as any[]).forEach(m => {
            if (!rounds[m.round_number]) rounds[m.round_number] = [];
            rounds[m.round_number].push(m);
        });

        res.json({ success: true, matches, rounds });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/tournaments/:id/matches/:matchId/participants — Lobby participants 
router.get('/:id/matches/:matchId/participants', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const { matchId } = req.params;

        const participants = db.prepare(`
            SELECT mp.*, 
                CASE 
                    WHEN t.id IS NOT NULL THEN t.name
                    ELSE u.username
                END AS participant_name
            FROM match_participants mp
            LEFT JOIN tournament_participants tp ON mp.participant_id = tp.participant_id
            LEFT JOIN teams t ON tp.participant_id = t.id
            LEFT JOIN users u ON tp.participant_id = u.id
            WHERE mp.match_id = ?
        `).all(matchId);

        res.json({ success: true, participants });
    } catch (error) {
        console.error('Get lobby participants error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── PUT /api/tournaments/:id/matches/:matchId — Report result ────

router.put('/:id/matches/:matchId', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const { winnerId, score1, score2, lobbyResults } = reportMatchSchema.parse(req.body);
        const db = getDb();
        const { id, matchId } = req.params;

        const match: any = db.prepare(
            'SELECT * FROM matches WHERE id = ? AND tournament_id = ?'
        ).get(matchId, id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        if (match.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Match already completed' });
        }

        // Verify winner is a participant in this match
        if (winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
            return res.status(400).json({ success: false, message: 'Winner must be a participant in this match' });
        }

        const loserId = winnerId === match.participant1_id ? match.participant2_id : match.participant1_id;

        const tournament: any = db.prepare('SELECT format FROM tournaments WHERE id = ?').get(id);

        const reportResult = db.transaction(() => {
            // Update match
            db.prepare(`
                UPDATE matches SET winner_id = ?, score1 = ?, score2 = ?, status = 'completed', completed_at = datetime('now')
                WHERE id = ?
            `).run(winnerId, score1, score2, matchId);

            // Format-specific advancement
            if (tournament.format === 'single-elimination') {
                // Advance winner to next round
                const nextRound = match.round_number + 1;
                const nextMatchNumber = Math.ceil(match.match_number / 2);

                const nextMatch: any = db.prepare(
                    'SELECT * FROM matches WHERE tournament_id = ? AND round_number = ? AND match_number = ?'
                ).get(id, nextRound, nextMatchNumber);

                if (nextMatch) {
                    if (match.match_number % 2 === 1) {
                        db.prepare('UPDATE matches SET participant1_id = ? WHERE id = ?').run(winnerId, nextMatch.id);
                    } else {
                        db.prepare('UPDATE matches SET participant2_id = ? WHERE id = ?').run(winnerId, nextMatch.id);
                    }
                }

                if (loserId) {
                    db.prepare("UPDATE tournament_participants SET status = 'eliminated' WHERE tournament_id = ? AND participant_id = ?")
                        .run(id, loserId);
                }
            } else if (tournament.format === 'double-elimination') {
                const round = match.round_number;
                const mNum = match.match_number;

                if (round < 100) {
                    // ── Winners Bracket Advancement ──
                    const nextRound = round + 1;
                    const nextMatchNumber = Math.ceil(mNum / 2);

                    // A. Advance winner (if not final WB match)
                    const nextMatchWB: any = db.prepare(
                        'SELECT * FROM matches WHERE tournament_id = ? AND round_number = ? AND match_number = ?'
                    ).get(id, nextRound, nextMatchNumber);

                    if (nextMatchWB) {
                        if (mNum % 2 === 1) db.prepare('UPDATE matches SET participant1_id = ? WHERE id = ?').run(winnerId, nextMatchWB.id);
                        else db.prepare('UPDATE matches SET participant2_id = ? WHERE id = ?').run(winnerId, nextMatchWB.id);
                    } else if (round > 0) {
                        // Winner of WB Final goes to Grand Final (Round 200)
                        db.prepare('UPDATE matches SET participant1_id = ? WHERE tournament_id = ? AND round_number = 200').run(winnerId, id);
                    }

                    // B. Drop loser to Losers Bracket (Round 101, 102, etc.)
                    // Simplification: WB R1 losers -> LB R1, WB R2 losers -> LB R2, etc.
                    if (loserId) {
                        const lbRound = round === 1 ? 101 : 100 + (round - 1) * 2;
                        const lbMatch: any = db.prepare(
                            'SELECT * FROM matches WHERE tournament_id = ? AND round_number = ? AND match_number = ?'
                        ).get(id, lbRound, mNum);
                        if (lbMatch) {
                            // Logic for which slot in LB is complex, default to p1/p2 toggle
                            db.prepare('UPDATE matches SET participant1_id = ? WHERE id = ?').run(loserId, lbMatch.id);
                        }
                    }
                } else if (round >= 101 && round < 200) {
                    // ── Losers Bracket Advancement ──
                    const lbRoundNum = round - 100;
                    const nextLB = round + 1;
                    const isWinningRound = lbRoundNum % 2 === 1; // Round where winners play each other

                    const nextMatchNumber = isWinningRound ? mNum : Math.ceil(mNum / 2);
                    const isSlot1 = isWinningRound ? false : (mNum % 2 === 1);

                    const nextMatchLB: any = db.prepare(
                        'SELECT * FROM matches WHERE tournament_id = ? AND round_number = ? AND match_number = ?'
                    ).get(id, nextLB, nextMatchNumber);

                    if (nextMatchLB) {
                        if (isWinningRound) db.prepare('UPDATE matches SET participant2_id = ? WHERE id = ?').run(winnerId, nextMatchLB.id);
                        else if (isSlot1) db.prepare('UPDATE matches SET participant1_id = ? WHERE id = ?').run(winnerId, nextMatchLB.id);
                        else db.prepare('UPDATE matches SET participant2_id = ? WHERE id = ?').run(winnerId, nextMatchLB.id);
                    } else {
                        // Winner of LB Final goes to Grand Final (Round 200) Slot 2
                        db.prepare('UPDATE matches SET participant2_id = ? WHERE tournament_id = ? AND round_number = 200').run(winnerId, id);
                    }

                    // Eliminate loser
                    if (loserId) {
                        db.prepare("UPDATE tournament_participants SET status = 'eliminated' WHERE tournament_id = ? AND participant_id = ?")
                            .run(id, loserId);
                    }
                } else if (round === 200) {
                    // ── Grand Final ──
                    if (winnerId === match.participant2_id) {
                        // LB winner won! RESET happens (Round 201)
                        db.prepare('UPDATE matches SET participant1_id = ?, participant2_id = ? WHERE tournament_id = ? AND round_number = 201')
                            .run(match.participant1_id, match.participant2_id, id);
                    } else {
                        // WB winner won! Tournament over.
                        db.prepare('DELETE FROM matches WHERE tournament_id = ? AND round_number = 201').run(id);
                    }
                }
            } else if (tournament.format === 'battle-royale') {
                if (lobbyResults && lobbyResults.length > 0) {
                    lobbyResults.forEach((res: any) => {
                        db.prepare(`
                            UPDATE match_participants 
                            SET rank = ?, score = ?, kills = ?, status = 'completed'
                            WHERE match_id = ? AND participant_id = ?
                        `).run(res.rank || null, res.score || 0, res.kills || 0, matchId, res.participantId);
                    });

                    const winner = lobbyResults.find(r => r.rank === 1);
                    if (winner) {
                        db.prepare("UPDATE matches SET winner_id = ? WHERE id = ?").run(winner.participantId, matchId);
                    }
                }
            }
        });

        reportResult();

        res.json({ success: true, message: 'Match result recorded' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Report match error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

function calculateStandings(tournament: any, db: any) {
    const id = tournament.id;
    const formatConfig = JSON.parse(tournament.format_config || '{}');

    const participants = db.prepare(`
        SELECT tp.participant_id, tp.status, tp.group_number,
            CASE
                WHEN '${tournament.participant_type}' = 'team' THEN t.name
                ELSE u.username
            END AS name
        FROM tournament_participants tp
        LEFT JOIN teams t ON tp.participant_id = t.id AND '${tournament.participant_type}' = 'team'
        LEFT JOIN users u ON tp.participant_id = u.id AND '${tournament.participant_type}' = 'player'
        WHERE tp.tournament_id = ?
    `).all(id) as any[];

    const completedMatches = db.prepare(
        "SELECT * FROM matches WHERE tournament_id = ? AND status = 'completed'"
    ).all(id) as any[];

    if (tournament.format === 'round-robin' || tournament.format === 'group-knockout') {
        const standings = participants.map(p => {
            const wins = completedMatches.filter(m => m.winner_id === p.participant_id).length;
            const played = completedMatches.filter(m =>
                m.participant1_id === p.participant_id || m.participant2_id === p.participant_id
            ).length;
            const losses = played - wins;

            let pointsFor = 0;
            let pointsAgainst = 0;
            completedMatches.forEach(m => {
                if (m.participant1_id === p.participant_id) {
                    pointsFor += m.score1 || 0;
                    pointsAgainst += m.score2 || 0;
                } else if (m.participant2_id === p.participant_id) {
                    pointsFor += m.score2 || 0;
                    pointsAgainst += m.score1 || 0;
                }
            });

            return {
                participant_id: p.participant_id,
                name: p.name,
                group_number: p.group_number,
                played,
                wins,
                losses,
                points: wins * 3,
                pointDiff: pointsFor - pointsAgainst,
            };
        }).sort((a, b) => {
            // Sort by group first, then points
            if (a.group_number !== b.group_number) return (a.group_number || 0) - (b.group_number || 0);
            return b.points - a.points || b.pointDiff - a.pointDiff;
        });

        return { format: tournament.format, standings };
    }

    if (tournament.format === 'battle-royale') {
        const mps = db.prepare(`
            SELECT mp.*, m.round_number as set_number
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.id
            WHERE m.tournament_id = ? AND m.status = 'completed'
        `).all(id) as any[];

        const standings = participants.map(p => {
            const playerMps = mps.filter(m => m.participant_id === p.participant_id);
            const totalKills = playerMps.reduce((acc, curr) => acc + (curr.kills || 0), 0);
            const avgRank = playerMps.length > 0
                ? playerMps.reduce((acc, curr) => acc + (curr.rank || 0), 0) / playerMps.length
                : 999;
            const totalScore = playerMps.reduce((acc, curr) => acc + (curr.score || 0), 0);

            return {
                participant_id: p.participant_id,
                name: p.name,
                played: playerMps.length,
                totalKills,
                avgRank: parseFloat(avgRank.toFixed(2)),
                totalScore,
            };
        }).sort((a, b) => b.totalScore - a.totalScore || a.avgRank - b.avgRank || b.totalKills - a.totalKills);

        return { format: 'battle-royale', standings };
    }

    return { format: tournament.format, standings: [] };
}

// ── GET /api/tournaments/:id/standings — Standings ───────────────

router.get('/:id/standings', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const { id } = req.params;

        const tournament: any = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        const data = calculateStandings(tournament, db);
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('Standings error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
