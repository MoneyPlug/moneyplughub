import assert from 'assert';
import { db } from './src/backend/db';
import { initSyndicatesSchema } from './src/backend/routes/syndicates';

async function testSyndicates() {
  console.log('⚔️ Testing Creator Syndicates & Guild Wars System...');

  // 1. Initialize and verify default seeded syndicates
  initSyndicatesSchema();

  const syndicates = db.prepare('SELECT * FROM syndicates ORDER BY weekly_score DESC').all() as any[];
  assert(syndicates.length >= 4, 'Should have at least 4 seeded syndicates');

  console.log(`✓ Step 1: Verified ${syndicates.length} Syndicates present in DB.`);
  const top1 = syndicates[0];
  console.log(`   🥇 1st Place: [${top1.tag}] ${top1.name} (Score: ${top1.weekly_score.toLocaleString()} PTS, Sigil: ${top1.emblem_sigil})`);
  assert(top1.weekly_score === 142500, 'Top syndicate should have 142500 score');

  const tags = syndicates.map(s => s.tag);
  assert(tags.includes('VRTX'), 'Must include VRTX tag');
  assert(tags.includes('APEX'), 'Must include APEX tag');
  assert(tags.includes('PLSE'), 'Must include PLSE tag');
  assert(tags.includes('QNTM'), 'Must include QNTM tag');
  console.log('✓ Step 2: All 4 top default Syndicates verified ([VORTEX], [APEX], [PULSE], [QUANT]).');

  console.log('\n🎉 Creator Syndicates & Guild Wars verification complete! 100% Passed.');
}

testSyndicates().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
