import { schedulerConfig } from "./configs/scheduler";
import { DatabaseConnection } from "./db";
import { AggregateService } from "./services/aggregateService";
import { SchedulerService } from "./services/schedulerService";
import { WeatherService } from "./services/weatherService";
import { ServiceContainer } from "./utils/ServiceContainer";

export function registerServices(db: DatabaseConnection) {
  const serviceContainer = ServiceContainer.getInstance();

  serviceContainer.register<SchedulerService>(
    "schedulerService",
    new SchedulerService(db, schedulerConfig)
  );

  serviceContainer.register<WeatherService>(
    "weatherService",
    new WeatherService(db)
  );

  serviceContainer.register<AggregateService>(
    "aggregateService",
    new AggregateService(db)
  );

  return serviceContainer;
}
