import dns from "node:dns";
import { execSync } from "node:child_process";

let configuredResolver: dns.Resolver | null = null;

function detectSystemDns(): string[] {
  // If system DNS is 127.0.0.1, it's the Windows DNS Client stub — need real upstream
  const systemServers = dns.getServers();
  const hasLoopback = systemServers.some((s) => s === "127.0.0.1" || s === "::1");

  if (!hasLoopback) return systemServers;

  // Try to read real DNS from Windows network adapter config
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses | Sort-Object -Unique"',
      { timeout: 5000, encoding: "utf-8" }
    );
    const servers = output.split("\n").map((s) => s.trim()).filter((s) =>
      s && !s.startsWith("fec0:") && s !== "127.0.0.1" && s !== "::1"
    );
    if (servers.length > 0) return servers;
  } catch {}

  // Fallback: well-known public DNS
  return ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"];
}

function getResolver(): dns.Resolver {
  if (configuredResolver) return configuredResolver;

  // Priority 1: explicit env var
  const envServers = process.env.DNS_SERVERS;
  if (envServers && envServers.trim()) {
    const list = envServers.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) {
      configuredResolver = new dns.Resolver();
      configuredResolver.setServers(list);
      return configuredResolver;
    }
  }

  // Priority 2: auto-detect real system DNS (skip 127.0.0.1 stub)
  const realServers = detectSystemDns();
  configuredResolver = new dns.Resolver();
  configuredResolver.setServers(realServers);
  return configuredResolver;
}

function wrapCb<T>(resolve: (v: T) => void, reject: (e: Error) => void) {
  return (err: NodeJS.ErrnoException | null, result: T) => {
    if (err) reject(err);
    else resolve(result);
  };
}

export async function resolve4(hostname: string): Promise<string[]> {
  const resolver = getResolver();
  return new Promise<string[]>((res, rej) => resolver.resolve4(hostname, wrapCb(res, rej)));
}

export async function resolve6(hostname: string): Promise<string[]> {
  const resolver = getResolver();
  return new Promise<string[]>((res, rej) => resolver.resolve6(hostname, wrapCb(res, rej)));
}

export async function reverse(ip: string): Promise<string[]> {
  const resolver = getResolver();
  return new Promise<string[]>((res, rej) => resolver.reverse(ip, wrapCb(res, rej)));
}

export function getDnsServers(): string[] {
  const resolver = getResolver();
  return resolver.getServers();
}

export async function lookupAll(hostname: string): Promise<Array<{ address: string; family: number }>> {
  const resolver = getResolver();
  return new Promise<Array<{ address: string; family: number }>>((res, rej) => {
    resolver.resolve(hostname, (err: NodeJS.ErrnoException | null, result: string[]) => {
      if (err) {
        // Fallback to system lookup
        dns.promises.lookup(hostname, { all: true }).then(res).catch(rej);
      } else {
        // resolve returns A/AAAA records, wrap as LookupAddress
        const mapped = result.map((addr) => ({
          address: addr,
          family: addr.includes(":") ? 6 : 4,
        }));
        res(mapped);
      }
    });
  });
}
