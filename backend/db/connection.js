import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { ENV } from '../config/env.js';

class DatabaseConnection {
  static instance = null;

  static getConnection() {
    if (!DatabaseConnection.instance) {
      const dataDir = path.dirname(ENV.DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const db = new DatabaseSync(ENV.DB_PATH);
      
      // Optimize SQLite performance pragmas
      try {
        db.exec(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          PRAGMA foreign_keys = ON;
        `);
      } catch (err) {
        console.warn('⚠️ SQLite PRAGMA journal_mode notice (continuing with default journal):', err.message);
        try {
          db.exec('PRAGMA foreign_keys = ON;');
        } catch (_) {}
      }

      DatabaseConnection.instance = db;
    }
    return DatabaseConnection.instance;
  }
}

export const db = DatabaseConnection.getConnection();
