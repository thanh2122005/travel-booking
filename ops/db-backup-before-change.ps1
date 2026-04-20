param(
  [string]$Database = "travel_booking",
  [string]$User = "root",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "db-backup.ps1"
if (-not (Test-Path $scriptPath)) {
  throw "Khong tim thay script backup: $scriptPath"
}

Write-Host "Tao backup truoc khi thay doi DB..."
& $scriptPath -Database $Database -User $User -DbHost $DbHost -Port $Port

if ($LASTEXITCODE -ne 0) {
  throw "Khong the tao backup truoc thay doi DB."
}

Write-Host "Da backup xong. Ban co the tiep tuc migrate/seed/reset."
