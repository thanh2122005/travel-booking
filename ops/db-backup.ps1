param(
  [string]$Database = "travel_booking",
  [string]$User = "root",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$OutputDir = "",
  [int]$KeepLast = 20
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $PSScriptRoot "..\\backups"
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$mysqlDumpCandidates = @(
  "C:\\xampp\\mysql\\bin\\mysqldump.exe",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "mysqldump"
)

$mysqlDumpExe = $null
foreach ($candidate in $mysqlDumpCandidates) {
  try {
    if ($candidate -eq "mysqldump") {
      $command = Get-Command "mysqldump" -ErrorAction Stop
      $mysqlDumpExe = $command.Source
      break
    }
    if (Test-Path $candidate) {
      $mysqlDumpExe = $candidate
      break
    }
  } catch {
    continue
  }
}

if (-not $mysqlDumpExe) {
  throw "Khong tim thay mysqldump.exe. Vui long cai MySQL client hoac XAMPP."
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $OutputDir "$Database`_$timestamp.sql"

Write-Host "Dang backup database '$Database' -> $backupFile"

$dumpArgs = @(
  "--host=$DbHost",
  "--port=$Port",
  "--user=$User",
  "--default-character-set=utf8mb4",
  "--routines",
  "--events",
  "--triggers",
  "--single-transaction",
  $Database
)

$proc = Start-Process -FilePath $mysqlDumpExe -ArgumentList $dumpArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $backupFile
$exitCode = $proc.ExitCode

if ($exitCode -ne 0 -or -not (Test-Path $backupFile)) {
  throw "Backup that bai. Kiem tra ket noi MySQL va quyen truy cap."
}

$oldBackups = Get-ChildItem -Path $OutputDir -Filter "$Database*.sql" -File | Sort-Object LastWriteTime -Descending
if ($oldBackups.Count -gt $KeepLast) {
  $oldBackups | Select-Object -Skip $KeepLast | Remove-Item -Force
}

Write-Host "Backup thanh cong: $backupFile"
