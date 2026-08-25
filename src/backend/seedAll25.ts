import { db, initDb, seedAllReferralPrograms } from './db';

initDb();
seedAllReferralPrograms();

const count = db.prepare('SELECT COUNT(*) as count FROM crypto_referral_programs').get() as any;
console.log(`✅ Successfully seeded ${count.count} authentic official referral programs in SQLite database!`);

const samples = db.prepare('SELECT name, slug, destination_url FROM crypto_referral_programs ORDER BY name ASC').all();
console.log('\nPrograms List:');
samples.forEach((s: any, idx: number) => {
  console.log(`${(idx + 1).toString().padStart(2, ' ')}. ${s.name.padEnd(22)} -> ${s.destination_url}`);
});
