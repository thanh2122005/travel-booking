param(
  [string]$Database = "travel_booking",
  [string]$User = "root",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306
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
  throw "Khong tim thay mysql.exe."
}

$sql = @"
USE $Database;
SELECT 'users' label, COUNT(*) total FROM user
UNION ALL SELECT 'locations', COUNT(*) FROM location
UNION ALL SELECT 'tours', COUNT(*) FROM tour
UNION ALL SELECT 'bookings', COUNT(*) FROM booking
UNION ALL SELECT 'reviews', COUNT(*) FROM review
UNION ALL SELECT 'favorites', COUNT(*) FROM favorite
UNION ALL SELECT 'inquiries', COUNT(*) FROM contactinquiry
UNION ALL SELECT 'newsletters', COUNT(*) FROM newslettersubscriber;

SELECT 'booking.userId orphan' check_name, COUNT(*) bad_rows
FROM booking b LEFT JOIN user u ON u.id=b.userId WHERE u.id IS NULL
UNION ALL
SELECT 'booking.tourId orphan', COUNT(*) FROM booking b LEFT JOIN tour t ON t.id=b.tourId WHERE t.id IS NULL
UNION ALL
SELECT 'tour.locationId orphan', COUNT(*) FROM tour t LEFT JOIN location l ON l.id=t.locationId WHERE l.id IS NULL;
"@

& $mysqlExe --host=$DbHost --port=$Port --user=$User --default-character-set=utf8mb4 -e $sql

if ($LASTEXITCODE -ne 0) {
  throw "DB audit that bai."
}
