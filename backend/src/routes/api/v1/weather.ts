import express, { NextFunction, Request, Response, Router } from "express";

import { AggregateService } from "../../../services/aggregateService";
import { WeatherService } from "../../../services/weatherService";
import { ServiceContainer } from "../../../utils/ServiceContainer";

/**
 * @swagger
 * tags:
 *   name: Weather
 *   description: Weather data and aggregation endpoints
 */

export function useWeatherV1Router(): [string, Router] {
  const apiWeatherV1RouterPath = "/weather";

  const apiWeatherV1Router: Router = express.Router();

  /**
   * @swagger
   * /api/v1/weather:
   *   get:
   *     summary: Check weather API status
   *     tags: [Weather]
   *     responses:
   *       200:
   *         description: Weather API is operational
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "API v1 weather is operational"
   */
  apiWeatherV1Router.get("/", (req: Request, res: Response) => {
    res.json({ message: "API v1 weather is operational" });
  });

  // Manual aggregation endpoint for a specific city
  /**
   * @swagger
   * /api/v1/weather/aggregate/{city}:
   *   post:
   *     summary: Manually trigger aggregation for a specific city
   *     tags: [Weather]
   *     parameters:
   *       - $ref: '#/components/parameters/CityParam'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AggregationRequest'
   *     responses:
   *       200:
   *         description: Aggregation completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Aggregation completed for New York"
   *                 result:
   *                   type: object
   *                   description: Aggregation result data
   *       500:
   *         description: Aggregation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       503:
   *         description: Weather service not available
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  apiWeatherV1Router.post(
    "/aggregate/:city",
    async (req: Request, res: Response) => {
      try {
        // Get the service instance inside the route handler, not at initialization
        const weatherServiceInstance =
          ServiceContainer.getInstance().get<WeatherService>("weatherService");

        if (!weatherServiceInstance) {
          return res.status(503).json({
            error: "Weather service not available",
          });
        }

        const { city } = req.params;
        const { startDate, endDate } = req.body;

        const scheduler = weatherServiceInstance.getScheduler();
        const result = await scheduler.aggregateCity(city, startDate, endDate);

        res.json({
          success: true,
          message: `Aggregation completed for ${city}`,
          result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: `Failed to aggregate data for city: ${error}`,
        });
      }
    }
  );

  /**
   * @swagger
   * /api/v1/weather/by-city:
   *   get:
   *     summary: Get weather candle bar data for a specific city
   *     tags: [Weather]
   *     parameters:
   *       - $ref: '#/components/parameters/CityQuery'
   *       - $ref: '#/components/parameters/StartDateQuery'
   *       - $ref: '#/components/parameters/EndDateQuery'
   *     responses:
   *       200:
   *         description: Weather candle bar data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CandleBarData'
   *       400:
   *         description: City parameter is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       503:
   *         description: Aggregate service not available
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  apiWeatherV1Router.get(
    "/by-city",
    async (
      req: Request<
        null,
        null,
        null,
        { city: string; startDate: string; endDate: string }
      >,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const aggregateServiceInstance =
          ServiceContainer.getInstance().get<AggregateService>(
            "aggregateService"
          );

        if (!aggregateServiceInstance) {
          return res.status(503).json({
            error: "Aggregate service not available",
          });
        }

        let { city, startDate, endDate } = req.query;

        if (!startDate || !endDate) {
          const now = new Date();
          const end = now.toISOString();
          const start = new Date(
            now.setMonth(now.getMonth() - 6)
          ).toISOString();

          startDate = startDate || start;
          endDate = endDate || end;
        }

        // Ensure startDate is not older than 1 year from today
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const minStartDate = oneYearAgo.toISOString();

        if (startDate < minStartDate) {
          startDate = minStartDate;
        }

        // TODO make proper validation on route level with schemas like yup, zod
        if (!city) {
          throw new Error("City parameter is required");
        }

        const data = await aggregateServiceInstance.getCandleBarsByCity(
          city,
          startDate,
          endDate
        );

        res.json({
          success: true,
          data,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return [apiWeatherV1RouterPath, apiWeatherV1Router];
}
