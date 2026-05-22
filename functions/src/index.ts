import cors from "cors";
import express from "express";
import helmet from "helmet";
import { onRequest } from "firebase-functions/v2/https";
import { env } from "./config/env.js";
import { routes } from "./api/routes.js";
import { errorHandler, requestId } from "./services/http.js";
import { rateLimit } from "./services/rateLimit.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(rateLimit);
app.use("/api", routes);
app.use(routes);
app.use(errorHandler);

export const api = onRequest(
  {
    region: env.taskQueueLocation,
    timeoutSeconds: 60,
    memory: "512MiB",
    minInstances: 1,
    concurrency: 40
  },
  app
);
