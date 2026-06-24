import { pino } from "pino";

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  name: "netmonitor",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
