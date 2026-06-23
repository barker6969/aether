#!/usr/bin/env powershell
<#
.SYNOPSIS
    Build Aether CLI for Windows
.DESCRIPTION
    Compiles the Aether CLI tool for Windows x86_64 in release mode
.EXAMPLE
    .\scripts\build-cli-windows.ps1
    .\scripts\build-cli-windows.ps1 -OutputDir "C:\builds"
#>
param(
    [string]$OutputDir = "./dist",
    [switch]$Debug = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$BuildType = if ($Debug) { "debug" } else { "release" }
$BuildFlag = if ($Debug) { "" } else { "--release" }

Write-Host "Building Aether CLI for Windows ($BuildType)..." -ForegroundColor Cyan

Push-Location "aether/aether-cli"
try {
    # Build the CLI
    Write-Host "Compiling with cargo..." -ForegroundColor Yellow
    $buildCmd = "cargo build $BuildFlag"
    Write-Host "Running: $buildCmd" -ForegroundColor Gray
    Invoke-Expression $buildCmd
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    # Determine source binary path
    $sourceBinary = if ($Debug) {
        "./target/debug/aether-cli.exe"
    } else {
        "./target/release/aether-cli.exe"
    }
    
    if (-not (Test-Path $sourceBinary)) {
        throw "Binary not found at $sourceBinary"
    }
    
    # Create output directory
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    
    # Copy binary
    $destBinary = Join-Path $OutputDir "aether-cli.exe"
    Copy-Item -Path $sourceBinary -Destination $destBinary -Force
    
    # Get file info
    $fileSize = (Get-Item $destBinary).Length / 1MB
    
    Write-Host "Build complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output:" -ForegroundColor Cyan
    Write-Host "  Binary: $destBinary ($([Math]::Round($fileSize, 2)) MB)"
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  $destBinary --help"
    Write-Host ""
} finally {
    Pop-Location
}
