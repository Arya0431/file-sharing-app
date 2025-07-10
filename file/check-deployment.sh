#!/bin/bash

echo "🚀 File Transfer App Deployment Checker"
echo "========================================"

# Check if RENDER_URL is provided
if [ -z "$RENDER_URL" ]; then
    echo "❌ Please set your Render URL as environment variable:"
    echo "   export RENDER_URL=https://your-app-name.onrender.com"
    echo ""
    echo "Or run with: RENDER_URL=https://your-app-name.onrender.com node check-deployment.js"
    exit 1
fi

echo "🔍 Checking deployment at: $RENDER_URL"
echo ""

# Run the Node.js checker
node check-deployment.js

echo ""
echo "📋 Manual Checks to Perform:"
echo "1. Open $RENDER_URL in your browser"
echo "2. Open browser Developer Tools (F12)"
echo "3. Check Console tab for JavaScript errors"
echo "4. Check Network tab for failed requests"
echo "5. Check Render dashboard logs" 