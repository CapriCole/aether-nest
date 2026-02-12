import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store DB file in project root
const SOURCE_DB_PATH = path.join(__dirname, '..', 'aethernest.db');

/**
 * Compatibility wrapper around sql.js Database to match the better-sqlite3 API
 * used by all route handlers (prepare/get/run/all pattern).
 */
class DatabaseWrapper {
  private _db: SqlJsDatabase;
  private _dbPath: string;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this._db = db;
    this._dbPath = dbPath;
  }

  prepare(sql: string) {
    const db = this._db;
    const dbPath = this._dbPath;
    return {
      get(...params: any[]): any {
        try {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row: any = {};
            cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          throw e;
        }
      },
      all(...params: any[]): any[] {
        try {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const rows: any[] = [];
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row: any = {};
            cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
            rows.push(row);
          }
          stmt.free();
          return rows;
        } catch (e) {
          throw e;
        }
      },
      run(...params: any[]): { changes: number } {
        try {
          db.run(sql, params);
          // Save to disk after writes
          saveToDisk(db, dbPath);
          return { changes: db.getRowsModified() };
        } catch (e) {
          throw e;
        }
      }
    };
  }

  exec(sql: string) {
    this._db.exec(sql);
    saveToDisk(this._db, this._dbPath);
  }

  pragma(pragma: string) {
    try {
      this._db.exec(`PRAGMA ${pragma}`);
    } catch (e) {
      console.warn(`Could not set PRAGMA ${pragma}:`, e);
    }
  }

  close() {
    this._db.close();
  }
}

function saveToDisk(db: SqlJsDatabase, dbPath: string) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.warn('Could not save DB to disk:', e);
  }
}

let db: DatabaseWrapper;
let initPromise: Promise<void> | null = null;

async function initDbAsync(): Promise<void> {
  if (db) return;

  const SQL = await initSqlJs();

  let dbPath = SOURCE_DB_PATH;

  // Vercel-specific: Use /tmp (writable)
  if (process.env.VERCEL) {
    const TMP_DB_PATH = '/tmp/aethernest.db';
    try {
      if (!fs.existsSync(TMP_DB_PATH)) {
        const searchPaths = [
          SOURCE_DB_PATH,
          path.join(process.cwd(), 'aethernest.db'),
          path.join(process.cwd(), 'api', 'aethernest.db'),
          path.join(__dirname, 'aethernest.db'),
        ];

        let foundDbPath = null;
        for (const p of searchPaths) {
          if (fs.existsSync(p)) {
            foundDbPath = p;
            break;
          }
        }

        if (foundDbPath) {
          fs.copyFileSync(foundDbPath, TMP_DB_PATH);
          console.log(`Copied database from ${foundDbPath} to ${TMP_DB_PATH}`);
        } else {
          console.warn(`Source database not found in [${searchPaths.join(', ')}]. Creating new empty DB at ${TMP_DB_PATH}`);
          try {
            console.log('Files in CWD:', fs.readdirSync(process.cwd()).join(', '));
          } catch (e) { console.error('Error listing files:', e); }
        }
      }
      dbPath = TMP_DB_PATH;
    } catch (err) {
      console.error('Failed to copy DB to /tmp:', err);
    }
  }

  try {
    let sqlDb: SqlJsDatabase;

    // Load existing DB from file if it exists, otherwise create fresh
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      sqlDb = new SQL.Database(fileBuffer);
      console.log('Loaded existing database from:', dbPath);
    } else {
      sqlDb = new SQL.Database();
      console.log('Created new database, will save to:', dbPath);
    }

    db = new DatabaseWrapper(sqlDb, dbPath);

    try {
      db.pragma('journal_mode = WAL');
    } catch (e) {
      console.warn('Could not set WAL mode:', e);
    }
    db.pragma('foreign_keys = ON');
    initializeDb(db);
    migrateDb(db);
    seedAdmin(db);
    console.log('Database initialized successfully at:', dbPath);
  } catch (dbError: any) {
    console.error('CRITICAL: Failed to open/initialize database:', {
      path: dbPath,
      error: dbError?.message || dbError,
      isVercel: !!process.env.VERCEL,
      cwd: process.cwd(),
    });
    throw dbError;
  }
}

// Eagerly start initialization
initPromise = initDbAsync().catch(err => {
  console.error('Background DB init failed:', err);
});

export function getDb(): DatabaseWrapper {
  if (!db) {
    throw new Error('Database not initialized yet. Call ensureDbReady() first.');
  }
  return db;
}

export async function ensureDbReady(): Promise<void> {
  if (db) return;
  if (initPromise) {
    await initPromise;
  } else {
    await initDbAsync();
  }
}

function seedAdmin(dbw: DatabaseWrapper) {
  try {
    const adminRole = dbw.prepare("SELECT id FROM users WHERE role = 'ADMIN'").get();
    if (!adminRole) {
      console.log('Seeding initial admin user...');
      const hash = bcrypt.hashSync('admin123', 10);
      const id = randomUUID();
      dbw.prepare(`
          INSERT INTO users (id, username, email, password_hash, role, must_change_password, verification_status, tournament_status)
          VALUES (?, 'admin', 'admin@example.com', ?, 'ADMIN', 1, 'verified', 'none')
        `).run(id, hash);
      console.log('Admin user created: admin / admin123');
    }
  } catch (err) {
    console.error('Failed to seed admin:', err);
  }
}


function initializeDb(dbw: DatabaseWrapper) {
  dbw.exec(`
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
      group_number INTEGER,
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
      rank INTEGER,
      kills INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (match_id) REFERENCES matches(id),
      UNIQUE(match_id, participant_id)
    );

    CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
    CREATE INDEX IF NOT EXISTS idx_match_participants_participant ON match_participants(participant_id);
  `);
}

function migrateDb(dbw: DatabaseWrapper) {
  try {
    dbw.exec(`ALTER TABLE users ADD COLUMN tournament_status TEXT NOT NULL DEFAULT 'none' CHECK(tournament_status IN ('none', 'qualified', 'team_leader', 'team_member', 'eliminated'))`);
    dbw.exec(`CREATE INDEX IF NOT EXISTS idx_users_tournament ON users(tournament_status)`);

    try {
      dbw.exec(`ALTER TABLE matches ADD COLUMN match_label TEXT`);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) console.error('Migration error:', e);
    }
  } catch (e: any) {
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
