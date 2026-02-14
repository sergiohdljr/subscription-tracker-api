#!/bin/bash

set -e

if [ -z "$RENDER_WEBHOOK_URL" ]; then
  echo "❌ Error: RENDER_WEBHOOK_URL environment variable is not set"
  exit 1
fi

echo "🚀 Deploying to Render..."

response=$(curl -s -w "\n%{http_code}" -X POST "$RENDER_WEBHOOK_URL")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ Deployment triggered successfully!"
  echo "Response: $body"
  exit 0
else
  echo "❌ Deployment failed with HTTP status: $http_code"
  echo "Response: $body"
  exit 1
fi

