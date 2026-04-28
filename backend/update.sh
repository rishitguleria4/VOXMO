#!/bin/bash
# Voxmo Backend — Quick Update Script
# Run on the droplet whenever you push new code
# Usage: ssh root@your-droplet-ip 'bash /opt/voxmo/backend/update.sh'

set -e

cd /opt/voxmo

echo "==> Pulling latest code..."
git pull origin main

cd backend

echo "==> Installing dependencies..."
bun install

echo "==> Regenerating Prisma client..."
npx prisma generate
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push

echo "==> Restarting service..."
systemctl restart voxmo-backend

echo "==> Checking status..."
sleep 2
systemctl status voxmo-backend --no-pager

echo ""
echo "✅ Backend updated and restarted!"
