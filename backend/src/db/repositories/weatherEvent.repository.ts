import { TABLES } from "../../constants/tables";
import logger from "../../utils/logger";
import { DatabaseConnection } from "../connection";
import {
  SaveWeatherEventRecord,
} from "../models/weatherEvents";
import { WeatherHourlyOHLCRecord } from "../models/weatherHourtlyOHLC";

export class WeatherEventRepository {
  private readonly table = TABLES.WEATHER_EVENTS;

  constructor(private db: DatabaseConnection) {}

  async saveEvents(events: SaveWeatherEventRecord[]): Promise<boolean> {
    try {
      const query = `
      INSERT INTO ${
        this.table
      } (city, timestamp, temperature, created_at, updated_at)
      VALUES ${events
        .map(() => "(?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
        .join(", ")}`;

      const values = events.flatMap((event) => [
        event.city,
        event.timestamp,
        event.temperature,
      ]);

      await this.db.run(query, values);

      return true;
    } catch (error) {
      logger.error(`Error saving weather events: ${error}`);
      return false;
    }
  }

  async createTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${TABLES.WEATHER_EVENTS} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        temperature REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(city, timestamp)
      )
    `;

    await this.db.run(sql);
  }

  async createIndexes(): Promise<void> {
    const indexes = [
      // Composite index for city filtering and timestamp operations in getAggregatedHourlyOHLC
      `CREATE INDEX IF NOT EXISTS idx_weather_city_timestamp ON ${TABLES.WEATHER_EVENTS}(city, timestamp)`,
    ];

    for (const indexSql of indexes) {
      await this.db.run(indexSql);
    }
  }

  async dropTable(): Promise<void> {
    await this.db.run(`DROP TABLE IF EXISTS ${this.table}`);
  }

  async getAggregatedHourlyOHLC(
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
        SELECT 
          city,
          strftime('%Y-%m-%d %H:00:00', timestamp) as timestamp,
          MIN(temperature) as low,
          MAX(temperature) as high,
          (
            SELECT temperature 
            FROM ${this.table} we2 
            WHERE we2.city = we.city 
            AND strftime('%Y-%m-%d %H', we2.timestamp) = strftime('%Y-%m-%d %H', we.timestamp)
            ORDER BY we2.timestamp ASC 
            LIMIT 1
          ) as open,
          (
            SELECT temperature 
            FROM ${this.table} we3 
            WHERE we3.city = we.city 
            AND strftime('%Y-%m-%d %H', we3.timestamp) = strftime('%Y-%m-%d %H', we.timestamp)
            ORDER BY we3.timestamp DESC 
            LIMIT 1
          ) as close
        FROM ${this.table} we
        ${whereClause}
        GROUP BY city, strftime('%Y-%m-%d %H', timestamp)
        ORDER BY timestamp ASC
      `;

      const result = await this.db.all(query, params);
      return result as WeatherHourlyOHLCRecord[];
    } catch (error) {
      logger.error(
        `Error getting aggregated hourly OHLC for city ${city}: ${error}`
      );
      throw error;
    }
  }
}
