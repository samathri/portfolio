$ErrorActionPreference = 'Stop'

$source = 'C:\Users\User\Documents\Codex\2026-07-31\refer\work\centered-spotlight'
$target = 'C:\xampp\htdocs\portfolio'

if (-not (Test-Path -LiteralPath $source)) {
  throw "Verified source project was not found: $source"
}

if (-not (Test-Path -LiteralPath $target)) {
  throw "Portfolio target folder was not found: $target"
}

Copy-Item -LiteralPath "$source\src\main.jsx" -Destination "$target\src\main.jsx" -Force
Copy-Item -LiteralPath "$source\src\styles.css" -Destination "$target\src\styles.css" -Force
Copy-Item -LiteralPath "$source\src\ThreeAvatar.jsx" -Destination "$target\src\ThreeAvatar.jsx" -Force

Push-Location $target
try {
  & 'C:\Program Files\nodejs\npm.cmd' run build
} finally {
  Pop-Location
}

Write-Host 'Centered avatar spotlight version installed successfully.' -ForegroundColor Green
