# ============================================================
# CareerPilot — Full Stack Launcher (Windows PowerShell)
# Starts: Backend API + Frontend Dev Server + BullMQ Worker
#
# Prerequisites:
#   - Redis must be running (Docker: docker run -d -p 6379:6379 redis:7-alpine)
#   - worker/.env must exist (copy from worker/.env.example)
#   - backend/.env must exist (copy from backend/env.example)
# ============================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CareerPilot — Starting all services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Check Redis is reachable ────────────────────────────────────────────────
Write-Host "[Check] Testing Redis connection on localhost:6379..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 6379)
    $tcpClient.Close()
    Write-Host "[Check] ✅ Redis is running" -ForegroundColor Green
} catch {
    Write-Host "[Check] ⚠️  Redis is NOT running on port 6379." -ForegroundColor Red
    Write-Host "        Start it with: docker run -d -p 6379:6379 redis:7-alpine" -ForegroundColor Red
    Write-Host "        The worker service requires Redis to start." -ForegroundColor Red
    Write-Host ""
}

# ── Check worker/.env ───────────────────────────────────────────────────────
if (-not (Test-Path ".\worker\.env")) {
    Write-Host "[Check] ⚠️  worker/.env not found. Copying from worker/.env.example..." -ForegroundColor Yellow
    Copy-Item ".\worker\.env.example" ".\worker\.env"
    Write-Host "[Check] ✅ worker/.env created. Please fill in GOOGLE_API_KEY and DATABASE_URL." -ForegroundColor Green
}

# ── Install worker deps if needed ───────────────────────────────────────────
if (-not (Test-Path ".\worker\node_modules")) {
    Write-Host "[Setup] Installing BullMQ worker dependencies (npm install)..." -ForegroundColor Yellow
    Push-Location .\worker
    npm install
    Pop-Location
    Write-Host "[Setup] ✅ Worker dependencies installed" -ForegroundColor Green
}

Write-Host ""

# ── Start BullMQ Worker (Node.js) ───────────────────────────────────────────
Write-Host "[Start] Launching BullMQ Worker Service (port 3001)..." -ForegroundColor Cyan
$worker = Start-Process -FilePath powershell -ArgumentList `
    "-NoExit", `
    "-Command", "Set-Location '$(Get-Location)\worker'; Write-Host 'BullMQ Worker starting...' -ForegroundColor Cyan; node src/index.js" `
    -PassThru
Start-Sleep -Seconds 3

# ── Start Backend (Python FastAPI) ──────────────────────────────────────────
Write-Host "[Start] Launching FastAPI Backend (port 8000)..." -ForegroundColor Cyan
$backend = Start-Process -FilePath powershell -ArgumentList `
    "-NoExit", `
    "-Command", "Set-Location '$(Get-Location)\backend'; .\start_dev.ps1" `
    -PassThru
Start-Sleep -Seconds 2

# ── Start Frontend (Vite) ───────────────────────────────────────────────────
Write-Host "[Start] Launching Frontend Dev Server (port 5173)..." -ForegroundColor Cyan
$frontend = Start-Process -FilePath powershell -ArgumentList `
    "-NoExit", `
    "-Command", "Set-Location '$(Get-Location)\frontend'; npm run dev" `
    -PassThru

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  BullMQ Worker  : http://localhost:3001/health" -ForegroundColor White
Write-Host "  Backend API    : http://localhost:8000/healthz" -ForegroundColor White
Write-Host "  API Docs       : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend       : http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  PIDs:" -ForegroundColor Gray
Write-Host "    Worker   PID: $($worker.Id)" -ForegroundColor Gray
Write-Host "    Backend  PID: $($backend.Id)" -ForegroundColor Gray
Write-Host "    Frontend PID: $($frontend.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop individual services." -ForegroundColor Gray
