const pool = require('./src/config/database');

async function checkSchema() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);

    const tableNames = tables.map(t => Object.values(t)[0]);
    
    for (const table of tableNames) {
      if (table.includes('badge')) {
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
        console.log(`\nColumns for ${table}:`);
        columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
