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

const createTeamSchema = z.object({
    name: z.string().min(2).max(50),
    leaderId: z.string(),
    maxSize: z.number().int().min(2).max(20).optional().default(5),
});

const applySchema = z.object({
    message: z.string().max(200).optional().default(''),
});

const reviewSchema = z.object({
    status: z.enum(['accepted', 'rejected']),
});

// ── POST /api/teams — Admin creates a team ──────────────────────

router.post('/', async (req, res) => {
    try {
        const admin = requireAdmin(req, res);
        if (!admin) return;

        const { name, leaderId, maxSize } = createTeamSchema.parse(req.body);
        const db = getDb();

        // Verify leader exists and is a qualified player or team_leader
        const leader: any = db.prepare('SELECT id, username, role, tournament_status FROM users WHERE id = ?').get(leaderId);
        if (!leader) {
            return res.status(404).json({ success: false, message: 'Leader not found' });
        }
        if (leader.role !== 'PLAYER') {
            return res.status(400).json({ success: false, message: 'Leader must be a player' });
        }

        // Check if leader already leads a team
        const existingTeam: any = db.prepare('SELECT id FROM teams WHERE leader_id = ?').get(leaderId);
        if (existingTeam) {
            return res.status(409).json({ success: false, message: 'This player already leads a team' });
        }

        const teamId = randomUUID();

        // Transaction: create team + set leader status
        const createTeam = db.transaction(() => {
            db.prepare('INSERT INTO teams (id, name, leader_id, max_size) VALUES (?, ?, ?, ?)').run(teamId, name, leaderId, maxSize);
            db.prepare("UPDATE users SET tournament_status = 'team_leader', updated_at = datetime('now') WHERE id = ?").run(leaderId);
        });
        createTeam();

        res.status(201).json({
            success: true,
            team: { id: teamId, name, leaderId, maxSize, status: 'recruiting' },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Create team error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/teams — List all teams with member counts ──────────

router.get('/', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();

        const teams = db.prepare(`
            SELECT
                t.id, t.name, t.max_size, t.status, t.created_at,
                t.leader_id,
                u.username AS leader_name,
                u.codm_ign AS leader_ign,
                (SELECT COUNT(*) FROM team_applications ta WHERE ta.team_id = t.id AND ta.status = 'accepted') AS member_count,
                (SELECT COUNT(*) FROM team_applications ta WHERE ta.team_id = t.id AND ta.status = 'pending') AS pending_count
            FROM teams t
            JOIN users u ON t.leader_id = u.id
            ORDER BY t.created_at DESC
        `).all();

        res.json({ success: true, teams });
    } catch (error) {
        console.error('List teams error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/teams/lobby — Unassigned qualified players ─────────

router.get('/lobby', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();

        const players = db.prepare(`
            SELECT id, username, codm_ign, codm_rank, created_at
            FROM users
            WHERE role = 'PLAYER'
              AND verification_status = 'verified'
              AND tournament_status = 'qualified'
              AND is_active = 1
            ORDER BY username ASC
        `).all();

        res.json({ success: true, players });
    } catch (error) {
        console.error('Lobby error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/teams/my-applications — Player's own applications ──

router.get('/my-applications', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();

        const applications = db.prepare(`
            SELECT
                ta.id, ta.team_id, ta.message, ta.status, ta.created_at, ta.updated_at,
                t.name AS team_name,
                u.username AS leader_name
            FROM team_applications ta
            JOIN teams t ON ta.team_id = t.id
            JOIN users u ON t.leader_id = u.id
            WHERE ta.player_id = ?
            ORDER BY ta.created_at DESC
        `).all(user.id);

        res.json({ success: true, applications });
    } catch (error) {
        console.error('My applications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/teams/:id — Team detail + roster ───────────────────

router.get('/:id', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const { id } = req.params;

        const team: any = db.prepare(`
            SELECT t.*, u.username AS leader_name, u.codm_ign AS leader_ign
            FROM teams t
            JOIN users u ON t.leader_id = u.id
            WHERE t.id = ?
        `).get(id);

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Get accepted members (the roster)
        const members = db.prepare(`
            SELECT u.id, u.username, u.codm_ign, u.codm_rank, ta.created_at AS joined_at
            FROM team_applications ta
            JOIN users u ON ta.player_id = u.id
            WHERE ta.team_id = ? AND ta.status = 'accepted'
            ORDER BY ta.created_at ASC
        `).all(id);

        res.json({ success: true, team, members });
    } catch (error) {
        console.error('Team detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── POST /api/teams/:id/apply — Player applies to a team ───────

router.post('/:id/apply', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const { message } = applySchema.parse(req.body);
        const db = getDb();
        const teamId = req.params.id;

        // Verify the team exists and is recruiting
        const team: any = db.prepare('SELECT id, status, max_size FROM teams WHERE id = ?').get(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        if (team.status !== 'recruiting') {
            return res.status(400).json({ success: false, message: 'Team is no longer recruiting' });
        }

        // Check: player must be qualified (in the lobby)
        const player: any = db.prepare('SELECT tournament_status FROM users WHERE id = ?').get(user.id);
        if (!player || player.tournament_status !== 'qualified') {
            return res.status(400).json({ success: false, message: 'You must be a qualified player to apply' });
        }

        // Check: no pending application already
        const existingApp: any = db.prepare(
            "SELECT id FROM team_applications WHERE player_id = ? AND status = 'pending'"
        ).get(user.id);
        if (existingApp) {
            return res.status(409).json({ success: false, message: 'You already have a pending application. Wait for a response before applying elsewhere.' });
        }

        // Check: not already a member of any team
        const alreadyMember: any = db.prepare(
            "SELECT id FROM team_applications WHERE player_id = ? AND status = 'accepted'"
        ).get(user.id);
        if (alreadyMember) {
            return res.status(409).json({ success: false, message: 'You are already on a team' });
        }

        // Check team capacity
        const memberCount: any = db.prepare(
            "SELECT COUNT(*) AS count FROM team_applications WHERE team_id = ? AND status = 'accepted'"
        ).get(teamId);
        if (memberCount.count >= team.max_size - 1) { // -1 for leader
            return res.status(400).json({ success: false, message: 'Team is full' });
        }

        const appId = randomUUID();
        db.prepare(
            'INSERT INTO team_applications (id, team_id, player_id, message) VALUES (?, ?, ?, ?)'
        ).run(appId, teamId, user.id, message);

        res.status(201).json({
            success: true,
            application: { id: appId, teamId, status: 'pending' },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Apply error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── GET /api/teams/:id/applications — View applications ─────────

router.get('/:id/applications', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const db = getDb();
        const teamId = req.params.id;

        // Verify the team exists
        const team: any = db.prepare('SELECT id, leader_id FROM teams WHERE id = ?').get(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Only the leader or admin can view applications
        if (user.id !== team.leader_id && user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Only the team leader or admin can view applications' });
        }

        const applications = db.prepare(`
            SELECT
                ta.id, ta.team_id, ta.player_id, ta.message, ta.status,
                ta.created_at, ta.updated_at,
                u.username AS player_name,
                u.codm_ign AS player_ign,
                u.codm_rank AS player_rank
            FROM team_applications ta
            JOIN users u ON ta.player_id = u.id
            WHERE ta.team_id = ?
            ORDER BY
                CASE ta.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,
                ta.created_at DESC
        `).all(teamId);

        res.json({ success: true, applications });
    } catch (error) {
        console.error('Applications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── PUT /api/teams/applications/:appId — Accept or reject ───────

router.put('/applications/:appId', async (req, res) => {
    try {
        const user = requireAuth(req, res);
        if (!user) return;

        const { status } = reviewSchema.parse(req.body);
        const db = getDb();
        const { appId } = req.params;

        // Get the application
        const app: any = db.prepare(`
            SELECT ta.*, t.leader_id, t.max_size, t.id AS team_id
            FROM team_applications ta
            JOIN teams t ON ta.team_id = t.id
            WHERE ta.id = ?
        `).get(appId);

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Only the leader or admin can review
        if (user.id !== app.leader_id && user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Only the team leader or admin can review applications' });
        }

        if (app.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Application already ${app.status}` });
        }

        if (status === 'accepted') {
            // Check team capacity before accepting
            const memberCount: any = db.prepare(
                "SELECT COUNT(*) AS count FROM team_applications WHERE team_id = ? AND status = 'accepted'"
            ).get(app.team_id);

            if (memberCount.count >= app.max_size - 1) { // -1 for leader
                return res.status(400).json({ success: false, message: 'Team is full — cannot accept more members' });
            }

            // Transaction: accept application + update player status + auto-reject other pending apps from this player + check if team is now full
            const acceptPlayer = db.transaction(() => {
                // Accept this application
                db.prepare("UPDATE team_applications SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(appId);

                // Update player to team_member
                db.prepare("UPDATE users SET tournament_status = 'team_member', updated_at = datetime('now') WHERE id = ?").run(app.player_id);

                // Auto-reject any other pending applications from this player
                db.prepare("UPDATE team_applications SET status = 'rejected', updated_at = datetime('now') WHERE player_id = ? AND id != ? AND status = 'pending'").run(app.player_id, appId);

                // Check if team is now full
                const newCount: any = db.prepare(
                    "SELECT COUNT(*) AS count FROM team_applications WHERE team_id = ? AND status = 'accepted'"
                ).get(app.team_id);
                if (newCount.count >= app.max_size - 1) {
                    db.prepare("UPDATE teams SET status = 'full' WHERE id = ?").run(app.team_id);
                    // Auto-reject remaining pending applications for this team
                    db.prepare("UPDATE team_applications SET status = 'rejected', updated_at = datetime('now') WHERE team_id = ? AND status = 'pending'").run(app.team_id);
                }
            });
            acceptPlayer();

            res.json({ success: true, message: 'Player accepted — status updated to team_member' });
        } else {
            // Reject — player stays qualified (lobby)
            db.prepare("UPDATE team_applications SET status = 'rejected', updated_at = datetime('now') WHERE id = ?").run(appId);

            res.json({ success: true, message: 'Application rejected — player remains in the lobby' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Review application error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
