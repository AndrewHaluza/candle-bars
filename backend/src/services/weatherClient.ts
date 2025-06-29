import WebSocket from "ws";

import { inMemoryConfig } from "../configs/inMemory";
import { WeatherEventRepository } from "../db/repositories/weatherEvent.repository";
import { CityId, WeatherEvent } from "../types/weatherEvent";
import logger from "../utils/logger";
import { InMemoryServiceType } from "./inMemoryService";

export class WeatherClient {
  private ws: WebSocket | null = null;
  private maxHistoryPerCity = inMemoryConfig.maxHistoryPerCity;
  private reconnectDelay = 5000;
  private isConnecting = false;
  private pendingWrites = new Set<CityId>();
  private batchWriteTimer: NodeJS.Immediate | null = null;
  private citiesToFlush = new Set<CityId>();

  private benchmarkCount: number = 0;
  private benchmarkStartTime: number = Date.now();

  constructor(
    private url: string = "ws://localhost:8765",
    private weatherEventRepository: WeatherEventRepository,
    private inMemoryService: InMemoryServiceType<WeatherEvent, CityId>
  ) {
    this.weatherEventRepository = weatherEventRepository;
    this.inMemoryService = inMemoryService;
  }

  connect(): Promise<void> {
    if (this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on("open", () => {
          logger.info(
            this.logMessageBuilder("🟢 Connected to weather simulator")
          );
          this.isConnecting = false;
          resolve();
        });

        const isBenchmarkEnabled = process.env.BENCHMARK === "true";

        if (isBenchmarkEnabled) {
          this.benchmark();
        }

        this.ws.on("message", (bufferData: WebSocket.Data) => {
          try {
            const event = this.parseEventData(bufferData);

            this.saveToTemporaryStore(event);

            const eventsAmount = this.inMemoryService.length(event.city);

            if (eventsAmount >= this.maxHistoryPerCity) {
              this.scheduleCityFlush(event.city);
            }

            this.benchmarkCount++;
          } catch (error) {
            logger.error(
              this.logMessageBuilder("Error parsing weather data:"),
              error
            );
          }
        });

        this.ws.on("error", (error) => {
          logger.error(this.logMessageBuilder("WebSocket error:"), error);
          this.isConnecting = false;
          reject(error);
        });

        this.ws.on("close", () => {
          logger.warn(
            this.logMessageBuilder("🔴 Disconnected from weather simulator")
          );
          this.isConnecting = false;

          // Auto-reconnect after delay
          setTimeout(() => {
            logger.info(
              this.logMessageBuilder("🔄 Attempting to reconnect...")
            );
            this.connect().catch((err) =>
              logger.error(this.logMessageBuilder("Reconnection failed:"), err)
            );
          }, this.reconnectDelay);
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear any pending batch operations
    if (this.batchWriteTimer) {
      clearImmediate(this.batchWriteTimer);
      this.batchWriteTimer = null;
    }

    // Force flush remaining data
    if (this.citiesToFlush.size > 0) {
      this.flushCitiesToDatabase();
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private parseEventData(bufferData: WebSocket.Data): WeatherEvent {
    const data =
      typeof bufferData === "string" ? bufferData : bufferData.toString("utf8");

    return JSON.parse(data);
  }

  private scheduleCityFlush(cityId: CityId): void {
    // Add city to flush queue
    this.citiesToFlush.add(cityId);

    // Schedule batch flush if not already scheduled
    if (!this.batchWriteTimer) {
      this.batchWriteTimer = setImmediate(() => {
        this.flushCitiesToDatabase();
      });
    }
  }

  private flushCitiesToDatabase(): void {
    const citiesToProcess = Array.from(this.citiesToFlush);
    this.citiesToFlush.clear();
    this.batchWriteTimer = null;

    if (citiesToProcess.length === 0) return;

    setImmediate(async () => {
      const allEventsToSave: WeatherEvent[] = [];
      const citiesToClear: CityId[] = [];

      for (const cityId of citiesToProcess) {
        // Skip if already being written
        if (this.pendingWrites.has(cityId)) continue;

        const events = this.inMemoryService.get(cityId);

        if (events && events.length > 0) {
          allEventsToSave.push(...events);
          citiesToClear.push(cityId);
          this.pendingWrites.add(cityId);
        }
      }

      if (allEventsToSave.length > 0) {
        try {
          await this.saveToPersistentStore(allEventsToSave);

          // Clear memory for successfully saved cities
          citiesToClear.forEach((cityId) => {
            this.inMemoryService.clear(cityId);
            this.pendingWrites.delete(cityId);
          });
        } catch (error) {
          logger.error(
            this.logMessageBuilder("Failed to batch save weather events:"),
            error
          );

          // Remove from pending writes on error
          citiesToClear.forEach((cityId) => {
            this.pendingWrites.delete(cityId);
          });
        }
      }
    });
  }

  private async saveToPersistentStore(
    events: WeatherEvent[]
  ): Promise<boolean> {
    try {
      return await this.weatherEventRepository.saveEvents(
        events.map((event) => ({
          city: event.city,
          timestamp: event.timestamp,
          temperature: event.temperature,
        }))
      );
    } catch (error) {
      logger.error(
        this.logMessageBuilder("Failed to save weather events to database:"),
        error
      );
      return false;
    }
  }

  private saveToTemporaryStore(event: WeatherEvent) {
    this.inMemoryService.set(event.city, event);
  }

  private logMessageBuilder(msg: string) {
    return `[WEATHER_CLIENT] ${msg}`;
  }

  private benchmark() {
    const LOG_INTERVAL_IN_SEC = 10;

    setInterval(() => {
      if (!this.isConnected()) {
        this.benchmarkStartTime = 0;
        this.benchmarkCount = 0;

        return;
      }

      if (this.benchmarkStartTime === 0) {
        this.benchmarkStartTime = Date.now();
      }

      const elapsedTime = Date.now() - this.benchmarkStartTime;
      const avgEventsPerSecond = (
        this.benchmarkCount /
        (elapsedTime / 1000)
      ).toFixed(2);
      logger.info(
        this.logMessageBuilder(`Benchmark: ${avgEventsPerSecond} events/sec`)
      );
      this.benchmarkCount = 0;
      this.benchmarkStartTime = Date.now();
    }, LOG_INTERVAL_IN_SEC * 1000);
  }
}
