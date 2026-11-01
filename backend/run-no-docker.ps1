# PowerShell script to build and run the Go backend inside WSL (bypassing Smart App Control) without Docker

Write-Host "Compiling Go binary for Linux (Target: AMD64)..." -ForegroundColor Cyan
$env:CGO_ENABLED="0"
$env:GOOS="linux"
$env:GOARCH="amd64"
go build -o main_linux .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation successful!" -ForegroundColor Green
    Write-Host "Starting Go backend server inside WSL (running on port 8080)..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
    wsl -d docker-desktop ./main_linux
} else {
    Write-Host "Error: Compilation failed." -ForegroundColor Red
    exit 1
}
