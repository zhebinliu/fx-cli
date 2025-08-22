#!/bin/bash
set -e

echo "🚀 Starting CI Pipeline..."
echo "=========================="

echo "📦 Installing dependencies..."
npm install

echo "🔍 Running linting..."
npm run lint

echo "🧪 Running tests..."
npm run test:run

echo "🏗️  Building project..."
npm run build

echo "✅ CI pipeline completed successfully!"
echo "=========================="
