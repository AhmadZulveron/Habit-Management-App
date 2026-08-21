const pool = require('./src/config/database');

async function checkSchema() {
  try {
    const tables = ['users', 'user_points', 'user_profiles'];
    
    for (const table of tables) {
      const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`\nColumns for ${table}:`);
      columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
