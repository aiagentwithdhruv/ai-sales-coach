#!/bin/bash
# ===========================================
# QuotaHit - One-Click Setup Script
# ===========================================
# This script sets up everything you need to run QuotaHit locally
# Usage: bash scripts/setup.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       QuotaHit - Setup Script            ║"
echo "║   Autonomous AI Sales Department         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Step 1: Check Node.js
echo -e "${GREEN}[1/6]${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Install from https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo "  ✓ Node.js $(node -v)"

# Step 2: Install dependencies
echo -e "${GREEN}[2/6]${NC} Installing dependencies..."
npm install --silent 2>/dev/null
echo "  ✓ Dependencies installed"

# Step 3: Check .env.local
echo -e "${GREEN}[3/6]${NC} Checking environment variables..."
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}  ⚠ No .env.local found. Copying from .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}  → Please edit .env.local with your actual API keys${NC}"
    echo -e "${YELLOW}  → Minimum required: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY${NC}"
else
    echo "  ✓ .env.local exists"
    # Check critical vars
    MISSING=""
    grep -q "your-project" .env.local 2>/dev/null && MISSING="$MISSING SUPABASE"
    grep -q "sk-your-openai" .env.local 2>/dev/null && MISSING="$MISSING OPENAI"
    if [ -n "$MISSING" ]; then
        echo -e "${YELLOW}  ⚠ Some keys still have placeholder values:${MISSING}${NC}"
    fi
fi

# Step 4: Database migrations
echo -e "${GREEN}[4/6]${NC} Database migrations..."
if [ -f scripts/combined-migrations.sql ]; then
    echo "  ✓ Combined migration file ready: scripts/combined-migrations.sql"
    echo "  → Paste this into Supabase SQL Editor to create all 51 tables"
else
    echo "  Generating combined migration file..."
    bash scripts/apply-migrations.sh > scripts/combined-migrations.sql 2>/dev/null
    echo "  ✓ Generated: scripts/combined-migrations.sql"
fi

# Step 5: Build check
echo -e "${GREEN}[5/6]${NC} Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ Build successful"
else
    echo -e "${RED}  ✗ Build failed. Run 'npm run build' to see errors${NC}"
fi

# Step 6: Summary
echo -e "${GREEN}[6/6]${NC} Setup complete!"
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  NEXT STEPS                         ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  1. Apply database migrations:                       ║"
echo "║     → Go to supabase.com/dashboard → SQL Editor     ║"
echo "║     → Paste contents of scripts/combined-migrations  ║"
echo "║     → Click 'Run'                                    ║"
echo "║                                                      ║"
echo "║  2. Start the dev server:                            ║"
echo "║     → npm run dev                                    ║"
echo "║                                                      ║"
echo "║  3. Sign up at http://localhost:3000/signup           ║"
echo "║                                                      ║"
echo "║  4. Deploy to Vercel:                                ║"
echo "║     → vercel --prod                                  ║"
echo "║     → Set env vars in Vercel dashboard               ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Run: npm run dev"
