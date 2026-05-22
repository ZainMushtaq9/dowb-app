@echo off
cd /d "%~dp0"
set NEXT_PUBLIC_ENABLE_MOCK_API=true
npm.cmd --workspace apps/web run dev -- --hostname 127.0.0.1 --port 3000
