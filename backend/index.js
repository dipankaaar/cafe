import app from './app.js';
import { ENV } from './config/env.js';
import { initDatabaseSchema } from './db/schema.js';
import { runDatabaseSeeds } from './db/seeds/index.js';
import { db } from './db/connection.js';
import { whatsAppService } from './services/whatsapp.service.js';

function bootstrapServer() {
  try {
    console.log('🔄 Initializing Petuk Adda Cafe Enterprise Server...');

    // 1. Initialize SQLite Database Schema & Tables (WAL mode set in connection.js)
    initDatabaseSchema();

    // 2. Run Master Seeds if required (INSERT OR REPLACE → idempotent)
    runDatabaseSeeds(true);

    // 3. Initialize WhatsApp Baileys Bot Service (Async)
    whatsAppService.init().catch((err) => {
      console.warn('⚠️ WhatsApp service init notice:', err.message);
    });

    // 4. Start HTTP Server
    const server = app.listen(ENV.PORT, ENV.HOST, () => {
      console.log(`=======================================================`);
      console.log(`☕ PETUK ADDA CAFE ENTERPRISE FULLSTACK API SERVER ONLINE`);
      console.log(`📡 URL: http://localhost:${ENV.PORT}`);
      console.log(`📂 Database: SQLite WAL (${ENV.DB_PATH})`);
      console.log(`🚀 Environment: ${ENV.NODE_ENV.toUpperCase()}`);
      console.log(`=======================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${ENV.PORT} is already in use by another process.`);
        console.error(`💡 The backend server is already running or another app is using port ${ENV.PORT}.`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });

    // 4. Hardened Graceful Shutdown (idempotent, force-exit fallback, fatal guards)
    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);

      // Force-exit if connections refuse to drain (e.g. stuck SSE streams)
      const forceTimer = setTimeout(() => {
        console.error('⏱️ Graceful shutdown timed out — forcing exit.');
        try {
          db.close();
        } catch (e) {}
        process.exit(1);
      }, 10000);
      if (typeof forceTimer.unref === 'function') forceTimer.unref();

      server.close(() => {
        clearTimeout(forceTimer);
        try {
          db.close();
          console.log('✅ SQLite database connection closed.');
        } catch (e) {
          console.warn('⚠️ Error closing SQLite connection:', e?.message);
        }
        console.log('👋 Process terminated.');
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
      console.error('🚨 Unhandled promise rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('🚨 Uncaught exception:', err);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrapServer();
