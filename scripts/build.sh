#!/bin/bash

# Build script for CI/CD pipeline
# This script ensures Prisma client is generated before building

set -e  # Exit on any error

echo "Starting build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo " Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies..."
    pnpm install
fi

# Generate Prisma client
echo " Generating Prisma client..."
pnpm prisma generate

# Verify Prisma client was generated
# Check custom output location first, then default
if [ -d "generated/prisma" ]; then
    PRISMA_CLIENT_PATH="generated/prisma"
else
    PRISMA_CLIENT_PATH=$(find node_modules -name ".prisma" -type d 2>/dev/null | head -1)
fi

if [ -z "$PRISMA_CLIENT_PATH" ]; then
    echo " Error: Prisma client was not generated properly"
    echo "Searched for generated/prisma and .prisma directory in node_modules"
    exit 1
fi
echo "Prisma client found at: $PRISMA_CLIENT_PATH"

# Build the application
echo "Building application..."
npx nest build

# Verify build output
if [ ! -d "dist" ]; then
    echo "Error: Build output directory 'dist' not found"
    exit 1
fi

echo "Build completed successfully!"
echo "Build output: $(du -sh dist/ | cut -f1)"
