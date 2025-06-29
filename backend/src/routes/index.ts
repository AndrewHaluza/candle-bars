import { Router } from "express";

import { healthCheckMiddleware } from "../middleware/healthCheck";
import { useApiRouter } from "./api";

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 */

export function useRouter() {
  const router = Router();

  /**
   * @swagger
   * /healthcheck:
   *   get:
   *     summary: Check API health status
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "OK"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-01-01T12:00:00.000Z"
   *                 uptime:
   *                   type: number
   *                   example: 12345
   */
  router.get("/healthcheck", healthCheckMiddleware);

  router.use(...useApiRouter());

  return router;
}
