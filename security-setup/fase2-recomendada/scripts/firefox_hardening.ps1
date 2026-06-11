#Requires -Version 5.1
<#
.SYNOPSIS
    Instala Firefox silenciosamente y aplica configuración de privacidad (user.js).
.PARAMETER DryRun
    Muestra qué haría el script sin aplicar cambios.
#>
param([switch]$DryRun)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\firefox_hardening_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Msg"
    Write-Host $line -ForegroundColor $(if ($Level -eq "ERROR") {"Red"} elseif ($Level -eq "WARN") {"Yellow"} else {"Cyan"})
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $line
    }
}

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) { Write-Host "ERROR: Ejecuta como Administrador." -ForegroundColor Red; exit 1 }

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║              HARDENING DE FIREFOX — PRIVACIDAD                  ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

if ($DryRun) { Write-Host "[DRY-RUN] Sin cambios reales.`n" -ForegroundColor Magenta }

# ── 1. Verificar/Instalar Firefox ─────────────────────────────────────────────
$firefoxExe = @(
    "$env:PROGRAMFILES\Mozilla Firefox\firefox.exe",
    "${env:PROGRAMFILES(X86)}\Mozilla Firefox\firefox.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($firefoxExe) {
    Write-Log "Firefox ya instalado en: $firefoxExe"
    Write-Host "✅ Firefox encontrado: $firefoxExe" -ForegroundColor Green
} else {
    Write-Log "Firefox no encontrado. Descargando instalador..."
    Write-Host "⬇️  Firefox no instalado. Descargando..." -ForegroundColor Yellow

    $installerUrl  = "https://download.mozilla.org/?product=firefox-latest-ssl&os=win64&lang=es-ES"
    $installerPath = "$env:TEMP\firefox_installer.exe"

    if ($DryRun) {
        Write-Log "[DRY-RUN] Se descargaría Firefox desde la URL oficial de Mozilla."
    } else {
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
            Write-Log "Instalador descargado: $installerPath"
            Write-Host "Instalando Firefox silenciosamente..." -ForegroundColor Yellow
            Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -ErrorAction Stop
            Write-Log "Firefox instalado correctamente."
            Write-Host "✅ Firefox instalado." -ForegroundColor Green
        } catch {
            Write-Log "Error al descargar/instalar Firefox: $_" "ERROR"
            Write-Host "❌ Error: $_. Instala Firefox manualmente desde https://www.mozilla.org/firefox/" -ForegroundColor Red
            exit 1
        }
    }
}

# ── 2. Localizar perfil de Firefox ────────────────────────────────────────────
Write-Log "Buscando perfil de Firefox..."

$profilesIniPath = "$env:APPDATA\Mozilla\Firefox\profiles.ini"
$perfilDir       = $null

if (Test-Path $profilesIniPath) {
    $profilesIni = Get-Content $profilesIniPath -Raw
    # Buscar el perfil por defecto (Default=1)
    if ($profilesIni -match 'Default=1[\s\S]*?Path=([^\r\n]+)') {
        $perfilRelativo = $Matches[1].Trim()
    } elseif ($profilesIni -match 'Path=([^\r\n]+)') {
        $perfilRelativo = $Matches[1].Trim()
    }

    if ($perfilRelativo) {
        if ($perfilRelativo -match '^[A-Za-z]:') {
            $perfilDir = $perfilRelativo
        } else {
            $perfilDir = "$env:APPDATA\Mozilla\Firefox\$perfilRelativo"
        }
    }
}

if (-not $perfilDir -or -not (Test-Path $perfilDir)) {
    # Buscar cualquier carpeta de perfil existente
    $perfilesDir = "$env:APPDATA\Mozilla\Firefox\Profiles"
    if (Test-Path $perfilesDir) {
        $perfilDir = (Get-ChildItem $perfilesDir -Directory | Select-Object -First 1).FullName
    }
}

if ($perfilDir -and (Test-Path $perfilDir)) {
    Write-Log "Perfil de Firefox encontrado: $perfilDir"
    Write-Host "✅ Perfil encontrado: $perfilDir" -ForegroundColor Green
} else {
    Write-Log "No se encontró perfil. Firefox debe ejecutarse al menos una vez para crear el perfil." "WARN"
    Write-Host "⚠️  Abre Firefox una vez para crear el perfil, luego vuelve a ejecutar este script." -ForegroundColor Yellow
    $perfilDir = "$env:APPDATA\Mozilla\Firefox\Profiles\default"
}

# ── 3. Crear user.js con configuración de privacidad ──────────────────────────
$userJsPath = "$perfilDir\user.js"

$userJsContent = @'
// ══════════════════════════════════════════════════════════════════════
// user.js — Configuración de privacidad para Firefox
// Generado por security-setup — Auditoría de Seguridad Personal
// ══════════════════════════════════════════════════════════════════════

// ─── Telemetría y envío de datos a Mozilla ────────────────────────────
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.server", "");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("browser.ping-centre.telemetry", false);
user_pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
user_pref("browser.newtabpage.activity-stream.telemetry", false);

