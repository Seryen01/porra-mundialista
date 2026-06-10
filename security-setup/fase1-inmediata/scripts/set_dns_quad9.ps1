#Requires -Version 5.1
param(
    [switch]$DryRun,
    [switch]$Revertir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\dns_quad9_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
$DNS_PRIMARIO   = "9.9.9.9"
$DNS_SECUNDARIO = "149.112.112.112"

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

Write-Host "=== CONFIGURACION DE DNS QUAD9 ===" -ForegroundColor Green
Write-Host "    DNS primario:   $DNS_PRIMARIO" -ForegroundColor Green
Write-Host "    DNS secundario: $DNS_SECUNDARIO" -ForegroundColor Green

if ($DryRun)   { Write-Host "[DRY-RUN] Sin cambios reales." -ForegroundColor Magenta }
if ($Revertir) { Write-Host "[REVERSION] Restaurando DNS del ISP." -ForegroundColor Yellow }

# 1. Detectar adaptadores activos
Write-Log "Detectando adaptadores de red activos..."
$adaptadores = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

if (-not $adaptadores) {
    Write-Log "No se encontraron adaptadores activos." "ERROR"
    exit 1
}

Write-Host "`n--- ADAPTADORES ENCONTRADOS ---" -ForegroundColor White
foreach ($a in $adaptadores) {
    $dnsActual = (Get-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).ServerAddresses -join ", "
    if (-not $dnsActual) { $dnsActual = "DHCP automatico" }
    Write-Host ("  [{0}] {1} - DNS actual: {2}" -f $a.InterfaceIndex, $a.Name, $dnsActual)
    Write-Log "Adaptador: $($a.Name) | DNS actual: $dnsActual"
}

# 2. Aplicar o revertir DNS
foreach ($adaptador in $adaptadores) {
    $idx    = $adaptador.InterfaceIndex
    $nombre = $adaptador.Name

    if ($Revertir) {
        if ($DryRun) {
            Write-Log "[DRY-RUN] Se restauraria DNS automatico en: $nombre"
        } else {
            try {
                Set-DnsClientServerAddress -InterfaceIndex $idx -ResetServerAddresses -ErrorAction Stop
                Write-Log "DNS restaurado a automatico en: $nombre"
                Write-Host "OK: DNS restaurado en: $nombre" -ForegroundColor Green
            } catch {
                Write-Log "Error al restaurar DNS en $nombre : $_" "ERROR"
            }
        }
    } else {
        if ($DryRun) {
            Write-Log "[DRY-RUN] Se configuraria DNS en $nombre : $DNS_PRIMARIO, $DNS_SECUNDARIO"
            Write-Host "[DRY-RUN] $nombre -> $DNS_PRIMARIO / $DNS_SECUNDARIO" -ForegroundColor Magenta
        } else {
            try {
                Set-DnsClientServerAddress -InterfaceIndex $idx -ServerAddresses ($DNS_PRIMARIO, $DNS_SECUNDARIO) -ErrorAction Stop
                Write-Log "DNS Quad9 configurado en: $nombre"
                Write-Host "OK: DNS Quad9 configurado en: $nombre" -ForegroundColor Green
            } catch {
                Write-Log "Error al configurar DNS en $nombre : $_" "ERROR"
                Write-Host "ERROR en $nombre : $_" -ForegroundColor Red
            }
        }
    }
}

# 3. Limpiar cache DNS
Write-Host "`n--- LIMPIEZA DE CACHE DNS ---" -ForegroundColor White
if ($DryRun) {
    Write-Log "[DRY-RUN] Se ejecutaria: Clear-DnsClientCache"
} else {
    try {
        Clear-DnsClientCache -ErrorAction Stop
        Write-Log "Cache DNS limpiada."
        Write-Host "OK: Cache DNS limpiada." -ForegroundColor Green
    } catch {
        Write-Log "Error al limpiar cache DNS: $_" "WARN"
    }
}

# 4. Verificar nueva configuracion
if (-not $Revertir -and -not $DryRun) {
    Write-Host "`n--- VERIFICACION ---" -ForegroundColor White
    try {
        $resultado = Resolve-DnsName -Name "quad9.net" -Server $DNS_PRIMARIO -ErrorAction Stop
        Write-Host "OK: Consulta de prueba exitosa: quad9.net -> $($resultado[0].IPAddress)" -ForegroundColor Green
        Write-Log "Resolucion DNS OK: quad9.net -> $($resultado[0].IPAddress)"
    } catch {
        Write-Log "Error en consulta de prueba DNS: $_" "WARN"
        Write-Host "AVISO: La consulta de prueba fallo. Verifica la conectividad." -ForegroundColor Yellow
    }

    Write-Host "`nDNS final configurado:" -ForegroundColor White
    foreach ($a in $adaptadores) {
        $dnsFinal = (Get-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).ServerAddresses -join ", "
        Write-Host ("  {0} -> {1}" -f $a.Name, $dnsFinal)
    }
}

Write-Host "`n--- RESUMEN ---" -ForegroundColor White
Write-Host "  Quad9 bloquea dominios maliciosos y protege tu privacidad DNS." -ForegroundColor Cyan
Write-Host "  Verifica en: https://on.quad9.net/" -ForegroundColor Cyan
Write-Host "  Para revertir: .\set_dns_quad9.ps1 -Revertir" -ForegroundColor Cyan

if (-not $DryRun) { Write-Host "`nLog guardado en: $LogFile" -ForegroundColor Cyan }
