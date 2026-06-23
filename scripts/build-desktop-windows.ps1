#!/usr/bin/env powershell
<#
.SYNOPSIS
    Build Aether Desktop App for Windows
.DESCRIPTION
    Compiles the Aether Desktop application with Tauri for Windows
    Supports MSI, NSIS, and portable EXE builds
.EXAMPLE
    .\scripts\build-desktop-windows.ps1 -Type msi
    .\scripts\build-desktop-windows.ps1 -Type nsis
    .\scripts\build-desktop-windows.ps1 -Type all
#>
param(
    [ValidateSet('msi', 'nsis', 'exe', 'all')]
    [string]$Type = 'all',
    [switch]$Dev = $false,
    [switch]$SkipInstall = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    $checks = @{
        'Node.js' = 'node --version'
        'npm' = 'npm --version'
        'Yarn' = 'yarn --version'
        'Rust' = 'rustc --version'
        'Cargo' = 'cargo --version'
    }
    
    foreach ($name in $checks.Keys) {
        try {
            $result = Invoke-Expression $checks[$name] 2>&1
            Write-Host "  ✓ $name" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ $name" -ForegroundColor Red
            Write-Host "    Please install $name from https://nodejs.org or https://rustup.rs/" -ForegroundColor Yellow
            exit 1
        }
    }
}

function Build-Desktop {
    param(
        [string]$BuildType
    )
    
    $buildMap = @{
        'msi' = 'build:msi'
        'nsis' = 'build:nsis'
        'exe' = 'build'
    }
    
    $scriptName = $buildMap[$BuildType]
    
    Write-Host "Running: yarn $scriptName" -ForegroundColor Yellow
    
    Push-Location "aether/aether-desktop"
    try {
        $cmd = "yarn $scriptName"
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

function Show-Output {
    param([string]$BuildType)
    
    $bundleDir = "aether/aether-desktop/src-tauri/target/release/bundle"
    
    Write-Host ""
    Write-Host "Build Output:" -ForegroundColor Green
    
    switch ($BuildType) {
        'msi' {
            $installer = Get-ChildItem "$bundleDir/msi/*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($installer) {
                $size = [Math]::Round($installer.Length / 1MB, 2)
                Write-Host "  📦 MSI Installer: $($installer.FullName) ($size MB)"
                Write-Host "     Usage: Double-click to install"
            }
        }
        'nsis' {
            $installer = Get-ChildItem "$bundleDir/nsis/*-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($installer) {
                $size = [Math]::Round($installer.Length / 1MB, 2)
                Write-Host "  📦 NSIS Installer: $($installer.FullName) ($size MB)"
                Write-Host "     Usage: Double-click to install"
            }
        }
        'exe' {
            $app = "aether/aether-desktop/src-tauri/target/release/aether-desktop.exe"
            if (Test-Path $app) {
                $size = [Math]::Round((Get-Item $app).Length / 1MB, 2)
                Write-Host "  🚀 Portable App: $app ($size MB)"
                Write-Host "     Usage: Run directly, no installation needed"
            }
        }
        'all' {
            Show-Output 'msi'
            Show-Output 'nsis'
            Show-Output 'exe'
        }
    }
}

# Main execution
if (-not $Dev) {
    Test-Prerequisites
}

if (-not $SkipInstall) {
    Write-Step "Installing Dependencies"
    Push-Location "aether/aether-desktop"
    try {
        Write-Host "Running: yarn install" -ForegroundColor Yellow
        yarn install
        
        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed"
        }
    } finally {
        Pop-Location
    }
}

if ($Dev) {
    Write-Step "Starting Development Server"
    Push-Location "aether/aether-desktop"
    try {
        yarn dev
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Building Aether Desktop for Windows"
    
    if ($Type -eq 'all') {
        foreach ($bundleType in @('msi', 'nsis', 'exe')) {
            Build-Desktop -BuildType $bundleType
            Show-Output -BuildType $bundleType
        }
    } else {
        Build-Desktop -BuildType $Type
        Show-Output -BuildType $Type
    }
    
    Write-Host ""
    Write-Host "✓ Build Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Distribution:" -ForegroundColor Cyan
    Write-Host "  MSI:  Professional installer (recommended for end users)"
    Write-Host "  NSIS: Lightweight installer with advanced options"
    Write-Host "  EXE:  Portable executable (no installation required)"
    Write-Host ""
}