// ─── Estudios y experimentos de Mozilla ──────────────────────────────
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);
user_pref("app.normandy.api_url", "");

// ─── Informes de fallos ───────────────────────────────────────────────
user_pref("breakpad.reportURL", "");
user_pref("browser.tabs.crashReporting.sendReport", false);

// ─── Geolocalización ─────────────────────────────────────────────────
user_pref("geo.enabled", false);
user_pref("geo.provider.network.url", "");
user_pref("browser.region.network.url", "");
user_pref("browser.region.update.enabled", false);

// ─── Protección contra WebRTC leak ───────────────────────────────────
// WebRTC puede revelar tu IP real incluso usando VPN
user_pref("media.peerconnection.enabled", false);
user_pref("media.peerconnection.ice.default_address_only", true);
user_pref("media.peerconnection.ice.no_host", true);

// ─── DNS sobre HTTPS (DoH) ────────────────────────────────────────────
// Usar Quad9 como proveedor DoH
user_pref("network.trr.mode", 2);
user_pref("network.trr.uri", "https://dns.quad9.net/dns-query");

// ─── Resistencia a fingerprinting ────────────────────────────────────
user_pref("privacy.resistFingerprinting", true);
user_pref("privacy.resistFingerprinting.block_mozAddonManager", true);
user_pref("browser.display.use_document_fonts", 0);

// ─── Contenedores y aislamiento de primera parte ─────────────────────
user_pref("privacy.firstparty.isolate", false); // desactivar si usas Multi-Account Containers
user_pref("privacy.userContext.enabled", true);
user_pref("privacy.userContext.ui.enabled", true);

// ─── Rastreadores y cookies ───────────────────────────────────────────
user_pref("privacy.trackingprotection.enabled", true);
user_pref("privacy.trackingprotection.pbmode.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", true);
user_pref("privacy.trackingprotection.cryptomining.enabled", true);
user_pref("privacy.trackingprotection.fingerprinting.enabled", true);
user_pref("network.cookie.cookieBehavior", 1); // Bloquear cookies de terceros

// ─── Prefetch y especulación ──────────────────────────────────────────
user_pref("network.prefetch-next", false);
user_pref("network.dns.disablePrefetch", true);
user_pref("network.predictor.enabled", false);
user_pref("network.http.speculative-parallel-limit", 0);
user_pref("browser.urlbar.speculativeConnect.enabled", false);

// ─── Safe Browsing (desactivar envío a Google) ────────────────────────
// Nota: esto reduce la protección de phishing en tiempo real
// Mantener activado si prefieres la protección frente a la privacidad
// user_pref("browser.safebrowsing.malware.enabled", false);
// user_pref("browser.safebrowsing.phishing.enabled", false);

// ─── Pocket (desactivar servicio de guardado de artículos) ───────────
user_pref("extensions.pocket.enabled", false);

// ─── Autoplay de medios ───────────────────────────────────────────────
user_pref("media.autoplay.default", 5);
user_pref("media.autoplay.blocking_policy", 2);

// ─── HTTPS-Only mode ─────────────────────────────────────────────────
user_pref("dom.security.https_only_mode", true);
user_pref("dom.security.https_only_mode_ever_enabled", true);

// ─── Limpiar al cerrar ────────────────────────────────────────────────
user_pref("privacy.sanitize.sanitizeOnShutdown", true);
user_pref("privacy.clearOnShutdown.cache", true);
user_pref("privacy.clearOnShutdown.cookies", false); // cambiar a true si no usas contenedores
user_pref("privacy.clearOnShutdown.history", false);
user_pref("privacy.clearOnShutdown.sessions", true);
'@

if ($DryRun) {
    Write-Log "[DRY-RUN] Se crearía user.js en: $userJsPath"
    Write-Host "[DRY-RUN] Se crearía: $userJsPath con $($userJsContent.Split("`n").Count) líneas de configuración." -ForegroundColor Magenta
} else {
    try {
        $userJsContent | Out-File -FilePath $userJsPath -Encoding UTF8 -Force
        Write-Log "user.js creado correctamente en: $userJsPath"
        Write-Host "✅ user.js aplicado en: $userJsPath" -ForegroundColor Green
    } catch {
        Write-Log "Error al crear user.js: $_" "ERROR"
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host @"

━━━ PASOS SIGUIENTES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Cierra Firefox si está abierto
  2. Vuelve a abrirlo — las configuraciones del user.js se aplicarán
  3. Instala Firefox Multi-Account Containers:
     https://addons.mozilla.org/es/firefox/addon/multi-account-containers/
  4. Instala uBlock Origin para Firefox:
     https://addons.mozilla.org/es/firefox/addon/ublock-origin/
  5. Consulta la guía: firefox_contenedores.md para configurar
     los contenedores por categoría

  ⚠️  privacy.resistFingerprinting puede hacer que algunos sitios
  muestren el idioma en inglés. Es normal y esperado.

"@ -ForegroundColor Cyan

if (-not $DryRun) { Write-Host "📋 Log en: $LogFile`n" -ForegroundColor Cyan }
