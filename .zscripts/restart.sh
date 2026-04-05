#!/bin/bash
cd /home/z/my-project
# Kill old processes
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2
# Start dev server
nohup bun run dev > dev.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > .zscripts/dev.pid
disown $NEW_PID 2>/dev/null
sleep 15
# Verify
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "✅ SAHAMI server restarted (PID: $NEW_PID)"
else
  echo "❌ Server failed to start"
fi
