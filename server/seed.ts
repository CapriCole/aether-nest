/**
 * Seed script - Creates the first super-admin account.
 * Run with: npx tsx server/seed.ts
 * 
 * Default credentials:
 *   Username: admin
 *   Password: admin123
 *   (Must be changed on first login)
 */

import { ensureDbReady, getDb, closeDb } from './db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

async function seed() {
  await ensureDbReady();
  const db = getDb();

  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (existing) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    // We don't close DB here because in sql.js/WASM it might not be trivial to "disconnect" cleanly in script mode without writing, but closeDb handles it.
    closeDb();
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

  closeDb();
}

seed().catch(console.error);
