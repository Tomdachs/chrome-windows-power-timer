[CmdletBinding(DefaultParameterSetName = 'Install')]
param(
    [Parameter(ParameterSetName = 'Check')][switch]$Check,
    [Parameter(ParameterSetName = 'Uninstall')][switch]$Uninstall,
    [switch]$OpenChromeExtensions,
    [ValidatePattern('^[a-p]{32}$')]
    [string]$ExtensionId = 'lfcapfodknbfpomfifbkfekikbflmjck'
)

$script = Join-Path $PSScriptRoot 'scripts\install-host.ps1'
& $script @PSBoundParameters
exit $LASTEXITCODE
