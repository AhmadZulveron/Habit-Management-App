require('dotenv').config();
const streakHelper = require('./src/utils/streakHelper');
const pool = require('./src/config/database');

async function checkStreak() {
  try {
    const userId = process.argv[2];
    const [completions] = await pool.query(
      `SELECT h.id as habit_id, hc.completed_at, hs.day_of_week
       FROM habits h
       JOIN habit_completions hc ON h.id = hc.habit_id
       JOIN habit_schedules hs ON h.id = hs.habit_id
       WHERE h.user_id = ?`,
      [userId]
    );
    console.log("Completions for user:", completions);
    const maxStreak = streakHelper.calculateMaxStreak(completions);
    console.log("Calculated maxStreak:", maxStreak);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkStreak();
