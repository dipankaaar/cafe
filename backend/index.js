import app from './app.js';
import { ENV } from './config/env.js';
import { initDatabaseSchema } from './db/schema.js';
import { runDatabaseSeeds } from './db/seeds/index.js';
import { db } from './db/connection.js';

function bootstrapServer() {
  try {
    console.log('🔄 Initializing Dinenos Cafe Enterprise Server...');

    // 1. Initialize SQLite Database Schema & Tables
    initDatabaseSchema();

    // 2. Run Master Seeds if required
    runDatabaseSeeds();

    // 3. Start HTTP Server
    const server = app.listen(ENV.PORT, ENV.HOST, () => {
      console.log(`=======================================================`);
      console.log(`☕ DINENOS CAFE ENTERPRISE FULLSTACK API SERVER ONLINE`);
      console.log(`📡 URL: http://localhost:${ENV.PORT}`);
      console.log(`📂 Database: SQLite WAL (${ENV.DB_PATH})`);
      console.log(`🚀 Environment: ${ENV.NODE_ENV.toUpperCase()}`);
      console.log(`=======================================================`);
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
      server.close(() => {
        try {
          db.close();
          console.log('✅ SQLite database connection closed.');
        } catch (e) {}
        console.log('👋 Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrapServer();
