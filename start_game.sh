#!/bin/bash

echo "🎮 Family Feud Launcher"
echo "--------------------------------"

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is missing!"
    echo "👉 Go to https://nodejs.org/ and install the 'LTS' version."
    echo "Then run this script again."
    exit 1
fi

# 2. Force Install Dependencies (Fixes 'vite not found')
if [ ! -d "node_modules" ]; then
    echo "📦 Installing game files (this happens once)..."
    npm install
else
    echo "✅ Files look ready."
fi

# 3. Launch
echo "🚀 Starting Game..."
echo "Opening browser..."
open "http://localhost:5173" &

# We use 'npx vite' directly to bypass path issues
npx vite