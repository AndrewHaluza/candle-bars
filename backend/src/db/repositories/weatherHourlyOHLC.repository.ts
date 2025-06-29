import { TABLES } from "../../constants/tables";
import logger from "../../utils/logger";
import { DatabaseConnection } from "../connection";
import {
  SaveWeatherHourlyOHLCRecord,
  WeatherHourlyOHLCRecord,
} from "../models/weatherHourtlyOHLC";

export class WeatherHourlyOHLCRepository {
  private readonly table = TABLES.WEATHER_HOURLY_OHLC;

  constructor(private db: DatabaseConnection) {}

  async saveOHLCRecords(
    records: SaveWeatherHourlyOHLCRecord[]
  ): Promise<boolean> {
    try {
      const query = `
      INSERT OR REPLACE INTO ${
        this.table
      } (city, timestamp, open, high, low, close, created_at, updated_at)
      VALUES ${records
        .map(() => "(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
        .join(", ")}`;

      const values = records.flatMap((record) => [
        record.city,
        record.timestamp,
        record.open,
        record.high,
        record.low,
        record.close,
      ]);

      await this.db.run(query, values);

      return true;
    } catch (error) {
      logger.error(`Error saving OHLC records: ${error}`);
      return false;
    }
  }

  async getOHLCRecords(
    city: string,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherHourlyOHLCRecord[]> {
    try {
      let whereClause = "WHERE city = ?";
      const params: any[] = [city];

      if (startDate && endDate) {
        whereClause += " AND timestamp BETWEEN ? AND ?";
        params.push(startDate, endDate);
      } else if (startDate) {
        whereClause += " AND timestamp >= ?";
        params.push(startDate);
      } else if (endDate) {
        whereClause += " AND timestamp <= ?";
        params.push(endDate);
      }

      const query = `
        SELECT * FROM ${this.table}
        ${whereClause}
        ORDER BY timestamp DESC
      `;

      const result = await this.db.all(query, params);
      return result as WeatherHourlyOHLCRecord[];
    } catch (error) {
      logger.error(`Error getting OHLC records for city ${city}: ${error}`);
      throw error;
    }
  }

  async createTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(city, timestamp)
      )
    `;

    await this.db.run(sql);
  }

  async createIndexes(): Promise<void> {
    const indexes = [
      // Composite index for city filtering and timestamp ordering/filtering
      `CREATE INDEX IF NOT EXISTS idx_ohlc_city_timestamp ON ${this.table}(city, timestamp DESC)`,
    ];

    for (const indexSql of indexes) {
      await this.db.run(indexSql);
    }
  }

  async dropTable(): Promise<void> {
    await this.db.run(`DROP TABLE IF EXISTS ${this.table}`);
  }
}
