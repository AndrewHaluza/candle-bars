import express, { Router } from "express";

import { useSchedulerV1Router } from "./scheduler";
import { useWeatherV1Router } from "./weather";
import { authorizationMiddleware } from "../../../middleware/authorization";

export function useApiV1Router(): [string, Router] {
  const apiV1RouterPath = "/v1";

  const apiV1Router: Router = express.Router();

  // protected routes
  apiV1Router.use(authorizationMiddleware);

  apiV1Router.use(...useWeatherV1Router());
  apiV1Router.use(...useSchedulerV1Router());

  return [apiV1RouterPath, apiV1Router];
}
