#Requires -Version 5.1
param([switch]$DryRun)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\browser_passwords_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Msg"
    $color = if ($Level -eq "ERROR") {"Red"} elseif ($Level -eq "WARN") {"Yellow"} else {"Cyan"}
    Write-Host $line -ForegroundColor $color
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $line
    }
}

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) {
    Write-Host "ERROR: Ejecuta como Administrador." -ForegroundColor Red
    exit 1
}

Write-Host "=== DESHABILITAR GUARDADO DE CONTRASENAS EN NAVEGADORES ===" -ForegroundColor Green
if ($DryRun) { Write-Host "[DRY-RUN] Sin cambios reales." -ForegroundColor Magenta }

Write-Host ""
Write-Host "ADVERTENCIA: Asegurate de haber exportado tus contrasenas" -ForegroundColor Yellow
Write-Host "a Bitwarden antes de continuar." -ForegroundColor Yellow
Write-Host ""

if (-not $DryRun) {
    $respuesta = Read-Host "Has exportado ya tus contrasenas a Bitwarden? (S/N)"
    if ($respuesta -notmatch "^[Ss]$") {
        Write-Host "Operacion cancelada. Exporta tus contrasenas primero." -ForegroundColor Red
        exit 0
    }
}

$informe = @()

function Set-BrowserPolicy {
    param(
        [string]$Navegador,
        [string]$RegPath,
        [string]$ValueName,
        [int]$ValueData
    )
    $desc = "$Navegador : $RegPath\$ValueName = $ValueData"
    if ($DryRun) {
        Write-Log "[DRY-RUN] Se aplicaria: $desc"
        $script:informe += "[DRY-RUN] $desc"
        return
    }
    try {
        if (-not (Test-Path $RegPath)) {
            New-Item -Path $RegPath -Force | Out-Null
        }
        Set-ItemProperty -Path $RegPath -Name $ValueName -Value $ValueData -Type DWord -Force
        Write-Log "Aplicado: $desc"
        $script:informe += "OK: $desc"
    } catch {
        Write-Log "Error: $desc - $_" "ERROR"
        $script:informe += "ERROR: $desc"
    }
}

# Crear punto de restauracion
if (-not $DryRun) {
    Write-Log "Creando punto de restauracion..."
    try {
        Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
        Checkpoint-Computer -Description "Antes de deshabilitar contrasenas navegadores" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        Write-Log "Punto de restauracion creado."
    } catch {
        Write-Log "No se pudo crear punto de restauracion: $_" "WARN"
    }
}

# Google Chrome
Write-Host "`n--- GOOGLE CHROME ---" -ForegroundColor White
$chromeExe = @(
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:PROGRAMFILES\Google\Chrome\Application\chrome.exe",
    "${env:PROGRAMFILES(X86)}\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chromeExe) {
    Write-Log "Chrome detectado en: $chromeExe"
    Write-Host "Chrome encontrado. Aplicando politicas..." -ForegroundColor Green
    Set-BrowserPolicy "Chrome" "HKLM:\SOFTWARE\Policies\Google\Chrome" "PasswordManagerEnabled" 0
    Set-BrowserPolicy "Chrome" "HKLM:\SOFTWARE\Policies\Google\Chrome" "AutofillAddressEnabled" 0
    Set-BrowserPolicy "Chrome" "HKLM:\SOFTWARE\Policies\Google\Chrome" "AutofillCreditCardEnabled" 0
} else {
    Write-Host "Chrome no encontrado. Omitiendo." -ForegroundColor Yellow
    $informe += "Chrome no instalado - omitido."
}

# Microsoft Edge
Write-Host "`n--- MICROSOFT EDGE ---" -ForegroundColor White
$edgeExe = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:PROGRAMFILES\Microsoft\Edge\Application\msedge.exe",
    "${env:PROGRAMFILES(X86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edgeExe) {
    Write-Log "Edge detectado en: $edgeExe"
    Write-Host "Edge encontrado. Aplicando politicas..." -ForegroundColor Green
    Set-BrowserPolicy "Edge" "HKLM:\SOFTWARE\Policies\Microsoft\Edge" "PasswordManagerEnabled" 0
    Set-BrowserPolicy "Edge" "HKLM:\SOFTWARE\Policies\Microsoft\Edge" "AutofillAddressEnabled" 0
    Set-BrowserPolicy "Edge" "HKLM:\SOFTWARE\Policies\Microsoft\Edge" "AutofillCreditCardEnabled" 0
    Set-BrowserPolicy "Edge" "HKLM:\SOFTWARE\Policies\Microsoft\Edge" "PasswordRevealEnabled" 0
} else {
    Write-Host "Edge no encontrado. Omitiendo." -ForegroundColor Yellow
    $informe += "Edge no instalado - omitido."
}

# Informe
Write-Host "`n--- INFORME DE CAMBIOS ---" -ForegroundColor White
foreach ($linea in $informe) { Write-Host "  $linea" }

Write-Host "`n--- PASOS SIGUIENTES ---" -ForegroundColor Yellow
Write-Host "  1. Reinicia Chrome y Edge para que las politicas surtan efecto."
Write-Host "  2. Los navegadores mostraran un aviso de politicas gestionadas. Es normal."
Write-Host "  3. Elimina las contrasenas guardadas en Edge:"
Write-Host "     edge://settings/passwords -> Contrasenas guardadas -> eliminar todas"
Write-Host ""

if (-not $DryRun) { Write-Host "Log guardado en: $LogFile" -ForegroundColor Cyan }
