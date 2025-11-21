#!/bin/bash

# PETVERSE Health Check Script
# This script checks if both servers are running and restarts them if needed

echo "🔍 PETVERSE Health Check"
echo "========================"

# Check Backend
echo "📡 Checking Backend (port 4000)..."
if curl -s --max-time 5 http://localhost:4000/health > /dev/null; then
    echo "✅ Backend is healthy"
    BACKEND_STATUS="OK"
else
    echo "❌ Backend is not responding"
    BACKEND_STATUS="FAILED"
fi

# Check Frontend
echo "🎨 Checking Frontend (port 3000)..."
if curl -s --max-time 5 http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is healthy"
    FRONTEND_STATUS="OK"
else
    echo "❌ Frontend is not responding"
    FRONTEND_STATUS="FAILED"
fi

# Check Auth API
echo "🔐 Checking Auth API..."
if curl -s --max-time 5 http://localhost:4000/api/auth/health > /dev/null; then
    echo "✅ Auth API is healthy"
    AUTH_STATUS="OK"
else
    echo "❌ Auth API is not responding"
    AUTH_STATUS="FAILED"
fi

echo ""
echo "📊 Summary:"
echo "Backend: $BACKEND_STATUS"
echo "Frontend: $FRONTEND_STATUS" 
echo "Auth API: $AUTH_STATUS"

# Auto-restart if needed
if [[ "$BACKEND_STATUS" == "FAILED" || "$AUTH_STATUS" == "FAILED" ]]; then
    echo ""
    echo "🔄 Backend issues detected. Attempting to restart..."
    pkill -f "PORT=4000 npm start"
    sleep 2
    cd /Users/hirushadilshan/Documents/ITP_H/PETVERSE/backend
    PORT=4000 npm start &
    echo "🚀 Backend restart initiated"
    cd ..
fi

if [[ "$FRONTEND_STATUS" == "FAILED" ]]; then
    echo ""
    echo "🔄 Frontend issues detected. Attempting to restart..."
    pkill -f "npm run dev"
    sleep 2
    cd /Users/hirushadilshan/Documents/ITP_H/PETVERSE/frontend
    npm run dev &
    echo "🚀 Frontend restart initiated"
    cd ..
fi

echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "Test Page: http://localhost:3000/test"
echo ""