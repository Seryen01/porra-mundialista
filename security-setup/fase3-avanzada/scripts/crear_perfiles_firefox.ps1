#Requires -Version 5.1
param([switch]$DryRun)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\firefox_perfiles_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $line  = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Msg"
    $color = if ($Level -eq "ERROR") {"Red"} elseif ($Level -eq "WARN") {"Yellow"} else {"Cyan"}
    Write-Host $line -ForegroundColor $color
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $line
    }
}

# Verificar Firefox
$firefoxExe = @(
    "$env:PROGRAMFILES\Mozilla Firefox\firefox.exe",
    "${env:PROGRAMFILES(X86)}\Mozilla Firefox\firefox.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $firefoxExe) {
    Write-Log "Firefox no encontrado. Instala Firefox primero." "ERROR"
    exit 1
}
Write-Log "Firefox encontrado: $firefoxExe"

# user.js base de privacidad
$userJsBase = @"
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("media.peerconnection.enabled", false);
user_pref("media.peerconnection.ice.no_host", true);
user_pref("network.trr.mode", 2);
user_pref("network.trr.uri", "https://dns.quad9.net/dns-query");
user_pref("privacy.resistFingerprinting", true);
user_pref("privacy.trackingprotection.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", true);
user_pref("privacy.trackingprotection.cryptomining.enabled", true);
user_pref("network.cookie.cookieBehavior", 1);
user_pref("network.prefetch-next", false);
user_pref("network.dns.disablePrefetch", true);
user_pref("extensions.pocket.enabled", false);
user_pref("dom.security.https_only_mode", true);
user_pref("privacy.userContext.enabled", true);
user_pref("privacy.userContext.ui.enabled", true);
user_pref("browser.startup.homepage", "about:blank");
"@

# Definicion de perfiles
$perfiles = @(
    @{ Nombre = "Trabajo";   Atajo = "Firefox - Trabajo";   Desc = "Sedes oficiales y administracion publica" },
    @{ Nombre = "Finanzas";  Atajo = "Firefox - Finanzas";  Desc = "DEGIRO, broker, banco, Revolut" },
    @{ Nombre = "Personal";  Atajo = "Firefox - Personal";  Desc = "Uso cotidiano y redes sociales" }
)

$escritorio = [Environment]::GetFolderPath("Desktop")

Write-Host "=== CREACION DE PERFILES DE FIREFOX ===" -ForegroundColor Green
if ($DryRun) { Write-Host "[DRY-RUN] Sin cambios reales." -ForegroundColor Magenta }

foreach ($perfil in $perfiles) {
    Write-Host "`n--- Perfil: $($perfil.Nombre) ---" -ForegroundColor White

    if ($DryRun) {
        Write-Log "[DRY-RUN] Se crearia perfil: $($perfil.Nombre)"
        Write-Log "[DRY-RUN] Se crearia acceso directo: $($perfil.Atajo).lnk"
        continue
    }

    # Crear perfil
    try {
        $proc = Start-Process -FilePath $firefoxExe `
            -ArgumentList "--CreateProfile `"$($perfil.Nombre)`"" `
            -Wait -PassThru -WindowStyle Hidden
        Write-Log "Perfil '$($perfil.Nombre)' creado." "OK"
        Write-Host "OK: Perfil creado." -ForegroundColor Green
    } catch {
        Write-Log "Error creando perfil $($perfil.Nombre): $_" "ERROR"
        continue
    }

    Start-Sleep -Milliseconds 800

    # Localizar carpeta del perfil
    $perfilesDir  = "$env:APPDATA\Mozilla\Firefox\Profiles"
    $carpetaPerfil = Get-ChildItem $perfilesDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "*.$($perfil.Nombre)" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($carpetaPerfil) {
        $userJsPath = "$($carpetaPerfil.FullName)\user.js"
        $userJsBase | Out-File -FilePath $userJsPath -Encoding UTF8 -Force
        Write-Log "user.js aplicado en: $userJsPath" "OK"
        Write-Host "OK: Configuracion de privacidad aplicada." -ForegroundColor Green
    } else {
        Write-Log "No se encontro carpeta del perfil '$($perfil.Nombre)'" "WARN"
        Write-Host "AVISO: No se pudo localizar la carpeta del perfil." -ForegroundColor Yellow
    }

    # Crear acceso directo en el Escritorio
    $rutaAtajo = "$escritorio\$($perfil.Atajo).lnk"
    try {
        $shell = New-Object -ComObject WScript.Shell
        $atajo = $shell.CreateShortcut($rutaAtajo)
        $atajo.TargetPath       = $firefoxExe
        $atajo.Arguments        = "-P `"$($perfil.Nombre)`" --no-remote"
        $atajo.Description      = $perfil.Desc
        $atajo.WorkingDirectory = Split-Path $firefoxExe -Parent
        $atajo.Save()
        Write-Log "Acceso directo creado: $rutaAtajo" "OK"
        Write-Host "OK: Acceso directo '$($perfil.Atajo)' creado en el Escritorio." -ForegroundColor Green
    } catch {
        Write-Log "Error al crear acceso directo: $_" "ERROR"
    }
}

Write-Host "`n=== PERFILES COMPLETADOS ===" -ForegroundColor Green
Write-Host "  En el Escritorio encontraras 3 accesos directos:" -ForegroundColor Cyan
Write-Host "  - Firefox - Trabajo   (para AEAT, Seg. Social, sedes)" -ForegroundColor Cyan
Write-Host "  - Firefox - Finanzas  (para DEGIRO, banco, broker)" -ForegroundColor Cyan
Write-Host "  - Firefox - Personal  (uso cotidiano)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Cada perfil tiene cookies y sesiones completamente aisladas." -ForegroundColor Cyan
Write-Host "  Instala Bitwarden y uBlock Origin en cada perfil por separado." -ForegroundColor Yellow

if (-not $DryRun) { Write-Host "`nLog en: $LogFile" -ForegroundColor Cyan }
