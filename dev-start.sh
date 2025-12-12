#!/bin/bash

# Plane Development Environment Startup Script
# This script starts only web and admin services (excluding live and space)

echo "Starting Plane development environment..."
echo "Web app will be available at: http://localhost:3000"
echo "Admin app will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

pnpm turbo run dev --filter=web --filter=admin
