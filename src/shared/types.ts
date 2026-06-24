// Shared API response types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IpLookupResult {
  ip: string;
  ipv6?: string;
  countryCode: string;
  country: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
  asn: string;
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  reverseDns?: string;
}

export interface TlsCheckResult {
  host: string;
  port: number;
  protocol: string;
  cipher: string;
  certificate: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    serialNumber: string;
    fingerprint: string;
  };
  ocspStapling: boolean;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  issues: string[];
}

export interface HttpHeaderCheck {
  name: string;
  present: boolean;
  value?: string;
  recommendation?: string;
  severity: "critical" | "important" | "recommended";
}

export interface HttpHeadersResult {
  url: string;
  statusCode: number;
  headers: HttpHeaderCheck[];
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
}

export interface HistoryEntry {
  id: string;
  tool: "ip" | "tls" | "headers" | "ech" | "speedtest" | "dns" | "ping";
  target: string;
  result: unknown;
  createdAt: string;
}

export interface EchCheckResult {
  host: string;
  echSupported: boolean;
  echConfig?: string;
  dnsHttpsRecord: boolean;
  dnsHttpsValue?: string;
  tlsEchDetected: boolean;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  details: EchDetail[];
}

export interface EchDetail {
  check: string;
  status: "pass" | "fail" | "info" | "warn";
  message: string;
}

export interface EchProbeResult {
  host: string;
  port: number;
  dnsHttpsRecord: boolean;
  echConfigPresent: boolean;
  echConfigPayload?: string;
  tlsVersion?: string;
  cipherSuite?: string;
  alpnProtocols?: string[];
  certificateMatch: boolean;
  serverNameIndication: boolean;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  details: EchDetail[];
}

export interface SpeedTestResult {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  serverRegion: string;
  timestamp: string;
  testDurationMs: number;
}

export interface SpeedTestProgress {
  phase: "idle" | "latency" | "download" | "upload" | "complete";
  progress: number;
  currentMbps?: number;
  latencyMs?: number;
  jitterMs?: number;
}

export interface DnsServerInfo {
  address: string;
  provider: string;
  type: "public" | "isp" | "private" | "unknown";
  isEncrypted: boolean;
  isLeakLikely: boolean;
}

export interface DnsLeakDetail {
  check: string;
  status: "pass" | "fail" | "info" | "warn";
  message: string;
}

export interface DnsLeakResult {
  detectedServers: DnsServerInfo[];
  leakDetected: boolean;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  details: DnsLeakDetail[];
}

export interface PingResult {
  host: string;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  minMs: number;
  avgMs: number;
  maxMs: number;
  mdevMs?: number;
  status: "success" | "timeout" | "error";
  error?: string;
}

export interface TracerouteHop {
  hop: number;
  ip?: string;
  hostname?: string;
  rtt1?: number;
  rtt2?: number;
  rtt3?: number;
  isTimeout: boolean;
}

export interface TracerouteResult {
  host: string;
  targetIp?: string;
  hops: TracerouteHop[];
  totalHops: number;
  status: "success" | "incomplete" | "timeout" | "error";
  error?: string;
}


export type NavTool = "ip" | "tls" | "headers" | "ech" | "speedtest" | "dns" | "ping";

export interface ClientEchInfo {
  browser: string;
  version: string;
  supported: boolean;
  tls13: boolean;
  secureContext: boolean;
  http2: boolean;
  note: string;
  details: string[];
}
