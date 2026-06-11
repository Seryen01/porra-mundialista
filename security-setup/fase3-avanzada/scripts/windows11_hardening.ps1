#Requires -Version 5.1
param(
    [string[]]$Bloques = @("A", "B", "C", "D"),
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$LogDir     = "C:\SecurityHardening"
$LogFile    = "$LogDir\hardening_log.txt"
$UndoScript = "$LogDir\undo_hardening.ps1"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $line  = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Msg"
    $color = switch ($Level) { "ERROR" {"Red"} "WARN" {"Yellow"} "OK" {"Green"} default {"Cyan"} }
    Write-Host $line -ForegroundColor $color
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $line
    }
}

function Set-RegValue {
    param(
        [string]$Path,
        [string]$Name,
        [object]$Value,
        [string]$Type = "DWord",
        [string]$Desc = ""
    )
    if ($DryRun) {
        Write-Log "[DRY-RUN] $Desc | $Path\$Name = $Value"
        return
    }
    try {
        $previo = (Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue).$Name
        if (-not (Test-Path $Path)) { New-Item -Path $Path -Force | Out-Null }
        Set-ItemProperty -Path $Path -Name $Name -Value $Value -Type $Type -Force
        Write-Log "OK: $Desc" "OK"
        Add-Content -Path $UndoScript -Value "Set-ItemProperty -Path `"$Path`" -Name `"$Name`" -Value `"$previo`" -Type $Type -Force  # $Desc"
    } catch {
        Write-Log "ERROR: $Desc - $_" "ERROR"
    }
}

function Set-ServiceStartup {
    param([string]$Servicio, [string]$Tipo, [string]$Desc)
    if ($DryRun) {
        Write-Log "[DRY-RUN] Servicio: $Desc ($Servicio) -> $Tipo"
        return
    }
    try {
        $svc    = Get-Service -Name $Servicio -ErrorAction Stop
        $previo = $svc.StartType
        Set-Service -Name $Servicio -StartupType $Tipo -ErrorAction Stop
        if ($svc.Status -eq "Running" -and $Tipo -eq "Disabled") {
            Stop-Service -Name $Servicio -Force -ErrorAction SilentlyContinue
        }
        Write-Log "OK: Servicio $Servicio ($Desc) -> $Tipo (era: $previo)" "OK"
        Add-Content -Path $UndoScript -Value "Set-Service -Name `"$Servicio`" -StartupType `"$previo`"  # $Desc"
    } catch {
        Write-Log "WARN: Servicio $Servicio no encontrado: $_" "WARN"
    }
}

# Verificar admin
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) {
    Write-Host "ERROR: Ejecuta como Administrador." -ForegroundColor Red
    exit 1
}

Write-Host "=== HARDENING DE WINDOWS 11 ===" -ForegroundColor Green
Write-Host "    Bloques: $($Bloques -join ', ')" -ForegroundColor Green
if ($DryRun) { Write-Host "[DRY-RUN] Sin cambios reales." -ForegroundColor Magenta }

# Inicializar script de reversión
if (-not $DryRun) {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    "# Script de REVERSION generado por windows11_hardening.ps1" | Out-File -FilePath $UndoScript -Encoding UTF8 -Force
    "# Generado: $(Get-Date)" | Add-Content -Path $UndoScript
    "`$ErrorActionPreference = 'Continue'" | Add-Content -Path $UndoScript

    Write-Log "Creando punto de restauracion del sistema..."
    try {
        Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
        Checkpoint-Computer -Description "Antes de Hardening Windows 11" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        Write-Log "Punto de restauracion creado." "OK"
    } catch {
        Write-Log "No se pudo crear punto de restauracion: $_" "WARN"
    }
}

# BLOQUE A - Telemetria y privacidad
if ("A" -in $Bloques) {
    Write-Host "`n--- BLOQUE A: TELEMETRIA Y PRIVACIDAD ---" -ForegroundColor Yellow
    $ok = if ($DryRun) { "S" } else { Read-Host "Aplicar Bloque A? (S/N)" }
    if ($ok -match "^[Ss]$") {
        Set-RegValue "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" "AllowTelemetry" 1 "DWord" "Telemetria al minimo"
        Set-RegValue "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" "AllowTelemetry" 1 "DWord" "Telemetria datos"
        Set-RegValue "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo" "Enabled" 0 "DWord" "Desactivar publicidad personalizada"
        Set-RegValue "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System" "EnableActivityFeed" 0 "DWord" "Desactivar Activity History"
        Set-RegValue "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System" "PublishUserActivities" 0 "DWord" "Desactivar publicacion actividades"
        Set-RegValue "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System" "UploadUserActivities" 0 "DWord" "Desactivar subida actividades"
        Set-RegValue "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search" "AllowCortana" 0 "DWord" "Desactivar Cortana"
        Set-RegValue "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" "SubscribedContent-338388Enabled" 0 "DWord" "Desactivar sugerencias inicio"
        Set-RegValue "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" "SystemPaneSuggestionsEnabled" 0 "DWord" "Desactivar sugerencias sistema"
        Write-Log "Bloque A completado." "OK"
    } else {
        Write-Log "Bloque A omitido." "WARN"
    }
}

