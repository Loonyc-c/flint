#!/usr/bin/env bash
set -e

echo "🔍 Verifying Vercel deployment setup..."

# Check if shared directory exists
if [ ! -d "shared" ]; then
  echo "❌ Shared directory not found"
  exit 1
fi

# Check if copy scripts exist
if [ ! -f "frontend/scripts/copy-shared.sh" ]; then
  echo "❌ Frontend copy-shared.sh not found"
  exit 1
fi

if [ ! -f "backend/scripts/copy-shared.sh" ]; then
  echo "❌ Backend copy-shared.sh not found"
  exit 1
fi

# Check if vercel.json files exist
if [ ! -f "vercel.json" ]; then
  echo "❌ Root vercel.json not found"
  exit 1
fi

if [ ! -f "frontend/vercel.json" ]; then
  echo "❌ Frontend vercel.json not found"
  exit 1
fi

if [ ! -f "backend/vercel.json" ]; then
  echo "❌ Backend vercel.json not found"
  exit 1
fi

# Check if backend API handler exists
if [ ! -f "backend/api/index.ts" ]; then
  echo "❌ Backend API handler not found at backend/api/index.ts"
  exit 1
fi

# Check if @vercel/node is in backend dependencies
if ! grep -q "@vercel/node" backend/package.json; then
  echo "❌ @vercel/node not found in backend dependencies"
  exit 1
fi

# Test copy scripts
echo "📦 Testing shared code copy..."
cd frontend && bash scripts/copy-shared.sh && cd ..
cd backend && bash scripts/copy-shared.sh && cd ..

if [ ! -d "frontend/src/shared-types" ]; then
  echo "❌ Frontend shared-types not copied"
  exit 1
fi

if [ ! -d "backend/src/shared-types" ]; then
  echo "❌ Backend shared-types not copied"
  exit 1
fi

echo "✅ All deployment checks passed!"

