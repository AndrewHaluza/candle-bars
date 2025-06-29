import { DatabaseConnection } from "../db";
import { WeatherEventRepository } from "../db/repositories/weatherEvent.repository";
import { CityId, WeatherEvent } from "../types/weatherEvent";
import logger from "../utils/logger";
import { ServiceContainer } from "../utils/ServiceContainer";
import { InMemoryService } from "./inMemoryService";
import { SchedulerService } from "./schedulerService";
import { WeatherClient } from "./weatherClient";

const weatherSocketUrl =
  process.env.WEATHER_SIMULATOR_URL || "ws://localhost:8765";

export class WeatherService {
  private weatherClient: WeatherClient;
  private schedulerService: SchedulerService;

  private logMessageBuilder(msg: string) {
    return `[WEATHER_SERVICE] ${msg}`;
  }

  constructor(readonly dbConnection: DatabaseConnection) {
    this.weatherClient = new WeatherClient(
      weatherSocketUrl,
      new WeatherEventRepository(dbConnection),
      new InMemoryService<WeatherEvent, CityId>()
    );

    this.schedulerService =
      ServiceContainer.getInstance().get<SchedulerService>("schedulerService");
  }

  async connect(): Promise<boolean> {
    let connected = false;

    logger.info(
      this.logMessageBuilder("🌍 Connecting to weather simulator...")
    );

    try {
      await this.weatherClient.connect();
      connected = true;
    } catch (error) {}

    return connected;
  }

  private startScheduler(): void {
    try {
      this.schedulerService.start();
      logger.info(this.logMessageBuilder("📅 Aggregation scheduler started"));
    } catch (error) {
      logger.error(
        this.logMessageBuilder("Failed to start aggregation scheduler:"),
        error
      );
    }
  }

  disconnect() {
    logger.info(
      this.logMessageBuilder("🌍 Disconnecting from weather simulator...")
    );

    // Stop the scheduler first
    try {
      this.schedulerService.stop();
      logger.info(this.logMessageBuilder("📅 Aggregation scheduler stopped"));
    } catch (error) {
      logger.error(this.logMessageBuilder("Error stopping scheduler:"), error);
    }

    this.weatherClient.disconnect();

    logger.info(
      this.logMessageBuilder("🔴 Disconnected from weather simulator")
    );
  }

  getScheduler(): SchedulerService {
    return this.schedulerService;
  }
}
