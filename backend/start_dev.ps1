# Start FastAPI backend with hot-reload support
if (Test-Path ".\.venv") {
    Write-Host "[Backend] Activating virtual environment (.venv)..." -ForegroundColor Yellow
    . .\.venv\Scripts\Activate.ps1
} elseif (Test-Path ".\venv") {
    Write-Host "[Backend] Activating virtual environment (venv)..." -ForegroundColor Yellow
    . .\venv\Scripts\Activate.ps1
}

Write-Host "[Backend] Starting Uvicorn server on http://localhost:8000" -ForegroundColor Green
uvicorn main:application --reload --port 8000
