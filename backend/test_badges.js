require('dotenv').config();
const badgeService = require('./src/services/badgeService');
const pool = require('./src/config/database');

async function run() {
  try {
    const userId = 5;
    console.log(`Getting badges for User ${userId}`);
    const badges = await badgeService.getUserBadges(userId);
    console.log(JSON.stringify(badges, null, 2));

    console.log(`\nEvaluating badges for User ${userId}`);
    const earned = await badgeService.evaluateAndAwardBadges(userId);
    console.log("Newly Earned:", JSON.stringify(earned, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
