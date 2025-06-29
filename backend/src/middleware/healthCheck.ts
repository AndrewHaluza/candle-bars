import { Request, Response, NextFunction } from "express";

import { STATUSES } from "../constants/statuses";

export const healthCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({
    data: {
      status: STATUSES.OK,
      timestamp: new Date().toISOString(),
    },
  });
};
