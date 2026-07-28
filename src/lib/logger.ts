import "server-only";

import pino from "pino";

import { env } from "@/lib/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "fantasy-master",
    environment: env.NODE_ENV,
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
