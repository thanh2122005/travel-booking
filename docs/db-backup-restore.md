# DB Backup/Restore (XAMPP MySQL)

Muc tieu: tranh mat du lieu khi reset/migrate/seed.

## 1) Backup nhanh

Chay:

```powershell
powershell -ExecutionPolicy Bypass -File .\ops\db-backup.ps1
```

File backup se duoc tao trong thu muc `backups/` voi ten dang:

`travel_booking_YYYYMMDD_HHMMSS.sql`

## 2) Backup truoc khi thay doi DB

Chay:

`powershell -ExecutionPolicy Bypass -File .\ops\db-backup-before-change.ps1`

Dung lenh nay truoc cac thao tac nguy hiem:

- reset database
- seed lai toan bo
- migrate lon

## 3) Restore tu file moi nhat

Chay:

`powershell -ExecutionPolicy Bypass -File .\ops\db-restore.ps1`

## 4) Restore tu file cu the

Chay:

```powershell
powershell -ExecutionPolicy Bypass -File .\\ops\\db-restore.ps1 -BackupFile "D:\\path\\to\\travel_booking_20260420_223930.sql"
```

## 5) Luu y quan trong

- Kiem tra MySQL XAMPP dang chay truoc khi backup/restore.
- Khong commit file dump SQL lon len git.
- He thong dang giu toi da 20 ban backup moi nhat (`KeepLast` trong `db-backup.ps1`).

## 6) Audit nhanh sau khi restore

`powershell -ExecutionPolicy Bypass -File .\ops\db-audit.ps1`
