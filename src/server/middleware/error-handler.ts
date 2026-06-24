import type { Context } from "hono";
import { log } from "../utils/logger.js";

export function errorHandler(err: Error, c: Context) {
  try {
    log.error({ err }, "Unhandled error");
  } catch {
    // Logger may fail (e.g., pino-pretty transport issues); continue
  }
  try {
    return c.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      500
    );
  } catch {
    // Absolute last resort — return a plain Response
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", timestamp: new Date().toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
