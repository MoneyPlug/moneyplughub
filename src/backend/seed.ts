import bcrypt from 'bcryptjs';
import { db, initDb, recordAuditLog, initializeUserFinancialProfile } from './db';
import { config } from './config';

export function seed(): void {
  initDb();
  console.log('Initializing database schema & quests at:', config.dbPath);

  // Check if admin user already exists
  const existingAdmin = db.prepare('SELECT id, email FROM users WHERE role = ?').get('admin') as any;

  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(config.admin.password, salt);
    const adminId = 'usr_admin_001';
    const now = new Date().toISOString();

    const insertAdmin = db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role, referral_code, referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 1500, 4, 12, 'Grand Money Plug', ?, ?)
    `);

    insertAdmin.run(
      adminId,
      config.admin.email.toLowerCase(),
      passwordHash,
      config.admin.displayName,
      'admin',
      'ADMIN-PLUG',
      now,
      now
    );

    initializeUserFinancialProfile(adminId, config.admin.email);

    recordAuditLog(
      adminId,
      'SYSTEM_BOOTSTRAP',
      'users',
      adminId,
      { email: config.admin.email, note: 'Default auditor and financial profile seeded' }
    );

    console.log('✅ Admin account seeded successfully:');
    console.log(`   Email: ${config.admin.email}`);
    console.log(`   Password: ${config.admin.password}`);
    console.log(`   Referral Code: ADMIN-PLUG`);
  } else {
    console.log(`ℹ️ Admin account already present (${existingAdmin.email})`);
    initializeUserFinancialProfile(existingAdmin.id, existingAdmin.email);
  }
}

if (require.main === module) {
  seed();
}
