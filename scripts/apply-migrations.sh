#!/bin/bash
# QuotaHit - Apply All Database Migrations
# Run this script or paste the generated SQL into Supabase SQL Editor

set -e

MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"
OUTPUT_FILE="$(dirname "$0")/combined-migrations.sql"

echo "-- ============================================"
echo "-- QuotaHit Combined Database Migrations"
echo "-- Generated: $(date)"
echo "-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)"
echo "-- ============================================"
echo ""

for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$f")
  echo "-- ============================================"
  echo "-- Migration: $filename"
  echo "-- ============================================"
  cat "$f"
  echo ""
  echo ""
done

echo "-- ============================================"
echo "-- ALL MIGRATIONS APPLIED SUCCESSFULLY"
echo "-- ============================================"
