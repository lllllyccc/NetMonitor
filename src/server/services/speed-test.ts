import type { SpeedTestResult } from "../../shared/types.js";

// Pre-generated noise buffer reused across requests to avoid crypto overhead
const NOISE_CHUNK = Buffer.alloc(1024 * 1024);
for (let i = 0; i < NOISE_CHUNK.length; i++) {
  // Fill with deterministic pseudo-random pattern — speed-test throughput is unaffected
  NOISE_CHUNK[i] = ((i * 12345 + i * i * 6789) & 0xff) ^ 0xaa;
}

// Generate fast payload for download test (non-cryptographic)
export function generatePayload(sizeBytes: number): Buffer {
  const MAX_SIZE = 25 * 1024 * 1024;
  const safeSize = Math.min(sizeBytes, MAX_SIZE);
  const buf = Buffer.alloc(safeSize);
  let offset = 0;
  while (offset < safeSize) {
    const copyLen = Math.min(NOISE_CHUNK.length, safeSize - offset);
    NOISE_CHUNK.copy(buf, offset, 0, copyLen);
    offset += copyLen;
  }
  return buf;
}

// Measure latency via HTTP round-trip
export async function measureLatency(host?: string): Promise<{ latencyMs: number; jitterMs: number }> {
  const samples: number[] = [];
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fetch("https://cloudflare.com/cdn-cgi/trace", {
        signal: AbortSignal.timeout(5_000),
        headers: { "Cache-Control": "no-cache" },
      });
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    } catch {
      // Skip failed samples instead of pushing inflated timeout values
    }
    // Small delay between pings
    await new Promise((r) => setTimeout(r, 100));
  }

  // Need at least 2 samples for meaningful statistics
  if (samples.length < 2) {
    return { latencyMs: 0, jitterMs: 0 };
  }

  // Remove highest and lowest outliers
  samples.sort((a, b) => a - b);
  const trimmed = samples.slice(1, -1);

  // If trimming left fewer than 2 samples, use the middle value
  if (trimmed.length < 2) {
    const mid = Math.floor(samples.length / 2);
    return {
      latencyMs: Math.round(samples[mid] * 100) / 100,
      jitterMs: 0,
    };
  }

  const avgLatency = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  const jitter = Math.sqrt(
    trimmed.reduce((s, v) => s + Math.pow(v - avgLatency, 2), 0) / trimmed.length
  );

  return {
    latencyMs: Math.round(avgLatency * 100) / 100,
    jitterMs: Math.round(jitter * 100) / 100,
  };
}

// Run a full speed test (server-side latency measurement)
export async function runSpeedTest(): Promise<SpeedTestResult> {
  const serverRegion = "default";
  const start = performance.now();

  // Measure latency
  const { latencyMs, jitterMs } = await measureLatency();

  // For download/upload, the actual measurement happens client-side
  // Server just provides the latency baseline and payload generation
  const testDurationMs = Math.round(performance.now() - start);

  return {
    downloadMbps: 0, // Will be measured client-side
    uploadMbps: 0,   // Will be measured client-side
    latencyMs,
    jitterMs,
    serverRegion,
    timestamp: new Date().toISOString(),
    testDurationMs,
  };
}

// Measure download speed by receiving data from client perspective
export function calculateSpeed(bytesTransferred: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const bitsTransferred = bytesTransferred * 8;
  const mbps = bitsTransferred / (durationMs / 1000) / 1_000_000;
  return Math.round(mbps * 100) / 100;
}
