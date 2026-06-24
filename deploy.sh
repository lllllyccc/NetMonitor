#!/usr/bin/env bash
# NetMonitor — One-click deployment script for Ubuntu/Debian
# Usage: sudo ./deploy.sh --domain your-domain.com --email you@email.com [--port 3000] [--app-dir /opt/netmonitor]
set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────────
PORT=3000
APP_DIR="/opt/netmonitor"
REPO_URL=""
DOMAIN=""
EMAIL=""
NGINX_CONF="/etc/nginx/sites-available/netmonitor"
NGINX_LINK="/etc/nginx/sites-enabled/netmonitor"

# ─── Parse arguments ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="$2";   shift 2 ;;
    --email)   EMAIL="$2";    shift 2 ;;
    --port)    PORT="$2";     shift 2 ;;
    --app-dir) APP_DIR="$2";  shift 2 ;;
    --repo)    REPO_URL="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: --domain is required"
  echo "Usage: sudo ./deploy.sh --domain your-domain.com --email you@email.com [--port 3000] [--app-dir /opt/netmonitor]"
  exit 1
fi

if [[ -z "$EMAIL" ]]; then
  echo "Error: --email is required (for Let's Encrypt certificate)"
  exit 1
fi

# ─── Pre-flight checks ────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "Error: This script must be run as root (use sudo)"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           NetMonitor — Production Deployment                ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Domain:    $DOMAIN"
echo "║  Port:      $PORT"
echo "║  App dir:   $APP_DIR"
echo "║  Email:     $EMAIL"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Install system dependencies ───────────────────────────────────────
echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq curl git nginx certbot > /dev/null 2>&1

# Install Node.js 20 LTS via NodeSource
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20.* ]]; then
  echo "  → Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo "  ✓ Node.js $(node -v), npm $(npm -v)"

# ─── Step 2: Clone or copy project ─────────────────────────────────────────────
echo "[2/8] Setting up application at $APP_DIR..."
if [[ -n "$REPO_URL" ]]; then
  if [[ -d "$APP_DIR/.git" ]]; then
    cd "$APP_DIR" && git pull && cd -
  else
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  # If running from inside the project directory, copy it
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ "$SCRIPT_DIR" != "$APP_DIR" ]]; then
    mkdir -p "$APP_DIR"
    cp -r "$SCRIPT_DIR"/. "$APP_DIR"/
  fi
fi
cd "$APP_DIR"
echo "  ✓ Source ready at $APP_DIR"

# ─── Step 3: Install dependencies and build ────────────────────────────────────
echo "[3/8] Installing dependencies and building..."
npm ci --production=false 2>/dev/null || npm install
npm run build
echo "  ✓ Build complete"

# Install only production dependencies after build
npm ci --production 2>/dev/null || npm install --production
echo "  ✓ Production dependencies installed"

# ─── Step 4: Configure environment ─────────────────────────────────────────────
echo "[4/8] Configuring environment..."
if [[ ! -f .env ]]; then
  cp .env.example .env
  # Set production defaults
  sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" .env
  sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" .env
  sed -i "s/^PORT=.*/PORT=$PORT/" .env
  sed -i "s/^HOST=.*/HOST=127.0.0.1/" .env
  # Set CORS to the actual domain
  if grep -q "^CORS_ORIGIN=" .env; then
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" .env
  else
    echo "CORS_ORIGIN=https://$DOMAIN" >> .env
  fi
  echo "  ✓ .env created with production settings"
else
  echo "  → .env already exists, keeping current settings"
fi

# Ensure data and logs directories exist
mkdir -p data logs
echo "  ✓ Data and logs directories ready"

# ─── Step 5: Install PM2 and start application ─────────────────────────────────
echo "[5/8] Setting up PM2 process manager..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# Stop existing instance if running
pm2 delete netmonitor 2>/dev/null || true

# Update ecosystem config with the correct port
if [[ "$PORT" != "3000" ]]; then
  sed -i "s/\"PORT\": \"3000\"/\"PORT\": \"$PORT\"/" ecosystem.config.cjs
fi

pm2 start ecosystem.config.cjs
pm2 save
# Setup PM2 to start on boot (uses systemd)
pm2 startup systemd -u root --hp "$APP_DIR" 2>/dev/null || true
echo "  ✓ PM2 started and configured for auto-start"

# ─── Step 6: Generate Nginx configuration ──────────────────────────────────────
echo "[6/8] Configuring Nginx..."

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

# Generate Nginx config (HTTP only first, for Certbot challenge)
cat > "$NGINX_CONF" << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
NGINX_EOF

ln -sf "$NGINX_CONF" "$NGINX_LINK"
nginx -t
systemctl reload nginx
echo "  ✓ Nginx HTTP config ready"

# ─── Step 7: Obtain SSL certificate ────────────────────────────────────────────
echo "[7/8] Obtaining SSL certificate from Let's Encrypt..."
certbot certonly \
  --nginx \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --redirect
echo "  ✓ SSL certificate obtained"

# Now update Nginx config with full HTTPS
cat > "$NGINX_CONF" << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS — tell browsers to always use HTTPS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_connect_timeout 10s;

        # Allow speedtest upload payloads (up to 30 MB)
        client_max_body_size 30m;
    }
}
NGINX_EOF

nginx -t
systemctl reload nginx
echo "  ✓ Nginx HTTPS config applied"

# ─── Step 8: Setup auto-renewal ────────────────────────────────────────────────
echo "[8/8] Setting up certificate auto-renewal..."
# Certbot installs a systemd timer by default; verify it's active
if systemctl is-active --quiet certbot.timer 2>/dev/null; then
  echo "  ✓ Certbot timer already active (auto-renewal enabled)"
else
  # Create a cron job as fallback
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -
  echo "  ✓ Cron job created for certificate renewal"
fi

# ─── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Deployment Complete!                           ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  URL:       https://${DOMAIN}"
echo "║  Port:      ${PORT} (internal)"
echo "║  App dir:   ${APP_DIR}"
echo "║  PM2:       pm2 status / pm2 logs netmonitor"
echo "║  Nginx:     ${NGINX_CONF}"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Useful commands:"
echo "  pm2 status                  # Check process status"
echo "  pm2 logs netmonitor         # View application logs"
echo "  pm2 restart netmonitor      # Restart the application"
echo "  pm2 stop netmonitor         # Stop the application"
echo "  certbot renew --dry-run     # Test certificate renewal"
echo ""
