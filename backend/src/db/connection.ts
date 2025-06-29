import path from "path";
import sqlite3 from "sqlite3";
import logger from "../utils/logger";

export interface DatabaseConfig {
  filename: string;
  verbose?: boolean;
}

export class DatabaseConnection {
  private db: sqlite3.Database | null = null;
  private config: DatabaseConfig;

  private logMessageBuilder(msg: string) {
    return `[DB] ${msg}`;
  }

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      filename:
        config?.filename || path.join(__dirname, "../../data/weather.db"),
      verbose: config?.verbose || false,
    };
  }

  async connect(): Promise<void> {
    logger.info(this.logMessageBuilder("🗄️  Connecting to database..."));

    return new Promise((resolve, reject) => {
      const dbPath = this.config.filename;

      // Create directory if it doesn't exist
      const fs = require("fs");
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const sqlite = this.config.verbose ? sqlite3.verbose() : sqlite3;

      this.db = new sqlite.Database(dbPath, (err) => {
        if (err) {
          logger.error(this.logMessageBuilder("Error connecting to SQLite database:"), err);
          reject(err);
        } else {
          logger.info(this.logMessageBuilder("✅ Connected to SQLite database"));
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error(this.logMessageBuilder("Error closing database:"), err);
            reject(err);
          } else {
            logger.info(this.logMessageBuilder("🔴 Database connection closed"));
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error(this.logMessageBuilder("Database not connected. Call connect() first."));
    }
    return this.db;
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error(this.logMessageBuilder("Database not connected")));
        return;
      }

      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error(this.logMessageBuilder("Database not connected")));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error(this.logMessageBuilder("Database not connected")));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async beginTransaction(): Promise<void> {
    await this.run("BEGIN TRANSACTION");
  }

  async commit(): Promise<void> {
    await this.run("COMMIT");
  }

  async rollback(): Promise<void> {
    await this.run("ROLLBACK");
  }
}
