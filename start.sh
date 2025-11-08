#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
  echo "✓ Loaded environment variables from .env.local"
else
  echo "⚠ Warning: .env.local file not found"
fi

# Start the development server
echo "🚀 Starting development server..."
yarn dev

