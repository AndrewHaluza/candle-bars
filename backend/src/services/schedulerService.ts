import { DatabaseConnection } from "../db/connection";
import logger from "../utils/logger";
import { AggregateService } from "./aggregateService";

export interface SchedulerConfig {
  intervalMinutes: number;
  cities: string[];
  enabled: boolean;
  aggregationTimeWindowHours?: number;
}

// TODO move to the separate instance for scalability
export class SchedulerService {
  private aggregateService: AggregateService;
  private intervalId: NodeJS.Timeout | null = null;
  private config: SchedulerConfig;
  private isRunning: boolean = false;

  constructor(db: DatabaseConnection, config: Partial<SchedulerConfig> = {}) {
    this.aggregateService = new AggregateService(db);
    this.config = {
      intervalMinutes: 15, // Default: every 15 minutes
      cities: ["Berlin", "NewYork", "Tokyo", "SaoPaulo", "CapeTown"], // Default cities
      enabled: true,
      aggregationTimeWindowHours: 24, // Default: aggregate last 24 hours
      ...config,
    };
  }

  start(): void {
    if (this.isRunning) {
      logger.warn(this.logMessageBuilder("Scheduler is already running"));
      return;
    }

    if (!this.config.enabled) {
      logger.info(this.logMessageBuilder("Scheduler is disabled"));
      return;
    }

    logger.info(
      this.logMessageBuilder(
        `Starting scheduler - will run every ${
          this.config.intervalMinutes
        } minutes for cities: ${this.config.cities.join(", ")}`
      )
    );

    // Run immediately on start
    this.runAggregation().catch((error) => {
      logger.error(
        this.logMessageBuilder("Initial aggregation failed:"),
        error
      );
    });

    // Then schedule periodic runs
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runAggregation().catch((error) => {
        logger.error(
          this.logMessageBuilder("Scheduled aggregation failed:"),
          error
        );
      });
    }, intervalMs);

    this.isRunning = true;
    logger.info(this.logMessageBuilder("Scheduler started successfully"));
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn(this.logMessageBuilder("Scheduler is not running"));
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info(this.logMessageBuilder("Scheduler stopped"));
  }

  private async runAggregation(): Promise<void> {
    logger.info(this.logMessageBuilder("Starting periodic aggregation..."));

    const endDate = new Date().toISOString();
    const startDate = new Date(
      Date.now() - this.config.aggregationTimeWindowHours! * 60 * 60 * 1000
    ).toISOString();

    const results = await Promise.allSettled(
      this.config.cities.map((city) =>
        this.aggregateService.preAggregateWeatherEvents(
          city,
          startDate,
          endDate
        )
      )
    );

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const city = this.config.cities[index];

      if (result.status === "fulfilled") {
        if (result.value) {
          successCount++;
          logger.debug(
            this.logMessageBuilder(`Successfully aggregated data for ${city}`)
          );
        } else {
          failureCount++;
          logger.warn(
            this.logMessageBuilder(`Aggregation returned false for ${city}`)
          );
        }
      } else {
        failureCount++;
        logger.error(
          this.logMessageBuilder(`Aggregation failed for ${city}:`),
          result.reason
        );
      }
    });

    logger.info(
      this.logMessageBuilder(
        `Aggregation completed - Success: ${successCount}, Failures: ${failureCount}`
      )
    );
  }

  async aggregateCity(
    city: string,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      logger.info(
        this.logMessageBuilder(`Manual aggregation for city: ${city}`)
      );

      const result = await this.aggregateService.preAggregateWeatherEvents(
        city,
        startDate,
        endDate
      );

      if (result) {
        logger.info(
          this.logMessageBuilder(`Manual aggregation successful for ${city}`)
        );
      } else {
        logger.warn(
          this.logMessageBuilder(
            `Manual aggregation returned false for ${city}`
          )
        );
      }

      return result;
    } catch (error) {
      logger.error(
        this.logMessageBuilder(`Manual aggregation failed for ${city}:`),
        error
      );
      throw error;
    }
  }

  getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
    nextRunTime?: Date;
  } {
    const status = {
      isRunning: this.isRunning,
      config: this.config,
    };

    if (this.isRunning && this.intervalId) {
      // Note: This is an approximation since we can't get exact next run time from setInterval
      const nextRunTime = new Date(
        Date.now() + this.config.intervalMinutes * 60 * 1000
      );
      return { ...status, nextRunTime };
    }

    return status;
  }

  private logMessageBuilder(msg: string): string {
    return `[SCHEDULER] ${msg}`;
  }
}
