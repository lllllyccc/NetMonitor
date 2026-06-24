import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;

// Clean up expired entries periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 30_000);

// Allow graceful shutdown to clear the timer
export function stopRateLimitCleanup() {
  clearInterval(cleanupTimer);
}

export function rateLimiter(opts: { limit: number; windowMs: number }) {
  return async (c: Context, next: Next) => {
    const rawIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      c.env?.incoming?.socket?.remoteAddress ||
      "unknown";
    const ip = rawIp.replace(/[^a-zA-Z0-9.:]/g, "").slice(0, 45);
    const key = ip;
    const now = Date.now();

    if (store.size >= MAX_STORE_SIZE && !store.has(key)) {
      return c.json(
        { success: false, error: "Server busy, try again later", timestamp: new Date().toISOString() },
        503
      );
    }

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }

    entry.count++;
    c.header("X-RateLimit-Limit", String(opts.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.limit - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.limit) {
      return c.json(
        { success: false, error: "Rate limit exceeded", timestamp: new Date().toISOString() },
        429
      );
    }
    await next();
  };
}
