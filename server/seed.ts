/**
 * Seed script - Creates the first super-admin account.
 * Run with: npx tsx server/seed.ts
 * 
 * Default credentials:
 *   Username: admin
 *   Password: admin123
 *   (Must be changed on first login)
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'aethernest.db');

async function seed() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PLAYER' CHECK(role IN ('ADMIN', 'PLAYER', 'MODERATOR', 'COMMENTATOR')),
      must_change_password INTEGER NOT NULL DEFAULT 1,
      codm_ign TEXT,
      codm_uid TEXT,
      codm_rank TEXT,
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
      verification_screenshot TEXT,
      verification_notes TEXT,
      verified_by TEXT,
      verified_at TEXT,
      tournament_status TEXT NOT NULL DEFAULT 'none' CHECK(tournament_status IN ('none', 'qualified', 'team_leader', 'team_member', 'eliminated')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (verified_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      leader_id TEXT NOT NULL,
      max_size INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'recruiting' CHECK(status IN ('recruiting', 'full', 'locked', 'eliminated')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leader_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS team_applications (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (player_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      game_mode TEXT NOT NULL DEFAULT 'battle-royale',
      format TEXT NOT NULL CHECK(format IN (
        'single-elimination','double-elimination','round-robin',
        'swiss','battle-royale','group-knockout'
      )),
      format_config TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','registration','active','paused','completed','cancelled')),
      participant_type TEXT NOT NULL DEFAULT 'team' CHECK(participant_type IN ('team','player')),
      max_participants INTEGER,
      start_date TEXT,
      end_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tournament_phases (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      phase_number INTEGER NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('completed','current','locked')),
      route TEXT,
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );

    CREATE TABLE IF NOT EXISTS tournament_participants (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      seed INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','eliminated','withdrawn')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      UNIQUE(tournament_id, participant_id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      phase_id TEXT,
      round_number INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      participant1_id TEXT,
      participant2_id TEXT,
      winner_id TEXT,
      score1 INTEGER DEFAULT 0,
      score2 INTEGER DEFAULT 0,
      best_of INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','live','completed','cancelled')),
      scheduled_at TEXT,
      completed_at TEXT,
      room_code TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (phase_id) REFERENCES tournament_phases(id)
    );
  `);

  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (existing) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    db.close();
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role, must_change_password, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    'admin',
    'admin@aethernest.com',
    passwordHash,
    'ADMIN',
    1,  // must change password
    'verified'
  );

  console.log('✅ Super-admin account created successfully!');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   ⚠️  You MUST change this password on first login.');

  db.close();
}

seed().catch(console.error);
