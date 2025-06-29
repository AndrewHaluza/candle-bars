import express, { NextFunction, Request, Response, Router } from "express";

import { WeatherService } from "../../../services/weatherService";
import { ServiceContainer } from "../../../utils/ServiceContainer";

/**
 * @swagger
 * tags:
 *   name: Scheduler
 *   description: Weather data aggregation scheduler management
 */

export function useSchedulerV1Router(): [string, Router] {
  const apiSchedulerV1RouterPath = "/scheduler";

  const apiSchedulerV1Router: Router = express.Router();

  /**
   * @swagger
   * /api/v1/scheduler/status:
   *   get:
   *     summary: Get scheduler status
   *     tags: [Scheduler]
   *     responses:
   *       200:
   *         description: Scheduler status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SchedulerStatus'
   *       503:
   *         description: Weather service not available
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  apiSchedulerV1Router.get(
    "/status",
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get the service instance inside the route handler, not at initialization
        const weatherServiceInstance =
          ServiceContainer.getInstance().get<WeatherService>("weatherService");

        if (!weatherServiceInstance) {
          return res.status(503).json({
            error: "Weather service not available",
          });
        }

        const scheduler = weatherServiceInstance.getScheduler();
        const status = scheduler.getStatus();

        res.json({
          success: true,
          data: status,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @swagger
   * /api/v1/scheduler/start:
   *   post:
   *     summary: Start the weather data aggregation scheduler
   *     tags: [Scheduler]
   *     responses:
   *       200:
   *         description: Scheduler started successfully
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
   *                   example: "Scheduler started"
   *       500:
   *         description: Failed to start scheduler
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  apiSchedulerV1Router.post(
    "/start",
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get the service instance inside the route handler, not at initialization
        const weatherServiceInstance =
          ServiceContainer.getInstance().get<WeatherService>("weatherService");

        if (!weatherServiceInstance) {
          throw new Error("Weather service not available");
        }

        const scheduler = weatherServiceInstance.getScheduler();
        scheduler.start();

        res.json({
          success: true,
          message: "Scheduler started",
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @swagger
   * /api/v1/scheduler/stop:
   *   post:
   *     summary: Stop the weather data aggregation scheduler
   *     tags: [Scheduler]
   *     responses:
   *       200:
   *         description: Scheduler stopped successfully
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
   *                   example: "Scheduler stopped"
   *       500:
   *         description: Failed to stop scheduler
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  apiSchedulerV1Router.post(
    "/stop",
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get the service instance inside the route handler, not at initialization
        const weatherServiceInstance =
          ServiceContainer.getInstance().get<WeatherService>("weatherService");

        if (!weatherServiceInstance) {
          throw new Error("Weather service not available");
        }

        const scheduler = weatherServiceInstance.getScheduler();
        scheduler.stop();

        res.json({
          success: true,
          message: "Scheduler stopped",
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return [apiSchedulerV1RouterPath, apiSchedulerV1Router];
}
