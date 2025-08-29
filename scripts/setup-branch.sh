#!/bin/bash

# Setup script for branch-specific configuration
# This script configures the project based on the current git branch

set -e

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🔄 Setting up configuration for branch: $BRANCH"

if [ "$BRANCH" = "dev" ]; then
    echo "📦 Configuring for STAGING environment..."
    
    # Copy staging vercel config
    if [ -f "vercel.dev.json" ]; then
        cp vercel.dev.json vercel.json
        echo "✅ Updated vercel.json for staging"
    fi
    
    # Use staging environment file
    if [ -f ".env.dev.staging" ]; then
        cp .env.dev.staging .env.local
        echo "✅ Loaded staging environment variables"
    fi
    
    echo "🌐 Staging URL: https://dev.minimarket.aramac.dev"
    
elif [ "$BRANCH" = "main" ]; then
    echo "📦 Configuring for PRODUCTION environment..."
    
    # Copy production vercel config
    if [ -f "vercel.prod.json" ]; then
        cp vercel.prod.json vercel.json
        echo "✅ Updated vercel.json for production"
    fi
    
    # Use production environment file
    if [ -f ".env.prod" ]; then
        cp .env.prod .env.production
        echo "✅ Loaded production environment variables"
    fi
    
    echo "🌐 Production URL: https://minimarket.aramac.dev"
    
else
    echo "📦 Configuring for DEVELOPMENT environment..."
    
    # Use development environment file
    if [ -f ".env.dev" ]; then
        cp .env.dev .env.local
        echo "✅ Loaded development environment variables"
    fi
    
    echo "🌐 Development URL: http://localhost:3000"
fi

echo "🎉 Branch configuration complete!"
