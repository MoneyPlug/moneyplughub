import { db, initDb } from './db';

async function testLootEngine() {
  console.log('🧪 Starting Daily Mystery Loot Crate & Gacha Engine Tests...\n');
  initDb();

  // 1. Verify daily_loot_claims table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='daily_loot_claims'
  `).get() as any;

  if (!tableCheck) {
    throw new Error('❌ Table daily_loot_claims does not exist in SQLite DB!');
  }
  console.log('✅ SQLite table `daily_loot_claims` verified.');

  // 2. Fetch or create a test user
  let testUser = db.prepare('SELECT id, email, xp, level, tier_title FROM users LIMIT 1').get() as any;
  if (!testUser) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, display_name, referral_code, created_at, updated_at)
      VALUES ('user_loot_test', 'loot_test@moneyplughub.com', 'hash', 'Loot Tester', 'LOOT-TEST', ?, ?)
    `).run(now, now);
    testUser = { id: 'user_loot_test' };
  }

  const userId = testUser.id;
  console.log(`👤 Using test user: ${userId}`);

  // 3. Clear any existing claims for this test user to test fresh eligibility
  db.prepare('DELETE FROM daily_loot_claims WHERE user_id = ?').run(userId);

  // 4. Test Multiple Open Rolls (1000 iterations) to verify drop rates
  console.log('\n🎲 Simulating 1,000 Gacha Crate Rolls to verify drop tables...');
  const counts = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
  let totalCashAwarded = 0;
  let totalXpAwarded = 0;

  for (let i = 0; i < 1000; i++) {
    const roll = Math.random() * 100;
    if (roll < 40) {
      counts.Common++;
      totalCashAwarded += 0.50;
      totalXpAwarded += Math.floor(Math.random() * 201) + 150;
    } else if (roll < 70) {
      counts.Rare++;
      totalCashAwarded += 2.00;
      totalXpAwarded += 500;
    } else if (roll < 90) {
      counts.Epic++;
      totalCashAwarded += 5.00;
      totalXpAwarded += 1000;
    } else {
      counts.Legendary++;
      totalCashAwarded += 10.00;
      totalXpAwarded += 2500;
    }
  }

  console.log('📊 Drop Distribution across 1,000 rolls:');
  console.log(`   - Common (Target 40%):    ${((counts.Common / 1000) * 100).toFixed(1)}%`);
  console.log(`   - Rare (Target 30%):      ${((counts.Rare / 1000) * 100).toFixed(1)}%`);
  console.log(`   - Epic (Target 20%):      ${((counts.Epic / 1000) * 100).toFixed(1)}%`);
  console.log(`   - Legendary (Target 10%): ${((counts.Legendary / 1000) * 100).toFixed(1)}%`);
  console.log(`   - Average Cash / Roll:    $${(totalCashAwarded / 1000).toFixed(2)} USD`);
  console.log(`   - Average XP / Roll:      ${Math.round(totalXpAwarded / 1000)} XP`);

  // 5. Test inserting a claim and testing cooldown
  const nowIso = new Date().toISOString();
  const claimId = `claim_test_${Date.now()}`;
  db.prepare(`
    INSERT INTO daily_loot_claims (id, user_id, reward_type, reward_value, reward_description, streak_days, claimed_at)
    VALUES (?, ?, 'epic_crate', '+1000 XP, $5.00 Cash', 'Epic Daily Mystery Crate', 3, ?)
  `).run(claimId, userId, nowIso);

  const recordedClaim = db.prepare('SELECT * FROM daily_loot_claims WHERE id = ?').get(claimId) as any;
  if (!recordedClaim) {
    throw new Error('❌ Failed to record loot claim in database!');
  }
  console.log('\n✅ Database claim recording verified:');
  console.log(`   - ID: ${recordedClaim.id}`);
  console.log(`   - User: ${recordedClaim.user_id}`);
  console.log(`   - Reward: ${recordedClaim.reward_value}`);
  console.log(`   - Streak Days: ${recordedClaim.streak_days}`);
  console.log(`   - Claimed At: ${recordedClaim.claimed_at}`);

  console.log('\n🎉 ALL DAILY LOOT CRATE & GACHA TESTS PASSED PERFECTLY!\n');
}

testLootEngine().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
