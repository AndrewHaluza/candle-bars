import { DatabaseConnection } from "../db/connection";
import { WeatherHourlyOHLCRecord } from "../db/models/weatherHourtlyOHLC";
import { WeatherEventRepository } from "../db/repositories/weatherEvent.repository";
import { WeatherHourlyOHLCRepository } from "../db/repositories/weatherHourlyOHLC.repository";
import logger from "../utils/logger";

export class AggregateService {
  private weatherEventRepository: WeatherEventRepository;
  private weatherHourlyOHLCRepository: WeatherHourlyOHLCRepository;

  constructor(db: DatabaseConnection) {
    this.weatherEventRepository = new WeatherEventRepository(db);
    this.weatherHourlyOHLCRepository = new WeatherHourlyOHLCRepository(db);
  }

  async getAggregatedCandleBarsByCity(
    city: string,
    startDate?: string,
    endDate?: string
  ): Promise<WeatherHourlyOHLCRecord[]> {
    try {
      logger.debug(`Getting aggregated candle bars for city: ${city}`);

      const aggregatedData =
        await this.weatherEventRepository.getAggregatedHourlyOHLC(
          city,
          startDate,
          endDate
        );

      logger.debug(
        `Found ${aggregatedData.length} aggregated candle bars for city: ${city}`
      );
      return aggregatedData;
    } catch (error) {
      logger.error(
        `Error getting aggregated candle bars for city ${city}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Scheduler method to pre-aggregate weather events for a specific city
   */
  async preAggregateWeatherEvents(
    city: string,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      logger.info(`Pre-aggregating weather events for city: ${city}`);

      const aggregatedData =
        await this.weatherEventRepository.getAggregatedHourlyOHLC(
          city,
          startDate,
          endDate
        );

      if (aggregatedData.length === 0) {
        logger.info(`No data to aggregate for city: ${city}`);
        return true;
      }

      const saveSuccess =
        await this.weatherHourlyOHLCRepository.saveOHLCRecords(aggregatedData);

      if (saveSuccess) {
        logger.info(
          `Successfully pre-aggregated ${aggregatedData.length} records for city: ${city}`
        );
      } else {
        logger.error(`Failed to save pre-aggregated data for city: ${city}`);
      }

      return saveSuccess;
    } catch (error) {
      logger.error(
        `Error pre-aggregating weather events for city ${city}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Get pre-aggregated OHLC data if available, otherwise fall back to real-time aggregation
   */
  async getCandleBarsByCity(
    city: string,
    startDate?: string,
    endDate?: string,
    usePreAggregated: boolean = true
  ): Promise<WeatherHourlyOHLCRecord[]> {
    try {
      if (usePreAggregated) {
        const preAggregatedData =
          await this.weatherHourlyOHLCRepository.getOHLCRecords(
            city,
            startDate,
            endDate
          );

        if (preAggregatedData.length > 0) {
          logger.info(`Using pre-aggregated data for city: ${city}`);
          return preAggregatedData;
        }
      }

      // Fall back to real-time aggregation
      logger.info(`Using real-time aggregation for city: ${city}`);
      return await this.getAggregatedCandleBarsByCity(city, startDate, endDate);
    } catch (error) {
      logger.error(`Error getting candle bars for city ${city}: ${error}`);
      throw error;
    }
  }
}
