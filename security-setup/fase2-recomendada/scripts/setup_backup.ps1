#Requires -Version 5.1
<#
.SYNOPSIS
    Configura un sistema de backup incremental semanal con robocopy.
.PARAMETER DiscoDest
    Letra de unidad del disco externo destino (ej: E, F, G).
.PARAMETER CarpetasAdicionales
    Carpetas adicionales a incluir en el backup (array de rutas completas).
.PARAMETER DryRun
    Muestra qué haría el script sin aplicar cambios reales.
.EXAMPLE
    .\setup_backup.ps1 -DiscoDest E
    .\setup_backup.ps1 -DiscoDest F -CarpetasAdicionales "C:\Proyectos","C:\Facturas"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$DiscoDest,

    [string[]]$CarpetasAdicionales = @(),

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\BackupLogs"
$LogFile = "$LogDir\setup_backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Mensaje, [string]$Nivel = "INFO")
    $linea = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Nivel] $Mensaje"
    Write-Host $linea -ForegroundColor $(if ($Nivel -eq "ERROR") {"Red"} elseif ($Nivel -eq "WARN") {"Yellow"} else {"Cyan"})
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $linea
    }
}

# ── Verificación de privilegios ────────────────────────────────────────────────
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) {
    Write-Host "ERROR: Ejecuta este script como Administrador." -ForegroundColor Red
    exit 1
}

# ── Normalizar letra de disco ──────────────────────────────────────────────────
$DiscoDest = $DiscoDest.TrimEnd(':').ToUpper()
$DiscoDestRuta = "${DiscoDest}:\"

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║              CONFIGURACIÓN DE BACKUP INCREMENTAL                ║
║                     Sistema 3-2-1                               ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

if ($DryRun) { Write-Host "[MODO DRY-RUN] Sin cambios reales.`n" -ForegroundColor Magenta }

# ── Verificar disco externo ────────────────────────────────────────────────────
Write-Log "Verificando disco externo en: $DiscoDestRuta"
if (-not (Test-Path $DiscoDestRuta)) {
    Write-Host @"
❌ ERROR: El disco $DiscoDestRuta no está conectado o no existe.
   Conecta el disco externo y vuelve a ejecutar el script.
   Si la letra es diferente, úsala en el parámetro -DiscoDest.
"@ -ForegroundColor Red
    exit 1
}
$disco = Get-PSDrive -Name $DiscoDest -ErrorAction SilentlyContinue
Write-Log "Disco $DiscoDestRuta disponible. Espacio libre: $([math]::Round($disco.Free/1GB, 2)) GB"
Write-Host "✅ Disco externo verificado: $DiscoDestRuta ($([math]::Round($disco.Free/1GB, 2)) GB libres)" -ForegroundColor Green

# ── Definir carpetas a respaldar ──────────────────────────────────────────────
$usuario = $env:USERNAME
$carpetasBase = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\Pictures",
    "$env:USERPROFILE\Videos"
)

$todasLasCarpetas = $carpetasBase + $CarpetasAdicionales

Write-Host "`n━━━ CARPETAS A RESPALDAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
foreach ($carpeta in $todasLasCarpetas) {
    $existe = Test-Path $carpeta
    $icono  = if ($existe) { "✅" } else { "⚠️ " }
    Write-Host "  $icono $carpeta"
    Write-Log "Carpeta a respaldar: $carpeta (existe: $existe)"
}

# ── Crear script de backup ────────────────────────────────────────────────────
$scriptBackup = "C:\SecurityHardening\ejecutar_backup.ps1"
$destinoBase  = "${DiscoDest}:\Backup_$($env:COMPUTERNAME)"

$contenidoScriptBackup = @"
#Requires -Version 5.1
# Script de backup incremental generado automáticamente
# Generado el: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Set-StrictMode -Version Latest
`$ErrorActionPreference = "Continue"

`$DiscoDestRuta = "${DiscoDestRuta}"
`$DestinoBase   = "${destinoBase}"
`$LogDir        = "C:\BackupLogs"
`$LogFile       = "`$LogDir\backup_`$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

# Verificar que el disco externo está conectado
if (-not (Test-Path `$DiscoDestRuta)) {
    `$msg = "[`$(Get-Date)] ERROR: Disco externo `$DiscoDestRuta no encontrado. Backup cancelado."
    if (-not (Test-Path `$LogDir)) { New-Item -ItemType Directory -Path `$LogDir -Force | Out-Null }
    Add-Content -Path `$LogFile -Value `$msg
    # Notificación de Windows
    `$wshell = New-Object -ComObject Wscript.Shell
    `$wshell.Popup("BACKUP FALLIDO: Disco externo no conectado. Conecta `${DiscoDest}: y ejecuta manualmente.", 30, "Error de Backup", 16)
    exit 1
}

