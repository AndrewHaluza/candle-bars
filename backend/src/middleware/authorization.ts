import { Request, Response, NextFunction } from "express";

export const authorizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO check user permissions
  next();
};
