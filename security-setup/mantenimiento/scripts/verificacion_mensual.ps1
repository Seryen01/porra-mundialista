#Requires -Version 5.1
<#
.SYNOPSIS
    Genera un informe de seguridad mensual en HTML.
.DESCRIPTION
    Comprueba: BitLocker, backups, Defender, actualizaciones Windows,
    apps instaladas, Firewall, conexiones de red, eventos de login.
#>
param([switch]$Abrir)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$Fecha    = Get-Date -Format "yyyy-MM"
$FechaLeg = Get-Date -Format "dd/MM/yyyy HH:mm"
$LogDir   = "C:\SecurityHardening\Informes"
$Informe  = "$LogDir\informe_seguridad_$Fecha.html"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Get-StatusEmoji { param([bool]$Ok) if ($Ok) { "✅" } else { "❌" } }
function Get-WarnEmoji   { param([bool]$Ok) if ($Ok) { "✅" } else { "⚠️" } }

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) { Write-Host "INFO: Algunos datos requieren permisos de Administrador." -ForegroundColor Yellow }

Write-Host "Generando informe de seguridad..." -ForegroundColor Cyan

# ── 1. BitLocker ───────────────────────────────────────────────────────────────
$bitlockerData = ""
try {
    $vols = Get-BitLockerVolume -ErrorAction Stop
    foreach ($v in $vols) {
        $cifrado = $v.ProtectionStatus -eq "On" -and $v.VolumeStatus -eq "FullyEncrypted"
        $emoji   = Get-StatusEmoji $cifrado
        $bitlockerData += "<tr><td>$($v.MountPoint)</td><td>$($v.VolumeStatus)</td><td>$($v.ProtectionStatus)</td><td>$emoji</td></tr>`n"
    }
} catch {
    $bitlockerData = "<tr><td colspan='4'>No se pudo obtener datos de BitLocker: $_</td></tr>"
}

# ── 2. Último backup (buscar en logs de robocopy) ─────────────────────────────
$backupData = ""
$logsBackup = Get-ChildItem "C:\BackupLogs\*.log" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 5

if ($logsBackup) {
    foreach ($log in $logsBackup) {
        $diasAtras = [math]::Round(((Get-Date) - $log.LastWriteTime).TotalDays, 1)
        $alerta = $diasAtras -gt 10
        $emoji  = Get-WarnEmoji (-not $alerta)
        $backupData += "<tr><td>$($log.Name)</td><td>$($log.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))</td><td>$diasAtras días</td><td>$emoji</td></tr>`n"
    }
} else {
    $backupData = "<tr><td colspan='4'>❌ No se encontraron logs de backup en C:\BackupLogs\</td></tr>"
}

# ── 3. Windows Defender ───────────────────────────────────────────────────────
$defenderData = ""
try {
    $mpStatus = Get-MpComputerStatus -ErrorAction Stop
    $defOk    = $mpStatus.AntivirusEnabled -and $mpStatus.RealTimeProtectionEnabled
    $emoji    = Get-StatusEmoji $defOk
    $sigAge   = [math]::Round(((Get-Date) - $mpStatus.AntivirusSignatureLastUpdated).TotalDays, 1)
    $sigEmoji = Get-WarnEmoji ($sigAge -le 2)
    $defenderData = @"
<tr><td>Antivirus activo</td><td>$($mpStatus.AntivirusEnabled)</td><td>$emoji</td></tr>
<tr><td>Protección en tiempo real</td><td>$($mpStatus.RealTimeProtectionEnabled)</td><td>$(Get-StatusEmoji $mpStatus.RealTimeProtectionEnabled)</td></tr>
<tr><td>Firmas actualizadas</td><td>$($mpStatus.AntivirusSignatureLastUpdated.ToString('dd/MM/yyyy')) (hace $sigAge días)</td><td>$sigEmoji</td></tr>
<tr><td>Controlled Folder Access</td><td>$($mpStatus.IsTamperProtected)</td><td>$(Get-WarnEmoji $mpStatus.IsTamperProtected)</td></tr>
"@
} catch {
    $defenderData = "<tr><td colspan='3'>Error obteniendo estado de Defender: $_</td></tr>"
}

