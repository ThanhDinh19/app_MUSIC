<#
.SYNOPSIS
  Đóng gói source, tải lên server qua SSH rồi build & chạy.
  -Mode docker (mặc định): Docker Compose (app + Caddy HTTPS).
  -Mode pm2              : Node + PM2 cài trực tiếp trên server.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Server thanh@34.92.57.155
  powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Server thanh@34.92.57.155 -Mode pm2
  powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Server thanh@34.92.57.155 -Key $HOME\.ssh\gcp_key

.NOTES
  - Không tải lên node_modules, dist, dữ liệu đang chạy, và các file .env ở máy bạn.
  - Lần đầu cần tạo cấu hình trên server (xem README → Triển khai). Script sẽ nhắc nếu thiếu.
#>
param(
  [Parameter(Mandatory = $true)][string]$Server,
  [ValidateSet('docker', 'pm2')][string]$Mode = 'docker',
  [string]$RemoteDir = 'nocturne',
  [string]$Key
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$archive = Join-Path $env:TEMP 'nocturne-src.tgz'
$sshOptions = @()
if ($Key) { $sshOptions += @('-i', $Key) }

Write-Host '1/3  Đóng gói source...' -ForegroundColor Cyan
if (Test-Path $archive) { Remove-Item $archive -Force }
tar -czf $archive -C $root `
  --exclude=node_modules --exclude=dist --exclude=.git `
  --exclude=server/storage/data --exclude=server/storage/secrets `
  --exclude=.env --exclude=server/.env --exclude='*.log' .
if ($LASTEXITCODE -ne 0) { throw 'Đóng gói thất bại.' }
Write-Host ("      {0:N1} MB" -f ((Get-Item $archive).Length / 1MB))

Write-Host "2/3  Tải lên $Server..." -ForegroundColor Cyan
scp @sshOptions $archive "${Server}:/tmp/nocturne-src.tgz"
if ($LASTEXITCODE -ne 0) { throw 'Không tải lên được (kiểm tra SSH key / tên người dùng / tường lửa cổng 22).' }

Write-Host "3/3  Build & khởi động trên server ($Mode, lần đầu mất vài phút)..." -ForegroundColor Cyan
$prepare = @"
set -e
mkdir -p ~/$RemoteDir
tar -xzf /tmp/nocturne-src.tgz -C ~/$RemoteDir
rm -f /tmp/nocturne-src.tgz
cd ~/$RemoteDir
"@

if ($Mode -eq 'docker') {
  $run = @"
if [ ! -f .env ] || [ ! -f server/.env ]; then
  echo ''
  echo 'Thiếu cấu hình trên server. Chạy lần đầu:'
  echo "  cd ~/$RemoteDir && cp .env.example .env && cp server/.env.example server/.env"
  echo '  rồi sửa DOMAIN trong .env và AUTH_SECRET... trong server/.env, sau đó chạy lại script này.'
  exit 2
fi
docker compose up -d --build
docker image prune -f > /dev/null
docker compose ps
"@
} else {
  $run = @"
command -v node > /dev/null || { echo 'Chưa cài Node.js 22 trên server (xem README → Triển khai bằng PM2).'; exit 3; }
command -v pm2 > /dev/null || { echo 'Chưa cài PM2: sudo npm install -g pm2'; exit 3; }
if [ ! -f server/.env ]; then
  echo ''
  echo 'Thiếu cấu hình trên server. Chạy lần đầu:'
  echo "  cd ~/$RemoteDir && cp server/.env.example server/.env && nano server/.env"
  echo '  (đặt NODE_ENV=production, AUTH_SECRET, GOOGLE_CLIENT_ID...), sau đó chạy lại script này.'
  exit 2
fi
npm ci --no-audit --no-fund
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 status
"@
}

# Gửi script qua stdin để tránh lỗi trích dẫn giữa PowerShell và bash.
($prepare + "`n" + $run) -replace "`r", '' | ssh @sshOptions $Server 'bash -s'
if ($LASTEXITCODE -ne 0) { throw "Triển khai chưa xong (mã $LASTEXITCODE). Xem thông báo phía trên." }

Write-Host ''
if ($Mode -eq 'docker') {
  Write-Host 'Xong! Mở https://<DOMAIN>. Xem log: cd ~/nocturne && docker compose logs -f app' -ForegroundColor Green
} else {
  Write-Host 'Xong! Mở https://<DOMAIN> (qua Caddy/Nginx) hoặc http://<IP>:4000. Xem log: pm2 logs music-app' -ForegroundColor Green
}
