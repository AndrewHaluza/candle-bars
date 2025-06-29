import logger from "../utils/logger";
import { DatabaseConnection } from "./connection";
import { WeatherEventRepository } from "./repositories/weatherEvent.repository";
import { WeatherHourlyOHLCRepository } from "./repositories/weatherHourlyOHLC.repository";

export class DatabaseMigrations {
  private weatherEventsRepository: WeatherEventRepository;
  private weatherHourlyOHLCRepository: WeatherHourlyOHLCRepository;

  constructor(private db: DatabaseConnection) {
    this.weatherEventsRepository = new WeatherEventRepository(db);
    this.weatherHourlyOHLCRepository = new WeatherHourlyOHLCRepository(db);
  }

  async runMigrations(): Promise<void> {
    logger.info(this.logMessageBuilder("🔄 Running database migrations..."));

    try {
      await this.initWeatherEvents();
      await this.initWeatherHourlyOHLC();
      logger.info(
        this.logMessageBuilder("✅ Database migrations completed successfully")
      );
    } catch (error) {
      logger.error(
        this.logMessageBuilder("❌ Database migration failed:"),
        error
      );
      throw error;
    }
  }

  private async initWeatherEvents(): Promise<void> {
    await this.weatherEventsRepository.createTable();

    logger.info(
      this.logMessageBuilder("📊 Weather events table created/verified")
    );

    await this.weatherEventsRepository.createIndexes();

    logger.info(
      this.logMessageBuilder("🔍 Weather events indexes created/verified")
    );
  }

  private async initWeatherHourlyOHLC(): Promise<void> {
    await this.weatherHourlyOHLCRepository.createTable();

    logger.info(
      this.logMessageBuilder("📊 Weather hourly OHLC table created/verified")
    );

    await this.weatherHourlyOHLCRepository.createIndexes();

    logger.info(
      this.logMessageBuilder("🔍 Weather hourly OHLC indexes created/verified")
    );
  }

  async dropAllTables(): Promise<void> {
    logger.warn(this.logMessageBuilder("⚠️ Dropping all tables..."));
    await this.weatherEventsRepository.dropTable();
    await this.weatherHourlyOHLCRepository.dropTable();
    logger.info(this.logMessageBuilder("🗑️ All tables dropped"));
  }



  private logMessageBuilder(msg: string) {
    return `[MIGRATIONS] ${msg}`;
  }
}
