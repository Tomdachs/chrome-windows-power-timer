[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\dist\windows-power-host.exe')
)

$ErrorActionPreference = 'Stop'
$sourcePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\host\WindowsPowerHost.cs'))
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
if (Test-Path -LiteralPath $outputFullPath) {
    Remove-Item -LiteralPath $outputFullPath -Force
}

$candidates = @(
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
) | Where-Object { Test-Path -LiteralPath $_ }
if ($candidates.Count -eq 0) { throw 'The .NET Framework C# compiler (csc.exe) was not found.' }

& $candidates[0] /nologo /target:exe /reference:System.Windows.Forms.dll "/out:$outputFullPath" $sourcePath
if ($LASTEXITCODE -ne 0) { throw "csc.exe failed with exit code $LASTEXITCODE." }
[void][Reflection.AssemblyName]::GetAssemblyName($outputFullPath)
Write-Host "Built native host: $outputFullPath"
