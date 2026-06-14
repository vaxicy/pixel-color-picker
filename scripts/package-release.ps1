param(
  [string]$Version = "1.0.0",
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputPath = Join-Path $root $OutputDir
$stagingPath = Join-Path $outputPath "pixel-color-picker-$Version"
$zipPath = Join-Path $outputPath "pixel-color-picker-$Version.zip"

if (Test-Path $stagingPath) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $stagingPath | Out-Null

$items = @(
  "manifest.json",
  "background",
  "fonts",
  "images",
  "lib",
  "options",
  "popup",
  "shared"
)

foreach ($item in $items) {
  $source = Join-Path $root $item
  $target = Join-Path $stagingPath $item
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $stagingPath "*") -DestinationPath $zipPath -Force

Write-Host "Created $zipPath"
