require('dotenv').config();
const pool = require('./src/config/database');

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM badges');
    console.log("Badges rows:", rows);
    
    // Also print columns
    const [cols] = await pool.query('SHOW COLUMNS FROM badges');
    console.log("Columns:", cols);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
