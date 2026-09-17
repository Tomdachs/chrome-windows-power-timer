[CmdletBinding(DefaultParameterSetName = 'Install')]
param(
    [Parameter(ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Uninstall')][switch]$Uninstall,
    [switch]$OpenChromeExtensions,
    [switch]$NativeHostOnly,
    [ValidatePattern('^[a-p]{32}$')]
    [string[]]$ExtensionId = @('lfcapfodknbfpomfifbkfekikbflmjck')
)

$ErrorActionPreference = 'Stop'
$hostName = 'com.tomdachs.windows_power_timer'
$installDir = Join-Path $env:LOCALAPPDATA 'Tomdachs\WindowsPowerTimer'
$hostExe = Join-Path $installDir 'windows-power-host.exe'
$hostManifest = Join-Path $installDir "$hostName.json"
$extensionInstallDir = Join-Path $installDir 'extension'
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
    $encoding = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $Text, $encoding)
}

function Get-ChromeExecutable {
    $candidates = New-Object Collections.Generic.List[string]
    foreach ($appPath in @(
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'
    )) {
        if (Test-Path -LiteralPath $appPath) {
            $value = (Get-Item -LiteralPath $appPath).GetValue('')
            if ($value) { $candidates.Add([string]$value) }
        }
    }
    if ($env:ProgramFiles) {
        $candidates.Add((Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'))
    }
    if (${env:ProgramFiles(x86)}) {
        $candidates.Add((Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'))
    }
    if ($env:LOCALAPPDATA) {
        $candidates.Add((Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'))
    }
    $command = Get-Command chrome.exe -ErrorAction SilentlyContinue
    if ($command -and $command.Source) { $candidates.Add($command.Source) }
    return $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique -First 1
}

function Test-Installation {
    $problems = New-Object Collections.Generic.List[string]
    if (-not (Test-Path -LiteralPath $hostExe)) { $problems.Add("Missing host executable: $hostExe") }
    if (-not (Test-Path -LiteralPath $hostManifest)) { $problems.Add("Missing host manifest: $hostManifest") }
    if (-not (Test-Path -LiteralPath $registryPath)) {
        $problems.Add("Missing registry key: $registryPath")
    } else {
        $registered = (Get-Item -LiteralPath $registryPath).GetValue('')
        if ($registered -ne $hostManifest) { $problems.Add("Native host registry path points to: $registered") }
    }
    if (Test-Path -LiteralPath $hostManifest) {
        try {
            $nativeManifest = Get-Content -LiteralPath $hostManifest -Raw | ConvertFrom-Json
            foreach ($id in $ExtensionId) {
                $expectedOrigin = "chrome-extension://$id/"
                if ($expectedOrigin -notin @($nativeManifest.allowed_origins)) {
                    $problems.Add("Native host does not allow expected extension origin: $expectedOrigin")
                }
            }
        } catch {
            $problems.Add("Native host manifest is invalid JSON: $($_.Exception.Message)")
        }
    }
    if ($problems.Count -gt 0) {
        $problems | ForEach-Object { Write-Error $_ }
        return $false
    }
    Write-Host 'Windows Power Timer native host is installed correctly.'
    if (Test-Path -LiteralPath $extensionInstallDir) { Write-Host "Extension directory: $extensionInstallDir" }
    Write-Host "Allowed extension ID(s): $($ExtensionId -join ', ')"
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

if (-not $NativeHostOnly) {
    if (Test-Path -LiteralPath $extensionInstallDir) {
        Remove-Item -LiteralPath $extensionInstallDir -Recurse -Force
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '..\extension') -Destination $extensionInstallDir -Recurse -Force
}

$manifestObject = [ordered]@{
    name = $hostName
    description = 'Windows sleep/shutdown native host for Windows Power Timer'
    path = $hostExe
    type = 'stdio'
    allowed_origins = @($ExtensionId | ForEach-Object { "chrome-extension://$_/" })
}
Write-Utf8NoBom -Path $hostManifest -Text ($manifestObject | ConvertTo-Json -Depth 3)
New-Item -Path $registryPath -Force | Out-Null
Set-Item -LiteralPath $registryPath -Value $hostManifest

if (-not (Test-Installation)) { throw 'Installation verification failed.' }

Write-Host ''
if ($NativeHostOnly) {
    Write-Host 'Native host installation complete. The Chrome extension should be installed separately.'
} else {
    Write-Host 'Next: open chrome://extensions, enable Developer mode, choose Load unpacked, and select:'
    Write-Host "  $extensionInstallDir"
}

if ($OpenChromeExtensions -and -not $NativeHostOnly) {
    $chrome = Get-ChromeExecutable
    if (-not $chrome) { throw 'Chrome executable was not found.' }
    Write-Host "Opening Chrome: $chrome"
    Start-Process -FilePath $chrome -ArgumentList @('chrome://extensions/')
}
