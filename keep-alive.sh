#!/bin/bash
while true; do
  echo "Starting SAHAMI server..."
  node .next/standalone/server.js 2>&1
  echo "Server died, restarting in 2s..."
  sleep 2
done
