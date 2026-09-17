[CmdletBinding(DefaultParameterSetName = 'Install')]
param(
    [Parameter(ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Uninstall')][switch]$Uninstall,
    [switch]$OpenChromeExtensions
)

$ErrorActionPreference = 'Stop'
$hostName = 'com.tomdachs.windows_power_timer'
$extensionId = 'lfcapfodknbfpomfifbkfekikbflmjck'
$installDir = Join-Path $env:LOCALAPPDATA 'Tomdachs\WindowsPowerTimer'
$hostExe = Join-Path $installDir 'windows-power-host.exe'
$hostManifest = Join-Path $installDir "$hostName.json"
$extensionInstallDir = Join-Path $installDir 'extension'
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
    $encoding = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $Text, $encoding)
}

function Test-Installation {
    $problems = New-Object Collections.Generic.List[string]
    if (-not (Test-Path -LiteralPath $hostExe)) { $problems.Add("Missing host executable: $hostExe") }
    if (-not (Test-Path -LiteralPath $hostManifest)) { $problems.Add("Missing host manifest: $hostManifest") }
    if (-not (Test-Path -LiteralPath $extensionInstallDir)) { $problems.Add("Missing extension directory: $extensionInstallDir") }
    if (-not (Test-Path -LiteralPath $registryPath)) {
        $problems.Add("Missing registry key: $registryPath")
    } else {
        $registered = (Get-Item -LiteralPath $registryPath).GetValue('')
        if ($registered -ne $hostManifest) {
            $problems.Add("Native host registry path points to: $registered")
        }
    }
    if ($problems.Count -gt 0) {
        $problems | ForEach-Object { Write-Error $_ }
        return $false
    }
    Write-Host 'Windows Power Timer native host is installed correctly.'
    Write-Host "Extension directory: $extensionInstallDir"
    Write-Host "Expected extension ID: $extensionId"
    return $true
}

if ($Uninstall) {
    Remove-Item -LiteralPath $registryPath -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $installDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host 'Windows Power Timer native host was removed.'
    exit 0
}

if ($Check) {
    if (Test-Installation) { exit 0 } else { exit 1 }
}

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
& (Join-Path $PSScriptRoot 'build-host.ps1') -OutputPath $hostExe

if (Test-Path -LiteralPath $extensionInstallDir) {
    Remove-Item -LiteralPath $extensionInstallDir -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\extension') `
    -Destination $extensionInstallDir -Recurse -Force

$manifestObject = [ordered]@{
    name = $hostName
    description = 'Windows sleep/shutdown native host for Windows Power Timer'
    path = $hostExe
    type = 'stdio'
    allowed_origins = @("chrome-extension://$extensionId/")
}
Write-Utf8NoBom -Path $hostManifest -Text ($manifestObject | ConvertTo-Json -Depth 3)
New-Item -Path $registryPath -Force | Out-Null
Set-Item -LiteralPath $registryPath -Value $hostManifest

if (-not (Test-Installation)) { throw 'Installation verification failed.' }

Write-Host ''
Write-Host 'Next: open chrome://extensions, enable Developer mode, choose Load unpacked, and select:'
Write-Host "  $extensionInstallDir"

if ($OpenChromeExtensions) {
    $candidates = @(
        (Join-Path ${env:ProgramFiles} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    if ($candidates.Count -eq 0) { throw 'Chrome executable was not found.' }
    Start-Process -FilePath $candidates[0] -ArgumentList 'chrome://extensions/'
}
