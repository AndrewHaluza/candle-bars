import { StatusType } from "../constants/statuses";

export interface RequestWithUser extends Express.Request {
  user?: any; // Define the user type as needed
}

export interface ResponseWithData<TData, TMeta = undefined>
  extends Express.Response {
  data: TData;
  meta?: TMeta;
}

export interface NextFunction {
  (err?: any): void;
}

export type HealthCheckResponse = ResponseWithData<{
  status: StatusType;
  timestamp: string;
}>;
