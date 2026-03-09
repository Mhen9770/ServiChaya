# Quick TypeScript Error Checker
# Run this script to find all TypeScript errors at once

Write-Host "Checking TypeScript errors..." -ForegroundColor Cyan
npx tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "error TS" | ForEach-Object {
    Write-Host $_ -ForegroundColor Red
}

Write-Host "`nChecking Next.js build..." -ForegroundColor Cyan
npm run build 2>&1 | Select-String -Pattern "Type error|Failed to compile" | ForEach-Object {
    Write-Host $_ -ForegroundColor Red
}

Write-Host "`nDone! Check output above for errors." -ForegroundColor Green
