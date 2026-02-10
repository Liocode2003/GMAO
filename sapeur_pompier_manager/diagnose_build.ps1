# diagnose_build.ps1 - Diagnostic script for flutter_assemble MSB8066 error
# Run this from PowerShell in the project directory:
#   cd C:\Users\lnadz\Downloads\sapeur_pompier_manager
#   .\diagnose_build.ps1

param(
    [string]$Config = "debug"
)

Write-Host "=== GMAO Flutter Windows Build Diagnostic ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Flutter version
Write-Host "[1/6] Flutter version:" -ForegroundColor Yellow
flutter --version
Write-Host ""

# Step 2: Flutter doctor
Write-Host "[2/6] Flutter doctor:" -ForegroundColor Yellow
flutter doctor -v
Write-Host ""

# Step 3: Clean previous build
Write-Host "[3/6] Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path build) { Remove-Item -Recurse -Force build }
if (Test-Path windows\flutter\ephemeral) { Remove-Item -Recurse -Force windows\flutter\ephemeral }
Write-Host "Cache cleared."
Write-Host ""

# Step 4: Run flutter pub get
Write-Host "[4/6] Running flutter pub get..." -ForegroundColor Yellow
flutter pub get 2>&1 | Tee-Object -FilePath "pub_get_output.txt"
Write-Host ""

# Step 5: Run flutter build with maximum verbosity and capture output
Write-Host "[5/6] Running flutter build windows --$Config (verbose)..." -ForegroundColor Yellow
Write-Host "Output will be saved to: build_verbose_output.txt"
Write-Host ""

$env:VERBOSE = "1"
flutter build windows --$Config --verbose 2>&1 | Tee-Object -FilePath "build_verbose_output.txt"

Write-Host ""
Write-Host "[6/6] Searching for MSBuild log files..." -ForegroundColor Yellow

# Find MSBuild log files
$logFiles = Get-ChildItem -Path "build" -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 10

if ($logFiles) {
    Write-Host "Found MSBuild logs:" -ForegroundColor Green
    foreach ($log in $logFiles) {
        Write-Host "  $($log.FullName) ($($log.Length) bytes)"
    }
    Write-Host ""
    Write-Host "Reading largest log file for errors..." -ForegroundColor Yellow
    $largestLog = $logFiles | Select-Object -First 1
    Get-Content $largestLog.FullName | Select-String -Pattern "error|Error|flutter_assemble|FAILED|exit code" |
        Select-Object -First 50 | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
} else {
    Write-Host "No MSBuild log files found in build directory." -ForegroundColor Gray
}

# Also check for flutter_assemble log
$assembleLog = "build\windows\x64\flutter\flutter_assemble.log"
if (Test-Path $assembleLog) {
    Write-Host ""
    Write-Host "=== flutter_assemble.log ===" -ForegroundColor Cyan
    Get-Content $assembleLog
}

# Extract just the flutter_assemble error from verbose output
Write-Host ""
Write-Host "=== flutter_assemble errors from verbose build ===" -ForegroundColor Cyan
if (Test-Path "build_verbose_output.txt") {
    Get-Content "build_verbose_output.txt" |
        Select-String -Pattern "flutter_assemble|Error|error:|FAILED|Unhandled exception|Stack trace" |
        Select-Object -First 100 |
        ForEach-Object { Write-Host $_.Line }
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host "Files saved:"
Write-Host "  pub_get_output.txt    - Output from flutter pub get"
Write-Host "  build_verbose_output.txt - Full verbose build output"
Write-Host ""
Write-Host "Share these files to help diagnose the MSB8066 error." -ForegroundColor Green
