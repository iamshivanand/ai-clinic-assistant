#!/bin/bash

# AI Clinic Assistant - Deployment Script
# Run this on your Hostinger VPS

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes from Git..."
git pull origin main

# 2. Install Backend Dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# 3. Install Frontend Dependencies & Build
echo "🏗️ Building frontend..."
cd ../frontend
npm install
npm run build

# 4. Restart PM2 Processes
echo "♻️ Restarting PM2 processes..."
cd ..
pm2 restart ecosystem.config.js --env production

echo "✅ Deployment Successful!"
