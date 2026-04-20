param(
  [string]$Database = "travel_booking",
  [string]$User = "root",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$BackupFile = ""
)

$ErrorActionPreference = "Stop"

$mysqlCandidates = @(
  "C:\\xampp\\mysql\\bin\\mysql.exe",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe",
  "mysql"
)

$mysqlExe = $null
foreach ($candidate in $mysqlCandidates) {
  try {
    if ($candidate -eq "mysql") {
      $command = Get-Command "mysql" -ErrorAction Stop
      $mysqlExe = $command.Source
      break
    }
    if (Test-Path $candidate) {
      $mysqlExe = $candidate
      break
    }
  } catch {
    continue
  }
}

if (-not $mysqlExe) {
  throw "Khong tim thay mysql.exe. Vui long cai MySQL client hoac XAMPP."
}

$backupDir = Join-Path $PSScriptRoot "..\\backups"
if ([string]::IsNullOrWhiteSpace($BackupFile)) {
  $latest = Get-ChildItem -Path $backupDir -Filter "$Database*.sql" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latest) {
    throw "Khong tim thay file backup trong $backupDir"
  }
  $BackupFile = $latest.FullName
}

if (-not (Test-Path $BackupFile)) {
  throw "Khong tim thay file backup: $BackupFile"
}

Write-Host "Dang restore '$Database' tu file: $BackupFile"
$restoreCommand = "`"$mysqlExe`" --host=$DbHost --port=$Port --user=$User --binary-mode=1 --default-character-set=utf8mb4 $Database < `"$BackupFile`""
cmd /c $restoreCommand

if ($LASTEXITCODE -ne 0) {
  throw "Restore that bai. Kiem tra file backup va ket noi MySQL."
}

Write-Host "Restore thanh cong."
