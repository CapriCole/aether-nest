import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const db = new Database('aethernest.db');

console.log("Checking database...");

// Ensure users table exists (simplified schema for seed)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PLAYER',
    must_change_password INTEGER NOT NULL DEFAULT 1,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    verification_screenshot TEXT,
    verification_notes TEXT,
    verified_by TEXT,
    verified_at TEXT,
    tournament_status TEXT NOT NULL DEFAULT 'none',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    codm_ign TEXT, codm_uid TEXT, codm_rank TEXT
  );
`);

async function seed() {
    const adminUser = 'admin';
    const adminPass = 'admin123';
    console.log(`Hashing password for user '${adminUser}'...`);
    const hash = await bcrypt.hash(adminPass, 10);
    const id = randomUUID();

    try {
        const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(adminUser);
        if (existing) {
            console.log("Admin user already exists. Updating password...");
            db.prepare("UPDATE users SET password_hash = ?, role = 'ADMIN' WHERE username = ?").run(hash, adminUser);
        } else {
            console.log("Creating admin user...");
            db.prepare(`
                INSERT INTO users (id, username, email, password_hash, role, must_change_password, verification_status, tournament_status)
                VALUES (?, ?, 'admin@example.com', ?, 'ADMIN', 1, 'verified', 'none')
            `).run(id, adminUser, hash);
        }
        console.log("Admin setup complete. User: 'admin', Pass: 'admin123'");
    } catch (e) {
        console.error("Error seeding admin:", e);
    }
}

seed();