# BLOQUE B - Seguridad del sistema
if ("B" -in $Bloques) {
    Write-Host "`n--- BLOQUE B: SEGURIDAD DEL SISTEMA ---" -ForegroundColor Yellow
    $ok = if ($DryRun) { "S" } else { Read-Host "Aplicar Bloque B? (S/N)" }
    if ($ok -match "^[Ss]$") {
        if (-not $DryRun) {
            Set-MpPreference -EnableControlledFolderAccess Enabled -ErrorAction SilentlyContinue
            Write-Log "Controlled Folder Access (anti-ransomware) activado." "OK"
        } else {
            Write-Log "[DRY-RUN] Se activaria Controlled Folder Access."
        }

        try {
            $sb = Confirm-SecureBootUEFI -ErrorAction Stop
            Write-Log "Secure Boot: $sb" "OK"
            Write-Host "  Secure Boot: $(if ($sb) {'ACTIVO'} else {'INACTIVO - activalo en BIOS'})" -ForegroundColor $(if ($sb) {"Green"} else {"Red"})
        } catch {
            Write-Log "No se pudo verificar Secure Boot: $_" "WARN"
        }

        if (-not $DryRun) {
            & net accounts /lockoutthreshold:5 /lockoutduration:30 /lockoutwindow:30 2>&1 | Out-Null
            Write-Log "Politica de bloqueo: 5 intentos, 30 min bloqueo." "OK"
            & auditpol /set /subcategory:"Logon" /success:enable /failure:enable 2>&1 | Out-Null
            Write-Log "Auditoria de inicio de sesion activada." "OK"
        } else {
            Write-Log "[DRY-RUN] Se configuraria bloqueo de cuenta (5 intentos, 30 min)."
            Write-Log "[DRY-RUN] Se activaria auditoria de inicio de sesion."
        }

        Set-RegValue "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" "NoDriveTypeAutoRun" 255 "DWord" "Desactivar Autorun"
        Set-RegValue "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" "NoDriveTypeAutoRun" 255 "DWord" "Desactivar Autorun usuario"
        Write-Log "Bloque B completado." "OK"
    } else {
        Write-Log "Bloque B omitido." "WARN"
    }
}

# BLOQUE C - Servicios innecesarios
if ("C" -in $Bloques) {
    Write-Host "`n--- BLOQUE C: SERVICIOS INNECESARIOS ---" -ForegroundColor Yellow
    $ok = if ($DryRun) { "S" } else { Read-Host "Aplicar Bloque C? (S/N)" }
    if ($ok -match "^[Ss]$") {
        Set-RegValue "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" "fDenyTSConnections" 1 "DWord" "Desactivar Remote Desktop"
        Set-ServiceStartup "RemoteRegistry"    "Disabled" "Remote Registry"
        Set-ServiceStartup "DiagTrack"         "Disabled" "Telemetria DiagTrack"
        Set-ServiceStartup "dmwappushservice"  "Disabled" "WAP Push Message Routing"
        Write-Log "Bloque C completado." "OK"
    } else {
        Write-Log "Bloque C omitido." "WARN"
    }
}

# BLOQUE D - Red y Firewall
if ("D" -in $Bloques) {
    Write-Host "`n--- BLOQUE D: RED Y FIREWALL ---" -ForegroundColor Yellow
    $ok = if ($DryRun) { "S" } else { Read-Host "Aplicar Bloque D? (S/N)" }
    if ($ok -match "^[Ss]$") {
        if (-not $DryRun) {
            Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True -ErrorAction SilentlyContinue
            Write-Log "Firewall activado en todos los perfiles." "OK"
            Set-NetFirewallProfile -Profile Public -DefaultInboundAction Block -ErrorAction SilentlyContinue
            Write-Log "Conexiones entrantes bloqueadas en perfil Public." "OK"
        } else {
            Write-Log "[DRY-RUN] Se activaria Firewall en todos los perfiles."
            Write-Log "[DRY-RUN] Se bloquearian entrantes en perfil Public."
        }

        Write-Host "`n  Reglas de firewall que permiten entradas sin restriccion de programa:" -ForegroundColor White
        $reglas = Get-NetFirewallRule | Where-Object {
            $_.Direction -eq "Inbound" -and $_.Action -eq "Allow" -and $_.Enabled -eq "True"
        }
        $conteo = 0
        foreach ($r in $reglas) {
            $prog = ($r | Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue).Program
            if (-not $prog -or $prog -eq "Any") {
                Write-Host "  REVISAR: $($r.DisplayName)" -ForegroundColor Yellow
                $conteo++
                if ($conteo -ge 10) { Write-Host "  ... (y mas reglas)"; break }
            }
        }
        Write-Log "Reglas firewall sin restriccion de programa: $conteo" "WARN"
        Write-Log "Bloque D completado." "OK"
    } else {
        Write-Log "Bloque D omitido." "WARN"
    }
}

Write-Host "`n=== HARDENING COMPLETADO ===" -ForegroundColor Green
Write-Host "  Log:        $LogFile" -ForegroundColor Cyan
Write-Host "  Reversion:  $UndoScript" -ForegroundColor Cyan
Write-Host "  Para deshacer: PowerShell -ExecutionPolicy Bypass -File `"$UndoScript`"" -ForegroundColor Cyan
Write-Host "  Se recomienda reiniciar el equipo." -ForegroundColor Yellow

if (-not $DryRun) { Write-Log "Hardening completado. Bloques: $($Bloques -join ', ')" "OK" }
