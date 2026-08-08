$backend = Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","cd ./backend; ./start_dev.ps1" -PassThru
Start-Sleep -Seconds 2
$frontend = Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","cd ./frontend; ./start_dev.ps1" -PassThru
Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "Backend: http://localhost:8000/healthz"
Write-Host "Frontend: http://localhost:5173"


