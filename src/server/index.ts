import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { ipRoutes } from "./routes/ip.js";
import { tlsRoutes } from "./routes/tls.js";
import { headerRoutes } from "./routes/headers.js";
import { echRoutes } from "./routes/ech.js";
import { speedtestRoutes } from "./routes/speedtest.js";
import { dnsRoutes } from "./routes/dns.js";
import { pingRoutes } from "./routes/ping.js";
import { rateLimiter, stopRateLimitCleanup } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import { log } from "./utils/logger.js";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use("*", cors({ origin: corsOrigin }));
const rateLimit = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "30", 10);
app.use("/api/*", rateLimiter({ limit: rateLimit, windowMs: 60_000 }));

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", uptime: process.uptime() })
);

// API routes
app.route("/api/ip", ipRoutes);
app.route("/api/tls", tlsRoutes);
app.route("/api/headers", headerRoutes);
app.route("/api/ech", echRoutes);
app.route("/api/speedtest", speedtestRoutes);
app.route("/api/dns", dnsRoutes);
app.route("/api/ping", pingRoutes);

// Error handling
app.onError(errorHandler);

// Serve static client files in production (cache index.html in memory)
const clientDir = path.resolve("dist/client");
let cachedIndexHtml: string | undefined;
if (fs.existsSync(clientDir)) {
  const indexPath = path.join(clientDir, "index.html");
  if (fs.existsSync(indexPath)) {
    cachedIndexHtml = fs.readFileSync(indexPath, "utf-8");
  }
  app.use("/assets/*", serveStatic({ root: "./dist/client" }));
  app.get("*", (c) => {
    if (cachedIndexHtml) {
      return c.html(cachedIndexHtml);
    }
    return c.text("Not found", 404);
  });
}

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

const server = serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  log.info(`NetMonitor server running at http://${host}:${info.port}`);
});

// Graceful shutdown
function shutdown() {
  log.info("Shutting down gracefully...");
  stopRateLimitCleanup();
  server.close(() => {
    log.info("Server stopped");
    process.exit(0);
  });
  // Force exit after 5s if close hangs
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
