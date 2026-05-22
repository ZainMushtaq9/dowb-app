@echo off
cd /d "%~dp0"
set NEXT_PUBLIC_ENABLE_MOCK_API=false
set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787/api
start "Local TikTok API" cmd /k node scripts\local-api.cjs
npm.cmd --workspace apps/web run dev -- --hostname 127.0.0.1 --port 3000
