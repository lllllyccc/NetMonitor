export interface ChangelogEntry {
  version: string;
  date: string;
  tag?: { zh: string; en: string };
  changes: { zh: string[]; en: string[] };
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-06-24",
    tag: { zh: "首个正式版本", en: "Initial Release" },
    changes: {
      zh: [
        "## 网络诊断工具",
        "- **IP 查询** — 检测公网 IPv4/IPv6 地址，获取地理位置、ISP、ASN 信息，识别代理/VPN/Tor 节点",
        "- **TLS/SSL 检测** — 分析证书详情、协议版本、加密套件，评估安全等级",
        "- **HTTP 安全标头** — 检查 HSTS、CSP、X-Frame-Options 等安全头并评分",
        "- **ECH 检测** — 检测加密客户端问候（Encrypted Client Hello）支持情况，含客户端与服务端双向探测",
        "- **速度测试** — 测量下载/上传速率、延迟及抖动",
        "- **DNS 泄露检测** — 检测 DNS 服务器配置，识别潜在泄露风险",
        "- **Ping / 路由追踪** — 网络路径诊断与延迟测量",
      ],
      en: [
        "## Network Diagnostics",
        "- **IP Lookup** — Detect public IPv4/IPv6 addresses, geolocation, ISP/ASN info, proxy/VPN/Tor detection",
        "- **TLS/SSL Check** — Analyze certificate details, protocol version, cipher suites, security grading",
        "- **HTTP Security Headers** — Check HSTS, CSP, X-Frame-Options and score security posture",
        "- **ECH Detection** — Detect Encrypted Client Hello support with client-side and server-side probing",
        "- **Speed Test** — Measure download/upload throughput, latency, and jitter",
        "- **DNS Leak Test** — Detect DNS resolver configuration and identify potential leaks",
        "- **Ping / Traceroute** — Network path diagnostics and latency measurement",
      ],
    },
  },
];
