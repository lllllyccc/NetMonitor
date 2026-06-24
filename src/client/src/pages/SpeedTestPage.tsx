import { useState, useRef, useCallback } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { ResultCard } from "../components/ResultCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { SpeedTestResult, SpeedTestProgress } from "@shared/types";

interface LatencyResult {
  latencyMs: number;
  jitterMs: number;
}

export function SpeedTestPage() {
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [progress, setProgress] = useState<SpeedTestProgress>({
    phase: "idle",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { t } = useLocale();

  const formatMbps = (mbps: number) => mbps.toFixed(2);
  const formatMs = (ms: number) => ms.toFixed(1);

  const measureDownload = useCallback(async (sizeMB: number): Promise<number> => {
    const start = performance.now();
    const res = await fetch(`/api/speedtest/download?sizeMB=${sizeMB}`, {
      signal: abortRef.current?.signal,
    });
    if (!res.ok) throw new Error("Download test failed");
    const blob = await res.blob();
    const durationMs = performance.now() - start;
    const bits = blob.size * 8;
    const mbps = bits / (durationMs / 1000) / 1_000_000;
    return Math.round(mbps * 100) / 100;
  }, []);

  const measureUpload = useCallback(async (sizeMB: number): Promise<number> => {
    const totalBytes = sizeMB * 1024 * 1024;
    // Generate upload payload in chunks to respect browser crypto limits (max 65536 bytes)
    const chunk = new Uint8Array(65536);
    crypto.getRandomValues(chunk);
    const payload = new Uint8Array(totalBytes);
    for (let offset = 0; offset < totalBytes; offset += 65536) {
      payload.set(chunk.subarray(0, Math.min(65536, totalBytes - offset)), offset);
    }
    const res = await fetch("/api/speedtest/upload", {
      method: "POST",
      body: payload,
      signal: abortRef.current?.signal,
    });
    if (!res.ok) throw new Error("Upload test failed");
    const data = await res.json();
    // Use server-side measurement which accurately captures upload throughput
    return data.uploadMbps as number;
  }, []);

  const runTest = useCallback(async () => {
    abortRef.current = new AbortController();
    setResult(null);
    setError(null);
    const testStart = performance.now();

    try {
      // Phase 1: Latency
      setProgress({ phase: "latency", progress: 10 });
      const latencyRes = await apiGet<LatencyResult>("/api/speedtest/latency");
      setProgress({
        phase: "latency",
        progress: 25,
        latencyMs: latencyRes.latencyMs,
        jitterMs: latencyRes.jitterMs,
      });

      // Phase 2: Download (test with increasing sizes)
      setProgress({ phase: "download", progress: 30 });
      const dl1 = await measureDownload(1);
      setProgress({ phase: "download", progress: 40, currentMbps: dl1 });
      const dl5 = await measureDownload(5);
      setProgress({ phase: "download", progress: 55, currentMbps: dl5 });
      const dl10 = await measureDownload(10);
      setProgress({ phase: "download", progress: 70, currentMbps: dl10 });
      const downloadMbps = Math.max(dl1, dl5, dl10);

      // Phase 3: Upload
      setProgress({ phase: "upload", progress: 75, currentMbps: downloadMbps });
      const ul1 = await measureUpload(1);
      setProgress({ phase: "upload", progress: 85, currentMbps: ul1 });
      const ul5 = await measureUpload(5);
      setProgress({ phase: "upload", progress: 95, currentMbps: ul5 });
      const uploadMbps = Math.max(ul1, ul5);

      // Complete
      const testDurationMs = Math.round(performance.now() - testStart);
      const finalResult: SpeedTestResult = {
        downloadMbps,
        uploadMbps,
        latencyMs: latencyRes.latencyMs,
        jitterMs: latencyRes.jitterMs,
        serverRegion: "Self-hosted",
        timestamp: new Date().toISOString(),
        testDurationMs,
      };
      setResult(finalResult);
      setProgress({ phase: "complete", progress: 100 });
      saveHistory("speedtest", "speedtest", finalResult);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setProgress({ phase: "idle", progress: 0 });
      } else {
        setError(err instanceof Error ? err.message : "Speed test failed");
        setProgress({ phase: "idle", progress: 0 });
      }
    }
  }, [measureDownload, measureUpload]);

  const handleStop = () => {
    abortRef.current?.abort();
    setProgress({ phase: "idle", progress: 0 });
  };

  const isRunning = progress.phase !== "idle" && progress.phase !== "complete";

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("speedTest.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("speedTest.description")}</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <button
            onClick={runTest}
            disabled={isRunning}
            className="btn-primary flex-1"
          >
            {isRunning ? t("speedTest.buttonTesting") : t("speedTest.button")}
          </button>
          {isRunning && (
            <button onClick={handleStop} className="btn-secondary">
              {t("speedTest.stop")}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 capitalize">
              {progress.phase === "latency" && t("speedTest.measuringLatency")}
              {progress.phase === "download" && t("speedTest.testingDownload")}
              {progress.phase === "upload" && t("speedTest.testingUpload")}
            </span>
            <span className="text-sm font-mono text-gray-300">
              {progress.currentMbps ? `${formatMbps(progress.currentMbps)} Mbps` : ""}
            </span>
          </div>
          <div className="w-full bg-surface-3/80 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-accent to-violet h-3 rounded-full transition-all duration-500 progress-glow"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {progress.phase === "idle" && !result && !error && (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-lg mb-1">Ready to test</p>
          <p className="text-lg mb-1">{t("speedTest.readyTitle")}</p>
          <p className="text-sm">{t("speedTest.readyDesc")}</p>
        </div>
      )}

      {error && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Main results */}
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title={t("speedTest.download")} delay={0.1}>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">
                  {formatMbps(result.downloadMbps)}
                </div>
                <div className="text-sm text-gray-400 mt-1">Mbps</div>
              </div>
            </ResultCard>

            <ResultCard title={t("speedTest.upload")} delay={0.15}>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">
                  {formatMbps(result.uploadMbps)}
                </div>
                <div className="text-sm text-gray-400 mt-1">Mbps</div>
              </div>
            </ResultCard>
          </div>

          {/* Latency & Jitter */}
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title={t("speedTest.latency")} delay={0.2}>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-100">
                  {formatMs(result.latencyMs)}
                </div>
                <div className="text-sm text-gray-400 mt-1">ms</div>
              </div>
            </ResultCard>

            <ResultCard title={t("speedTest.jitter")} delay={0.25}>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-100">
                  {formatMs(result.jitterMs)}
                </div>
                <div className="text-sm text-gray-400 mt-1">ms</div>
              </div>
            </ResultCard>
          </div>

          {/* Test info */}
          <ResultCard title={t("speedTest.testInfo")} delay={0.3}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t("speedTest.server")}:</span>{" "}
                <span>{result.serverRegion}</span>
              </div>
              <div>
                <span className="text-gray-500">{t("speedTest.timestamp")}:</span>{" "}
                <span>{new Date(result.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </ResultCard>
        </div>
      )}
    </div>
  );
}
