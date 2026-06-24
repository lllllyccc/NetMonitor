import { exec } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import type { PingResult, TracerouteResult, TracerouteHop } from "../../shared/types.js";

const execAsync = promisify(exec);

const IS_WINDOWS = os.platform() === "win32";

export async function pingHost(host: string, count = 4): Promise<PingResult> {
  // Validate host — basic safety check to prevent shell injection
  if (!/^[a-zA-Z0-9.\-_:]+$/.test(host)) {
    return {
      host,
      packetsSent: 0,
      packetsReceived: 0,
      packetLossPercent: 100,
      minMs: 0,
      avgMs: 0,
      maxMs: 0,
      status: "error",
      error: "Invalid host. Only alphanumeric characters, dots, hyphens, colons, and underscores allowed.",
    };
  }

  try {
    const flag = IS_WINDOWS ? "-n" : "-c";
    const timeoutFlag = IS_WINDOWS ? "-w 5000" : "-W 5";
    const cmd = `ping ${flag} ${count} ${timeoutFlag} ${host}`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30_000 });

    if (stderr && !stdout) {
      return {
        host,
        packetsSent: count,
        packetsReceived: 0,
        packetLossPercent: 100,
        minMs: 0,
        avgMs: 0,
        maxMs: 0,
        status: "error",
        error: stderr.trim(),
      };
    }

    return parsePingOutput(host, count, stdout);
  } catch (err) {
    // Attempt to parse partial output if available
    const error = err as { stdout?: string; stderr?: string; killed?: boolean };
    if (error.stdout) {
      return parsePingOutput(host, count, error.stdout);
    }
    return {
      host,
      packetsSent: count,
      packetsReceived: 0,
      packetLossPercent: 100,
      minMs: 0,
      avgMs: 0,
      maxMs: 0,
      status: "timeout",
      error: error.killed ? "Ping timed out" : error.stderr?.trim() || "Ping failed",
    };
  }
}

function parsePingOutput(host: string, count: number, output: string): PingResult {
  // Parse packet loss
  const lossMatch = output.match(/(\d+)%\s*(?:packet\s*)?loss/i);
  const lossPercent = lossMatch ? parseInt(lossMatch[1], 10) : 0;

  // Parse RTT stats
  let minMs = 0;
  let avgMs = 0;
  let maxMs = 0;
  let mdevMs: number | undefined;

  // Windows format: Minimum = 1ms, Maximum = 2ms, Average = 1ms
  // Linux format: min/avg/max/mdev = 0.260/0.260/0.260/0.000 ms

  if (IS_WINDOWS) {
    const minMatch = output.match(/Minimum\s*=\s*(\d+)ms/i);
    const maxMatch = output.match(/Maximum\s*=\s*(\d+)ms/i);
    const avgMatch = output.match(/Average\s*=\s*(\d+)ms/i);
    if (minMatch) minMs = parseFloat(minMatch[1]);
    if (maxMatch) maxMs = parseFloat(maxMatch[1]);
    if (avgMatch) avgMs = parseFloat(avgMatch[1]);
  } else {
    const rttMatch = output.match(/([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/);
    if (rttMatch) {
      minMs = parseFloat(rttMatch[1]);
      avgMs = parseFloat(rttMatch[2]);
      maxMs = parseFloat(rttMatch[3]);
      mdevMs = parseFloat(rttMatch[4]);
    }
  }

  const totalSent = count;
  const received = lossPercent === 100 ? 0 : Math.round(totalSent * (1 - lossPercent / 100));

  return {
    host,
    packetsSent: totalSent,
    packetsReceived: received,
    packetLossPercent: lossPercent,
    minMs,
    avgMs,
    maxMs,
    mdevMs,
    status: lossPercent === 100 ? "timeout" : "success",
  };
}

export async function tracerouteHost(host: string, maxHops = 20): Promise<TracerouteResult> {
  if (!/^[a-zA-Z0-9.\-_:]+$/.test(host)) {
    return {
      host,
      hops: [],
      totalHops: 0,
      status: "error",
      error: "Invalid host. Only alphanumeric characters, dots, hyphens, colons, and underscores allowed.",
    };
  }

  const cmd = IS_WINDOWS
    ? `tracert -d -h ${maxHops} ${host}`
    : `traceroute -n -m ${maxHops} ${host}`;

  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 60_000 });
    if (stderr && !stdout) {
      return {
        host,
        hops: [],
        totalHops: 0,
        status: "error",
        error: stderr.trim(),
      };
    }
    return parseTracerouteOutput(host, stdout);
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; killed?: boolean };
    if (error.stdout) {
      const result = parseTracerouteOutput(host, error.stdout);
      if (result.hops.length > 0) {
        return { ...result, status: "incomplete" };
      }
    }
    return {
      host,
      hops: [],
      totalHops: 0,
      status: error.killed ? "timeout" : "error",
      error: error.killed
        ? "Traceroute timed out. The target may be unreachable or blocking ICMP."
        : error.stderr?.trim() || "Traceroute failed",
    };
  }
}

