import express from "express";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./configs/swagger";
import { DatabaseConnection, DatabaseMigrations } from "./db";
import { errorHandler } from "./middleware/errorHandler";
import middlewares from "./middleware/index";
import { useRouter } from "./routes/index";
import { registerServices } from "./serviceRegister";
import { WeatherService } from "./services/weatherService";
import logger from "./utils/logger";
import { ServiceContainer } from "./utils/ServiceContainer";

const app = express();
const PORT = process.env.PORT || 3000;

const dbConnection = new DatabaseConnection();

const dbMigrations = new DatabaseMigrations(dbConnection);

registerServices(dbConnection);

const weatherService =
  ServiceContainer.getInstance().get<WeatherService>("weatherService");

app.use(...middlewares);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(useRouter());

app.use(errorHandler);

const startServer = async () => {
  let connected = false;

  try {
    await dbConnection.connect();
    await dbMigrations.runMigrations();

    connected = await weatherService.connect();
  } catch (error) {
    // Connection failed after all retries, but we'll start the server anyway
    logger.warn("[SERVER] 🚀 Starting server without weather connection...");
  }

  app.listen(PORT, () => {
    logger.info(`[SERVER] 🚀 Server running at http://localhost:${PORT}`);
    logger.info(`[SERVER] 📚 API Documentation at http://localhost:${PORT}/api-docs`);

    if (connected) {
      logger.info(
        `[SERVER] ❤️  Health check at http://localhost:${PORT}/healthcheck`
      );
      logger.info(
        `[SERVER] 📅 Scheduler status at http://localhost:${PORT}/api/v1/scheduler/status`
      );
    } else {
      logger.warn(`[SERVER] ⚠️  Weather simulator not connected`);
    }
  });
};

// Graceful shutdown
process.on("SIGINT", () => {
  processShutdown("SIGINT", 0, new Error("SIGINT received"));
});

process.on("SIGTERM", () => {
  processShutdown("SIGTERM", 0, new Error("SIGTERM received"));
});

process.on("uncaughtException", async (error) => {
  processShutdown("Uncaught Exception", 1, error);
});

async function processShutdown(event: string, code: number, error: Error) {
  logger.error(`\n[SERVER] 🛑 ${event} Shutting down gracefully...`, error);

  weatherService.disconnect();
  await dbConnection.disconnect();

  process.exit(code);
}

startServer();
