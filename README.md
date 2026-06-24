# NetMonitor

Self-hosted network diagnostics toolkit with a modern dark UI. Deploy on any Node.js server.

## Features

- **IP Lookup** — Public IPv4/IPv6 detection, geolocation with country flag, ISP/ASN info, proxy/VPN/Tor identification
- **TLS/SSL Check** — Certificate analysis, protocol version, cipher suites, security grading (A+ to F)
- **HTTP Security Headers** — HSTS, CSP, X-Frame-Options audit with scoring and hardening recommendations
- **ECH Detection** — Encrypted Client Hello support analysis with client-side browser detection and server-side deep probing
- **Speed Test** — Download/upload throughput measurement, latency, and jitter analysis
- **DNS Leak Test** — DNS resolver detection, leak risk assessment, provider identification
- **Ping / Traceroute** — Network path diagnostics with hop-by-hop latency breakdown
- **History** — Auto-saved detection records stored in browser localStorage
- **Bilingual** — Chinese/English interface with one-click switching
- **Dark/Light Theme** — System-aware theme toggle with manual override
- **Legal Compliance** — Multi-jurisdiction legal notices (PRC, EU, US, HK, Taiwan) with first-visit modal
- **Click to Copy** — All detection results are copyable with one click

## Tech Stack

- **Backend**: Hono + TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Runtime**: Node.js 20+ LTS

## Quick Start

```bash
# Install dependencies
npm install

# Development (server + client with hot reload)
npm run dev

# Production build
npm run build
npm start
```

## Configuration

Copy `.env.example` to `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | `development` or `production` |
| `RATE_LIMIT_PER_MINUTE` | `30` | Global rate limit per IP |
| `MAX_SPEEDTEST_SIZE_MB` | `25` | Max speed test payload |
| `DNS_SERVERS` | *(system)* | Custom DNS servers (comma-separated, e.g. `8.8.8.8,1.1.1.1`) |
| `LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `IPINFO_TOKEN` | *(empty)* | ipinfo.io API token (optional) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/ip/lookup?target=` | IP/geolocation lookup |
| `GET` | `/api/tls/check?host=` | TLS certificate analysis |
| `GET` | `/api/headers/check?url=` | HTTP security headers audit |
| `GET` | `/api/ech/check?host=` | ECH basic check |
| `GET` | `/api/ech/probe?host=` | ECH deep probe (SNI analysis) |
| `GET` | `/api/ech/client-probe` | Client TLS metadata |
| `GET` | `/api/speedtest/latency` | Measure latency and jitter |
| `GET` | `/api/speedtest/download?sizeMB=` | Download speed test payload |
| `POST` | `/api/speedtest/upload` | Upload speed test |
| `GET` | `/api/dns/leak-test` | DNS leak detection |
| `GET` | `/api/ping/ping?host=&count=` | ICMP ping |
| `GET` | `/api/ping/traceroute?host=&maxHops=` | Traceroute |

## Deployment

### PM2 + Nginx

```bash
# Build
npm install
npm run build
npm ci --production

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Nginx config

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 30m;
    }
}
```

### HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos
```

### One-click deploy (Ubuntu/Debian)

```bash
sudo ./deploy.sh --domain your-domain.com --email you@email.com
```

## Project Structure

```
src/
├── server/                  # Backend API
│   ├── routes/              # API route handlers
│   ├── services/            # Core detection logic
│   ├── middleware/           # Rate limiting, error handling
│   ├── utils/               # DNS resolver, logger
│   └── index.ts             # Entry point
├── client/                  # Frontend SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Feature pages
│       ├── hooks/           # React hooks (locale, theme, API)
│       ├── lib/             # API client, history, ECH detection
│       └── legal/           # Legal documents & changelog
└── shared/                  # Shared TypeScript types
```

## License

MIT

---

&copy; 2026 lllllyccc. All Rights Reserved.