function parseTracerouteOutput(host: string, output: string): TracerouteResult {
  const hops: TracerouteHop[] = [];
  const lines = output.split("\n");
  let targetIp: string | undefined;

  // Try to extract target IP from first line
  if (!IS_WINDOWS) {
    const targetMatch = output.match(/traceroute to \S+ \(([^)]+)\)/);
    if (targetMatch) targetIp = targetMatch[1];
  }
  if (IS_WINDOWS) {
    const targetMatch = output.match(/Tracing route to \S+ \[([^\]]+)\]/);
    if (targetMatch) targetIp = targetMatch[1];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (IS_WINDOWS) {
      // Windows tracert format:
      //  1     <1 ms    <1 ms    <1 ms  192.168.1.1
      //  2     *        *        *     Request timed out.
      //  3    10 ms    12 ms    11 ms  a.b.c.d
      const winMatch = trimmed.match(/^\s*(\d+)\s+(<?\d+|\*)\s+ms?\s+(<?\d+|\*)\s+ms?\s+(<?\d+|\*)\s+ms?\s+(.+)?$/i);
      if (winMatch) {
        const hopNum = parseInt(winMatch[1], 10);
        const rtt1 = winMatch[2] === "*" ? undefined : parseFloat(winMatch[2].replace(/[<>\s]/g, ""));
        const rtt2 = winMatch[3] === "*" ? undefined : parseFloat(winMatch[3].replace(/[<>\s]/g, ""));
        const rtt3 = winMatch[4] === "*" ? undefined : parseFloat(winMatch[4].replace(/[<>\s]/g, ""));
        const dest = winMatch[5]?.trim() || undefined;
        const isTimeout = !dest || dest.toLowerCase().includes("request timed out") || (!rtt1 && !rtt2 && !rtt3);
        if (dest && !dest.toLowerCase().includes("request timed out") && !dest.toLowerCase().includes("time out")) {
          hops.push({ hop: hopNum, ip: dest, rtt1, rtt2, rtt3, isTimeout });
        } else {
          hops.push({ hop: hopNum, isTimeout: true });
        }
      }
    } else {
      // Linux traceroute format:
      //  1  192.168.1.1  0.260 ms  0.240 ms  0.220 ms
      //  2  * * *
      const nixMatch = trimmed.match(/^\s*(\d+)\s+(\*|[\d.]+)\s+([\d.]+|[*])\s*ms\s+([\d.]+|[*])\s*ms\s+([\d.]+|[*])\s*ms/i);
      if (nixMatch) {
        const hopNum = parseInt(nixMatch[1], 10);
        const dest = nixMatch[2] === "*" ? undefined : nixMatch[2];
        const rtt1 = nixMatch[3] === "*" ? undefined : parseFloat(nixMatch[3]);
        const rtt2 = nixMatch[4] === "*" ? undefined : parseFloat(nixMatch[4]);
        const rtt3 = nixMatch[5] === "*" ? undefined : parseFloat(nixMatch[5]);
        hops.push({
          hop: hopNum,
          ip: dest,
          rtt1,
          rtt2,
          rtt3,
          isTimeout: !dest,
        });
      }
    }
  }

  return {
    host,
    targetIp,
    hops,
    totalHops: hops.length,
    status: hops.length > 0 ? "success" : "error",
    error: hops.length === 0 ? "No hops parsed from traceroute output" : undefined,
  };
}