# ── 4. Actualizaciones Windows pendientes ─────────────────────────────────────
$winUpdateData = ""
try {
    $updates = (New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search("IsInstalled=0 and Type='Software'").Updates
    if ($updates.Count -gt 0) {
        $winUpdateData = "<tr><td colspan='2'>⚠️ $($updates.Count) actualizaciones pendientes</td></tr>`n"
        for ($i = 0; $i -lt [Math]::Min($updates.Count, 10); $i++) {
            $winUpdateData += "<tr><td>$($updates.Item($i).Title)</td><td>$($updates.Item($i).MsrcSeverity)</td></tr>`n"
        }
    } else {
        $winUpdateData = "<tr><td colspan='2'>✅ Sistema actualizado — no hay pendientes</td></tr>"
    }
} catch {
    $winUpdateData = "<tr><td colspan='2'>⚠️ No se pudo comprobar actualizaciones automáticamente. Verifica manualmente en Windows Update.</td></tr>"
}

# ── 5. Apps instaladas (top 30 por fecha de instalación) ─────────────────────
$appsData = ""
try {
    $apps = Get-WmiObject Win32_Product -ErrorAction Stop |
        Sort-Object InstallDate -Descending |
        Select-Object -First 30
    foreach ($app in $apps) {
        $fecha = if ($app.InstallDate) { $app.InstallDate.Substring(0,4) + "/" + $app.InstallDate.Substring(4,2) + "/" + $app.InstallDate.Substring(6,2) } else { "N/A" }
        $appsData += "<tr><td>$($app.Name)</td><td>$($app.Version)</td><td>$fecha</td></tr>`n"
    }
} catch {
    # Fallback más rápido si WMI falla
    $appsData = (Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue) +
                (Get-ItemProperty "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue) |
                Where-Object DisplayName | Sort-Object DisplayName |
                ForEach-Object { "<tr><td>$($_.DisplayName)</td><td>$($_.DisplayVersion)</td><td>$($_.InstallDate)</td></tr>`n" }
    $appsData = $appsData -join ""
}

# ── 6. Estado del Firewall ────────────────────────────────────────────────────
$firewallData = ""
try {
    $profiles = Get-NetFirewallProfile -ErrorAction Stop
    foreach ($p in $profiles) {
        $emoji = Get-StatusEmoji $p.Enabled
        $firewallData += "<tr><td>$($p.Name)</td><td>$($p.Enabled)</td><td>$($p.DefaultInboundAction)</td><td>$emoji</td></tr>`n"
    }
} catch {
    $firewallData = "<tr><td colspan='4'>Error: $_</td></tr>"
}

# ── 7. Conexiones de red activas ──────────────────────────────────────────────
$redData = ""
try {
    $conexiones = Get-NetTCPConnection -State Established -ErrorAction Stop |
        Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess |
        Sort-Object RemoteAddress | Select-Object -First 20
    foreach ($c in $conexiones) {
        $proc = (Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue).Name
        $redData += "<tr><td>$($c.LocalAddress):$($c.LocalPort)</td><td>$($c.RemoteAddress):$($c.RemotePort)</td><td>$proc (PID: $($c.OwningProcess))</td></tr>`n"
    }
} catch {
    $redData = "<tr><td colspan='3'>Error: $_</td></tr>"
}

# ── 8. Últimos 10 eventos de inicio de sesión ─────────────────────────────────
$loginData = ""
try {
    $eventos = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 10 -ErrorAction Stop
    foreach ($e in $eventos) {
        $xml     = [xml]$e.ToXml()
        $usuario = ($xml.Event.EventData.Data | Where-Object { $_.Name -eq "TargetUserName" }).'#text'
        $tipo    = ($xml.Event.EventData.Data | Where-Object { $_.Name -eq "LogonType" }).'#text'
        $tipos   = @{2="Interactivo";3="Red";4="Batch";5="Servicio";7="Unlock";10="Remoto"}
        $tipoTxt = if ($tipos[$tipo]) { $tipos[$tipo] } else { "Tipo $tipo" }
        $loginData += "<tr><td>$($e.TimeCreated.ToString('dd/MM HH:mm:ss'))</td><td>$usuario</td><td>$tipoTxt</td></tr>`n"
    }
} catch {
    $loginData = "<tr><td colspan='3'>Requiere permisos de Administrador o acceso a Security log.</td></tr>"
}

# ── Generar HTML ───────────────────────────────────────────────────────────────
$css = @"
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; margin: 2rem; }
  h1 { color: #58a6ff; border-bottom: 2px solid #30363d; padding-bottom: 0.5rem; }
  h2 { color: #79c0ff; margin-top: 2rem; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; }
  th { background: #161b22; color: #58a6ff; padding: 8px 12px; text-align: left; border: 1px solid #30363d; }
  td { padding: 6px 12px; border: 1px solid #21262d; }
  tr:hover { background: #161b22; }
  .ok { color: #3fb950; } .warn { color: #d29922; } .err { color: #f85149; }
  .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; }
  .badge-ok { background:#1a4731; color:#3fb950; }
  .badge-warn { background:#3d2b00; color:#d29922; }
</style>
"@

$html = @"
<!DOCTYPE html>
<html lang='es'>
<head><meta charset='UTF-8'><title>Informe de Seguridad — $Fecha</title>$css</head>
<body>
<h1>🛡️ Informe de Seguridad — $Fecha</h1>
<p>Generado: $FechaLeg | Equipo: $env:COMPUTERNAME | Usuario: $env:USERNAME</p>

<h2>1. Estado de BitLocker</h2>
<table><tr><th>Volumen</th><th>Estado cifrado</th><th>Protección</th><th>OK</th></tr>
$bitlockerData</table>

<h2>2. Último Backup</h2>
<table><tr><th>Log</th><th>Última ejecución</th><th>Antigüedad</th><th>OK</th></tr>
$backupData</table>

<h2>3. Windows Defender</h2>
<table><tr><th>Componente</th><th>Estado</th><th>OK</th></tr>
$defenderData</table>

<h2>4. Actualizaciones de Windows Pendientes</h2>
<table><tr><th>Actualización</th><th>Severidad</th></tr>
$winUpdateData</table>

<h2>5. Aplicaciones instaladas (últimas 30)</h2>
<table><tr><th>Nombre</th><th>Versión</th><th>Instalación</th></tr>
$appsData</table>

<h2>6. Estado del Firewall</h2>
<table><tr><th>Perfil</th><th>Activo</th><th>Entrantes por defecto</th><th>OK</th></tr>
$firewallData</table>

<h2>7. Conexiones de Red Activas (establecidas)</h2>
<table><tr><th>Local</th><th>Remoto</th><th>Proceso</th></tr>
$redData</table>

<h2>8. Últimos 10 Eventos de Inicio de Sesión</h2>
<table><tr><th>Fecha/Hora</th><th>Usuario</th><th>Tipo</th></tr>
$loginData</table>

<h2>9. Recomendaciones Pendientes</h2>
<table>
<tr><th>Tarea</th><th>Guía</th><th>Frecuencia</th></tr>
<tr><td>Verificar filtraciones en HIBP</td><td>fase1-inmediata/scripts/check_pwned_api.ps1</td><td>Mensual</td></tr>
<tr><td>Revisar contraseñas débiles en Bitwarden</td><td>fase1-inmediata/guias/instalar_bitwarden.md</td><td>Mensual</td></tr>
<tr><td>Actualizar firmware del router</td><td>fase2-recomendada/guias/hardening_router.md</td><td>Trimestral</td></tr>
<tr><td>Verificar legibilidad de la seed phrase</td><td>fase2-recomendada/guias/proteger_seed_phrase.md</td><td>Semestral</td></tr>
<tr><td>Test de restauración de backup</td><td>fase2-recomendada/guias/backup_321_completo.md</td><td>Semestral</td></tr>
<tr><td>Auditar accesos OAuth (apps conectadas)</td><td>Revisar en cada cuenta: "Aplicaciones conectadas"</td><td>Trimestral</td></tr>
</table>

<hr style='border-color:#30363d; margin-top:2rem;'>
<p style='color:#8b949e; font-size:0.85em;'>Generado por security-setup/mantenimiento/scripts/verificacion_mensual.ps1</p>
</body></html>
"@

$html | Out-File -FilePath $Informe -Encoding UTF8 -Force
Write-Host "✅ Informe generado: $Informe" -ForegroundColor Green

# Configurar tarea programada para el día 1 de cada mes
$nombreTarea = "InformeSeguridad_Mensual"
$scriptActual = $MyInvocation.MyCommand.Path
if ($scriptActual) {
    try {
        $accion     = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptActual`""
        $disparador = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 1 -At "09:00"
        $principal  = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
        $ajustes    = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
        Unregister-ScheduledTask -TaskName $nombreTarea -Confirm:$false -ErrorAction SilentlyContinue
        Register-ScheduledTask -TaskName $nombreTarea -Action $accion -Trigger $disparador -Principal $principal -Settings $ajustes -Force | Out-Null
        Write-Host "✅ Tarea programada: informe mensual el día 1 de cada mes a las 09:00" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  No se pudo registrar la tarea programada: $_" -ForegroundColor Yellow
    }
}

if ($Abrir -or $PSBoundParameters.Count -eq 0) {
    Start-Process $Informe
}

Write-Host "`n📋 Informe guardado en: $Informe`n" -ForegroundColor Cyan
