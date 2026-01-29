# Script untuk generate OTA bundle
# Run: ./scripts/create-bundle.ps1

Write-Host "🚀 Creating OTA Bundle..." -ForegroundColor Cyan

# Build the app
Write-Host "📦 Building Next.js app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Create bundle directory if not exists
$bundleDir = ".\bundle-temp"
if (Test-Path $bundleDir) {
    Remove-Item -Recurse -Force $bundleDir
}
New-Item -ItemType Directory -Path $bundleDir | Out-Null

# Copy the output to bundle temp
Copy-Item -Recurse ".\out\*" $bundleDir

# Create zip file
$version = (Get-Content .\package.json | ConvertFrom-Json).version
$zipFile = ".\bundle.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

Write-Host "📦 Creating bundle.zip for version $version..." -ForegroundColor Yellow
Compress-Archive -Path "$bundleDir\*" -DestinationPath $zipFile -Force

# Cleanup
Remove-Item -Recurse -Force $bundleDir

# Update the update.json
$updateJson = @{
    version = $version
    url = "https://github.com/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk/releases/latest/download/bundle.zip"
} | ConvertTo-Json

$updateJson | Out-File -FilePath ".\update.json" -Encoding utf8

Write-Host "✅ Bundle created: bundle.zip (v$version)" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit and push update.json to main branch"
Write-Host "2. Create a new GitHub Release with tag v$version"
Write-Host "3. Upload bundle.zip to the release"
Write-Host ""
