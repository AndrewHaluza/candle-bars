import cors from "cors";
import express from "express";

import { httpLogger } from "./httpLogger";
import { authenticationMiddleware } from "./authentication";

export default [
  httpLogger,
  cors(),
  express.json(),
  authenticationMiddleware,
];
