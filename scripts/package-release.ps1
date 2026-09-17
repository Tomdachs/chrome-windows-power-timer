[CmdletBinding()]
param(
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$manifest = Get-Content -LiteralPath (Join-Path $root 'extension\manifest.json') -Raw | ConvertFrom-Json
$manifestVersion = [string]$manifest.version
if (-not $Version) { $Version = $manifestVersion }
$Version = $Version.TrimStart('v')
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw "Invalid version: $Version" }
if ($Version -ne $manifestVersion) { throw "Release version $Version does not match manifest version $manifestVersion." }

$dist = Join-Path $root 'dist'
$stage = Join-Path $dist "chrome-windows-power-timer-$Version"
$zip = "$stage.zip"
$checksum = "$zip.sha256"
Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $zip, $checksum -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stage | Out-Null

foreach ($directory in @('extension', 'host')) {
    Copy-Item -LiteralPath (Join-Path $root $directory) -Destination (Join-Path $stage $directory) -Recurse
}
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'scripts') | Out-Null
foreach ($file in @('build-host.ps1', 'install-host.ps1')) {
    Copy-Item -LiteralPath (Join-Path $root "scripts\$file") -Destination (Join-Path $stage "scripts\$file")
}
foreach ($file in @('install.ps1', 'README.md', 'LICENSE', 'PRIVACY.md', 'SECURITY.md')) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $stage $file)
}
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'docs') | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'docs\README.ja.md') -Destination (Join-Path $stage 'docs\README.ja.md')

Compress-Archive -LiteralPath $stage -DestinationPath $zip -CompressionLevel Optimal
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant()
Set-Content -LiteralPath $checksum -Value "$hash  $(Split-Path -Leaf $zip)" -Encoding ascii
Write-Host "Release package: $zip"
Write-Host "SHA256: $checksum"
