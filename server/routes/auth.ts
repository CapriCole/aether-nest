import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// ── Validation Schemas ──────────────────────────────────────────

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    codmIGN: z.string().min(1).max(50),
    codmUID: z.string().min(1).max(20),
});

const changePasswordSchema = z.object({
    username: z.string().min(1),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

const adminCreateUserSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email().optional(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'PLAYER', 'MODERATOR', 'COMMENTATOR']),
});

// ── Helper: Verify JWT and extract user ──────────────────────────

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

// ── Login ────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const db = getDb();

        const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as any;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Block unverified PLAYER accounts
        if (user.role === 'PLAYER' && user.verification_status !== 'verified') {
            const statusMessages: Record<string, string> = {
                pending: 'Your account is pending admin verification. Please wait for approval.',
                rejected: 'Your verification was rejected. Please contact an admin.',
                unverified: 'Your account has not been verified yet. Please wait for admin review.',
            };
            return res.status(403).json({
                success: false,
                message: statusMessages[user.verification_status] || 'Account not verified',
                verificationStatus: user.verification_status,
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                mustChangePassword: !!user.must_change_password,
                tournamentStatus: user.tournament_status,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                mustChangePassword: !!user.must_change_password,
                verificationStatus: user.verification_status,
                tournamentStatus: user.tournament_status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Setup Admin (Vercel Only) ───────────────────────────────────
router.get('/setup-admin', async (req, res) => {
    // Only allow this in Vercel environment or if explicity enabled
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    try {
        const db = getDb();
        const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'ADMIN'").get();

        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin already exists' });
        }

        const passwordHash = await bcrypt.hash('admin123', 10);
        const userId = randomUUID();

        db.prepare(`
            INSERT INTO users (id, username, email, password_hash, role, must_change_password, verification_status, tournament_status)
            VALUES (?, 'admin', 'admin@example.com', ?, 'ADMIN', 1, 'verified', 'none')
        `).run(userId, passwordHash);

        res.json({
            success: true,
            message: 'Admin created. Username: admin, Password: admin123',
            user: { id: userId, username: 'admin', role: 'ADMIN' }
        });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Public Registration ──────────────────────────────────────────

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, codmIGN, codmUID } = registerSchema.parse(req.body);
        const db = getDb();

        // Check if username exists
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Check if email exists
        const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Check if COD Mobile UID exists
        const existingUID = db.prepare('SELECT id FROM users WHERE codm_uid = ?').get(codmUID);
        if (existingUID) {
            return res.status(400).json({ success: false, message: 'This COD Mobile UID is already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = randomUUID();

        db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, must_change_password, codm_ign, codm_uid, verification_status)
      VALUES (?, ?, ?, ?, 'PLAYER', 0, ?, ?, 'pending')
    `).run(userId, username, email, passwordHash, codmIGN, codmUID);

        // Do NOT return a JWT — player must wait for admin verification
        res.status(201).json({
            success: true,
            pendingApproval: true,
            message: 'Registration successful! Your account is pending admin verification of your COD Mobile identity.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Me (Verify Token) ───────────────────────────────────────────

router.get('/me', (req, res) => {
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false });
    }
    res.json({ success: true, user });
});

// ── Change Password ─────────────────────────────────────────────

router.post('/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        const db = getDb();

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime(\'now\') WHERE id = ?')
            .run(newHash, user.id);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Admin: Create User ──────────────────────────────────────────

router.post('/admin/create-user', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
        const { username, email, password, role } = adminCreateUserSchema.parse(req.body);
        const db = getDb();

        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = randomUUID();

        db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, must_change_password, verification_status)
      VALUES (?, ?, ?, ?, ?, 1, 'verified')
    `).run(userId, username, email || null, passwordHash, role);

        res.status(201).json({
            success: true,
            user: { id: userId, username, role, mustChangePassword: true },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        console.error('Admin create user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ── Admin: List Users ───────────────────────────────────────────

router.get('/admin/users', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const db = getDb();
    const users = db.prepare(`
    SELECT id, username, email, role, must_change_password, codm_ign, codm_uid, codm_rank,
           verification_status, verification_notes, verified_by, verified_at,
           tournament_status, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();

    res.json({ success: true, users });
});

// ── Admin: Verify Player ────────────────────────────────────────

router.post('/admin/verify-player/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject'

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    db.prepare(`
    UPDATE users 
    SET verification_status = ?, verification_notes = ?, verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, notes || '', admin.id, id);

    res.json({ success: true, message: `Player ${action === 'approve' ? 'verified' : 'rejected'} successfully` });
});

// ── Admin: Update User Role ─────────────────────────────────────

router.put('/admin/users/:id/role', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'PLAYER', 'MODERATOR', 'COMMENTATOR'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const db = getDb();
    db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, id);
    res.json({ success: true, message: 'Role updated' });
});

// ── Admin: Deactivate/Activate User ─────────────────────────────

router.put('/admin/users/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { isActive } = req.body;

    const db = getDb();
    db.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?').run(isActive ? 1 : 0, id);
    res.json({ success: true, message: isActive ? 'User activated' : 'User deactivated' });
});

// ── Admin: Update Tournament Status ─────────────────────────────

router.put('/admin/users/:id/tournament-status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { tournamentStatus } = req.body;

    const validStatuses = ['none', 'qualified', 'team_leader', 'team_member', 'eliminated'];
    if (!validStatuses.includes(tournamentStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid tournament status' });
    }

    const db = getDb();
    db.prepare('UPDATE users SET tournament_status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(tournamentStatus, id);
    res.json({ success: true, message: `Tournament status updated to ${tournamentStatus}` });
});

// ── Admin Platform Stats ─────────────────────────────────────────

router.get('/admin/stats', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const db = getDb();

    // User stats
    const totalUsers: any = db.prepare("SELECT COUNT(*) AS count FROM users").get();
    const totalPlayers: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'PLAYER'").get();
    const pendingPlayers: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'PLAYER' AND verification_status = 'pending'").get();
    const verifiedPlayers: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'PLAYER' AND verification_status = 'verified'").get();
    const qualifiedPlayers: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'PLAYER' AND tournament_status = 'qualified'").get();
    const teamLeaders: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE tournament_status = 'team_leader'").get();
    const teamMembers: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE tournament_status = 'team_member'").get();
    const eliminated: any = db.prepare("SELECT COUNT(*) AS count FROM users WHERE tournament_status = 'eliminated'").get();

    // Team stats
    const totalTeams: any = db.prepare("SELECT COUNT(*) AS count FROM teams").get();
    const recruitingTeams: any = db.prepare("SELECT COUNT(*) AS count FROM teams WHERE status = 'recruiting'").get();
    const fullTeams: any = db.prepare("SELECT COUNT(*) AS count FROM teams WHERE status = 'full'").get();

    // Application stats
    const pendingApps: any = db.prepare("SELECT COUNT(*) AS count FROM team_applications WHERE status = 'pending'").get();
    const acceptedApps: any = db.prepare("SELECT COUNT(*) AS count FROM team_applications WHERE status = 'accepted'").get();
    const rejectedApps: any = db.prepare("SELECT COUNT(*) AS count FROM team_applications WHERE status = 'rejected'").get();

    // Recent activity (last 10 events)
    const recentUsers = db.prepare(`
        SELECT id, username, role, verification_status, tournament_status, created_at, 'registration' AS event_type
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
    `).all();

    const recentApps = db.prepare(`
        SELECT ta.id, ta.status, ta.created_at, ta.updated_at,
               u.username AS player_name, t.name AS team_name,
               'application' AS event_type
        FROM team_applications ta
        JOIN users u ON ta.player_id = u.id
        JOIN teams t ON ta.team_id = t.id
        ORDER BY ta.updated_at DESC
        LIMIT 5
    `).all();

    res.json({
        success: true,
        stats: {
            users: {
                total: totalUsers.count,
                players: totalPlayers.count,
                pending: pendingPlayers.count,
                verified: verifiedPlayers.count,
                qualified: qualifiedPlayers.count,
                teamLeaders: teamLeaders.count,
                teamMembers: teamMembers.count,
                eliminated: eliminated.count,
            },
            teams: {
                total: totalTeams.count,
                recruiting: recruitingTeams.count,
                full: fullTeams.count,
            },
            applications: {
                pending: pendingApps.count,
                accepted: acceptedApps.count,
                rejected: rejectedApps.count,
            },
            recentActivity: [...recentUsers, ...recentApps]
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10),
        },
    });
});

export default router;
