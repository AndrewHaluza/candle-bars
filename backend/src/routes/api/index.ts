import express, { Router } from "express";

import { useApiV1Router } from "./v1";

export function useApiRouter(): [string, Router] {
  const apiRouterPath = "/api";

  const apiRouter: Router = express.Router();

  apiRouter.use(...useApiV1Router());

  return [apiRouterPath, apiRouter];
}
