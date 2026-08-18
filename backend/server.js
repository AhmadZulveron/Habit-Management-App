require('dotenv').config();

const app = require('./src/app');
const { env } = require('./src/config/env');
const pool = require('./src/config/database');

const PORT = env.PORT;

// Test database connection before starting server
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  }
}

startServer();
