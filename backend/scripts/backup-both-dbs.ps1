# CoreWallet — backup-both-dbs.ps1
#
# Dumps BOTH databases (local + RDS) to timestamped SQL files
# before any migration write is attempted.
#
# Prerequisites:
#   PostgreSQL 18 bin must be in PATH (pg_dump, psql)
#   Adjust $PG_BIN if pg_dump is not found automatically.
#
# Usage (run from backend/ directory):
#   powershell -ExecutionPolicy Bypass -File scripts\backup-both-dbs.ps1

# ── Configuration ─────────────────────────────────────────────────────────────
$PG_BIN       = "C:\Program Files\PostgreSQL\18\bin"   # adjust if needed
$BACKUP_DIR   = Join-Path $PSScriptRoot "..\backups"
$TIMESTAMP    = (Get-Date -Format "yyyyMMdd_HHmmss")

# Local
$LOCAL_HOST   = "localhost"
$LOCAL_PORT   = "5432"
$LOCAL_DB     = "corewallet"
$LOCAL_USER   = "postgres"
# Set PGPASSWORD env var below if your local postgres needs a password

# RDS — read from .env values
$RDS_HOST     = "corewallet-db.czgk0w02yt5t.us-east-2.rds.amazonaws.com"
$RDS_PORT     = "5432"
$RDS_DB       = "corewallet"
$RDS_USER     = "postgres"
$RDS_PASSWORD = "Samuelodeh1`$"   # backtick escapes $ in PowerShell

# ── Setup ─────────────────────────────────────────────────────────────────────
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

$env:PATH = "$PG_BIN;$env:PATH"

# Verify pg_dump is reachable
$pgdump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgdump) {
    Write-Error "pg_dump not found. Add PostgreSQL bin to PATH or update `$PG_BIN in this script."
    exit 1
}
Write-Host "pg_dump found: $($pgdump.Source)" -ForegroundColor Green

# ── Backup local ──────────────────────────────────────────────────────────────
$localFile = Join-Path $BACKUP_DIR "local_${TIMESTAMP}.sql"
Write-Host ""
Write-Host "Backing up LOCAL database → $localFile" -ForegroundColor Cyan

# PGPASSWORD avoids interactive password prompt for local
$env:PGPASSWORD = "postgres"    # change to your local postgres password if different
& pg_dump `
    --host   $LOCAL_HOST `
    --port   $LOCAL_PORT `
    --dbname $LOCAL_DB `
    --username $LOCAL_USER `
    --no-password `
    --format plain `
    --clean `
    --if-exists `
    --file   $localFile

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $localFile).Length
    Write-Host "  ✓ Local backup complete  ($([math]::Round($size/1KB, 1)) KB)" -ForegroundColor Green
} else {
    Write-Warning "  ✗ Local backup FAILED (exit code $LASTEXITCODE)"
    Write-Warning "  The migration can still proceed, but you will have no local rollback file."
}

# ── Backup RDS ────────────────────────────────────────────────────────────────
$rdsFile = Join-Path $BACKUP_DIR "rds_${TIMESTAMP}.sql"
Write-Host ""
Write-Host "Backing up RDS database → $rdsFile" -ForegroundColor Cyan

$env:PGPASSWORD  = $RDS_PASSWORD
$env:PGSSLMODE   = "require"

& pg_dump `
    --host     $RDS_HOST `
    --port     $RDS_PORT `
    --dbname   $RDS_DB `
    --username $RDS_USER `
    --no-password `
    --format plain `
    --clean `
    --if-exists `
    --file     $rdsFile

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $rdsFile).Length
    Write-Host "  ✓ RDS backup complete  ($([math]::Round($size/1KB, 1)) KB)" -ForegroundColor Green
} else {
    Write-Warning "  ✗ RDS backup FAILED (exit code $LASTEXITCODE)"
    Write-Warning "  Check RDS connectivity (SSL, firewall, password)."
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ("─" * 70)
Write-Host "Backups saved to: $BACKUP_DIR"
Write-Host ""
Write-Host "Next step — inspect both databases:"
Write-Host "  node scripts/migrate-local-to-rds.js --check"
Write-Host ""
Write-Host "Then dry-run:"
Write-Host "  node scripts/migrate-local-to-rds.js --dry-run"
Write-Host ""
Write-Host "Then apply:"
Write-Host "  node scripts/migrate-local-to-rds.js --migrate"
Write-Host ""
Write-Host "Rollback (if anything goes wrong restore the .sql file):"
Write-Host "  psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f $rdsFile"
Write-Host ("─" * 70)
