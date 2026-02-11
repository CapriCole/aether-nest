import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store DB file in project root
const DB_PATH = path.join(__dirname, '..', 'aethernest.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
    migrateDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PLAYER' CHECK(role IN ('ADMIN', 'PLAYER', 'MODERATOR', 'COMMENTATOR')),
      must_change_password INTEGER NOT NULL DEFAULT 1,
      
      -- COD Mobile Identity
      codm_ign TEXT,
      codm_uid TEXT,
      codm_rank TEXT,
      
      -- Verification
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
      verification_screenshot TEXT,
      verification_notes TEXT,
      verified_by TEXT,
      verified_at TEXT,
      
      -- Tournament
      tournament_status TEXT NOT NULL DEFAULT 'none' CHECK(tournament_status IN ('none', 'qualified', 'team_leader', 'team_member', 'eliminated')),
      
      -- Meta
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      
      FOREIGN KEY (verified_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);
    CREATE INDEX IF NOT EXISTS idx_users_tournament ON users(tournament_status);

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      leader_id TEXT NOT NULL,
      max_size INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'recruiting' CHECK(status IN ('recruiting', 'full', 'locked', 'eliminated')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leader_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
    CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

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

    CREATE INDEX IF NOT EXISTS idx_applications_team ON team_applications(team_id);
    CREATE INDEX IF NOT EXISTS idx_applications_player ON team_applications(player_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON team_applications(status);

    -- Tournament system
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

    CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

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

    CREATE INDEX IF NOT EXISTS idx_phases_tournament ON tournament_phases(tournament_id);

    CREATE TABLE IF NOT EXISTS tournament_participants (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      seed INTEGER,
      group_number INTEGER, -- For Group Stage formats
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','eliminated','withdrawn')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      UNIQUE(tournament_id, participant_id)
    );

    CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);

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
      match_label TEXT,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (phase_id) REFERENCES tournament_phases(id)
    );

    CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

    CREATE TABLE IF NOT EXISTS match_participants (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      rank INTEGER, -- Placement in the match/lobby
      kills INTEGER DEFAULT 0, -- Specific for BR
      status TEXT DEFAULT 'active',
      FOREIGN KEY (match_id) REFERENCES matches(id),
      UNIQUE(match_id, participant_id)
    );

    CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
    CREATE INDEX IF NOT EXISTS idx_match_participants_participant ON match_participants(participant_id);
  `);
}

function migrateDb(db: Database.Database) {
  // Add tournament_status column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN tournament_status TEXT NOT NULL DEFAULT 'none' CHECK(tournament_status IN ('none', 'qualified', 'team_leader', 'team_member', 'eliminated'))`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_tournament ON users(tournament_status)`);

    // Add match_label to matches
    try {
      db.exec(`ALTER TABLE matches ADD COLUMN match_label TEXT`);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) console.error('Migration error:', e);
    }
  } catch (e: any) {
    // Column already exists — safe to ignore
    if (!e.message?.includes('duplicate column')) {
      console.error('Migration error:', e);
    }
  }
}

export function closeDb() {
  if (db) {
    db.close();
  }
}
