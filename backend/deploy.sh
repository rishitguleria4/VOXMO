#!/bin/bash
# Voxmo Backend — DigitalOcean Droplet Setup Script
# Run this on a fresh Ubuntu 22.04+ droplet
# Usage: ssh root@your-droplet-ip 'bash -s' < deploy.sh

set -e

echo "==> Updating system..."
apt update && apt upgrade -y

echo "==> Installing dependencies..."
apt install -y curl unzip git nginx certbot python3-certbot-nginx

echo "==> Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc

echo "==> Cloning repository..."
cd /opt
git clone https://github.com/rishitguleria4/VOXMO.git voxmo || (cd voxmo && git pull origin main)
cd voxmo/backend

echo "==> Installing backend dependencies..."
bun install
npx prisma generate
npx prisma db push

echo "==> Creating systemd service..."
cat > /etc/systemd/system/voxmo-backend.service << 'EOF'
[Unit]
Description=Voxmo Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/voxmo/backend
EnvironmentFile=/opt/voxmo/backend/.env
ExecStart=/root/.bun/bin/bun index.ts
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "==> Enabling and starting service..."
systemctl daemon-reload
systemctl enable voxmo-backend
systemctl start voxmo-backend

echo ""
echo "✅ Backend service is running!"
echo ""
echo "NEXT STEPS:"
echo "1. Create /opt/voxmo/backend/.env with your environment variables"
echo "2. Run: systemctl restart voxmo-backend"
echo "3. Set up Nginx reverse proxy (see nginx.conf in the repo)"
echo "4. Run: certbot --nginx -d api.yourdomain.com"
echo ""
echo "Check status: systemctl status voxmo-backend"
echo "View logs:    journalctl -u voxmo-backend -f"
