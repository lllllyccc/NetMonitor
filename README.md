# NetMonitor

Self-hosted network diagnostics tool. Deploy on Oracle Cloud Free Tier (ARM64) or any Node.js environment.

## Features

- **IP Lookup** — Public IP, geolocation, ISP/ASN, proxy/VPN/Tor detection
- **TLS Check** — Certificate details, protocol version, cipher suites, security grading
- **HTTP Security Headers** — HSTS, CSP, X-Frame-Options analysis with scoring
- **ECH Detection** — Encrypted Client Hello support analysis via DNS HTTPS records and TLS handshake inspection
- **Speed Test** — Download/upload throughput measurement, latency, and jitter analysis
- **DNS Leak Test** *(P2)* — DNS resolver leak detection
- **Ping/Traceroute** *(P2)* — Network path diagnostics

## Tech Stack

- **Backend**: Hono (Node.js) + TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Runtime**: Node.js 20 LTS, ARM64 compatible

## Quick Start

```bash
# Install dependencies
npm install

# Development (runs server + client with hot reload)
npm run dev

# Production build
npm run build
npm start
```

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DOMAIN` | `localhost` | For HTTPS certificate |
| `RATE_LIMIT_PER_MINUTE` | `30` | Global rate limit per IP |
| `MAX_SPEEDTEST_SIZE_MB` | `25` | Max speed test payload |
| `DB_PATH` | `./data/netmonitor.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/ip/lookup?target=` | IP/geolocation lookup |
| `GET` | `/api/tls/check?host=` | TLS certificate analysis |
| `GET` | `/api/headers/check?url=` | HTTP security headers audit |
| `GET` | `/api/ech/check?host=` | ECH (Encrypted Client Hello) detection |
| `GET` | `/api/speedtest/latency` | Measure latency and jitter |
| `GET` | `/api/speedtest/download?sizeMB=` | Download speed test payload |
| `POST` | `/api/speedtest/upload` | Upload speed test |
| `POST` | `/api/history` | Save detection record |
| `GET` | `/api/history?limit=20` | Get recent history |

## Deploy to Oracle Cloud ARM64

```bash
# On your Oracle ARM64 instance
git clone <your-repo> netmonitor && cd netmonitor
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start dist/server/server/index.js --name netmonitor
pm2 save
pm2 startup
```

For full deployment with Nginx + HTTPS, see `deploy.sh` *(coming in P3)*.

## Project Structure

```
src/
├── server/              # Backend API
│   ├── routes/          # API route handlers
│   ├── services/        # Core detection logic
│   ├── middleware/       # Rate limiting, error handling
│   └── index.ts         # Entry point
├── client/              # Frontend SPA
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Feature pages
│       ├── hooks/       # React hooks
│       └── lib/         # API client
└── shared/              # Shared TypeScript types
```

## License

MIT