#!/bin/bash

# Build script for CI/CD pipeline
# This script ensures Prisma client is generated before building

set -e  # Exit on any error

echo "🔧 Starting build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Verify Prisma client was generated
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "❌ Error: Prisma client was not generated properly"
    exit 1
fi

# Build the application
echo "🏗️ Building application..."
pnpm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build output directory 'dist' not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output: $(du -sh dist/ | cut -f1)"