if (-not (Test-Path `$LogDir)) { New-Item -ItemType Directory -Path `$LogDir -Force | Out-Null }

`$carpetas = @(
$(($todasLasCarpetas | ForEach-Object { "    `"$_`"" }) -join ",`n")
)

`$exito = `$true
foreach (`$origen in `$carpetas) {
    if (-not (Test-Path `$origen)) {
        Add-Content -Path `$LogFile -Value "[`$(Get-Date)] WARN: Carpeta no encontrada, omitida: `$origen"
        continue
    }
    `$nombre  = Split-Path `$origen -Leaf
    `$destino = "`$DestinoBase\`$nombre"
    Add-Content -Path `$LogFile -Value "[`$(Get-Date)] INFO: Iniciando backup de `$origen -> `$destino"

    `$resultado = robocopy `$origen `$destino /MIR /R:3 /W:10 /LOG+:`$LogFile /NP /NDL /TEE

    if (`$LASTEXITCODE -ge 8) {
        Add-Content -Path `$LogFile -Value "[`$(Get-Date)] ERROR: Fallo en backup de `$origen (código `$LASTEXITCODE)"
        `$exito = `$false
    } else {
        Add-Content -Path `$LogFile -Value "[`$(Get-Date)] INFO: Backup completado para `$origen"
    }
}

# Notificación de Windows al completar
`$wshell = New-Object -ComObject Wscript.Shell
if (`$exito) {
    `$wshell.Popup("Backup semanal completado correctamente.`nLog: `$LogFile", 15, "Backup Completado ✅", 64)
    Add-Content -Path `$LogFile -Value "[`$(Get-Date)] INFO: Backup semanal completado exitosamente."
} else {
    `$wshell.Popup("Backup completado con ERRORES. Revisa el log:`n`$LogFile", 30, "Backup con Errores ⚠️", 48)
    Add-Content -Path `$LogFile -Value "[`$(Get-Date)] WARN: Backup completado con errores."
}
"@

if (-not $DryRun) {
    if (-not (Test-Path "C:\SecurityHardening")) {
        New-Item -ItemType Directory -Path "C:\SecurityHardening" -Force | Out-Null
    }
    $contenidoScriptBackup | Out-File -FilePath $scriptBackup -Encoding UTF8 -Force
    Write-Log "Script de backup creado en: $scriptBackup"
    Write-Host "✅ Script de backup creado en: $scriptBackup" -ForegroundColor Green
} else {
    Write-Log "[DRY-RUN] Se crearía el script de backup en: $scriptBackup"
}

# ── Crear tarea programada ─────────────────────────────────────────────────────
Write-Host "`n━━━ CONFIGURANDO TAREA PROGRAMADA (Domingos 23:00) ━━━━━━━━━━━━━━━" -ForegroundColor White

$nombreTarea = "BackupSemanal_Seguridad"
$accion      = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptBackup`""
$disparador  = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "23:00"
$principal   = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
$ajustes     = New-ScheduledTaskSettingsSet -WakeToRun -RunOnlyIfNetworkAvailable:$false `
    -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4)

if ($DryRun) {
    Write-Log "[DRY-RUN] Se crearía la tarea programada: $nombreTarea (Domingos 23:00)"
    Write-Host "[DRY-RUN] Se registraría la tarea: $nombreTarea" -ForegroundColor Magenta
} else {
    try {
        # Eliminar tarea anterior si existe
        Unregister-ScheduledTask -TaskName $nombreTarea -Confirm:$false -ErrorAction SilentlyContinue
        Register-ScheduledTask -TaskName $nombreTarea -Action $accion -Trigger $disparador `
            -Principal $principal -Settings $ajustes -Force -ErrorAction Stop
        Write-Log "Tarea programada creada: $nombreTarea"
        Write-Host "✅ Tarea programada configurada: cada domingo a las 23:00" -ForegroundColor Green
    } catch {
        Write-Log "Error al crear la tarea programada: $_" "ERROR"
        Write-Host "❌ Error al crear la tarea: $_" -ForegroundColor Red
    }
}

# ── Resumen ────────────────────────────────────────────────────────────────────
Write-Host @"

━━━ CONFIGURACIÓN COMPLETADA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Script de backup:     $scriptBackup
  ✅ Destino del backup:   $destinoBase
  ✅ Logs del backup:      C:\BackupLogs\
  ✅ Frecuencia:           Cada domingo a las 23:00

  Para ejecutar el backup manualmente ahora:
  PowerShell -ExecutionPolicy Bypass -File "$scriptBackup"

  Para ver las tareas programadas:
  Get-ScheduledTask | Where-Object TaskName -like "Backup*"

  ⚠️  IMPORTANTE: Recuerda conectar el disco externo los domingos
  antes de las 23:00 para que el backup se ejecute correctamente.

"@ -ForegroundColor Cyan

if (-not $DryRun) { Write-Host "📋 Log en: $LogFile`n" -ForegroundColor Cyan }
