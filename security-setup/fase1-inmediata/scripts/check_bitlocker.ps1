#Requires -Version 5.1
param([switch]$DryRun)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\bitlocker_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Mensaje, [string]$Nivel = "INFO")
    $linea = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Nivel] $Mensaje"
    $color = if ($Nivel -eq "ERROR") {"Red"} elseif ($Nivel -eq "WARN") {"Yellow"} else {"Cyan"}
    Write-Host $linea -ForegroundColor $color
    if (-not $DryRun) {
        if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
        Add-Content -Path $LogFile -Value $linea
    }
}

$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $esAdmin) {
    Write-Host "ERROR: Este script requiere privilegios de Administrador." -ForegroundColor Red
    Write-Host "Cierra PowerShell, haz clic derecho y selecciona 'Ejecutar como administrador'." -ForegroundColor Red
    exit 1
}

Write-Host "=== VERIFICACION Y ACTIVACION DE BITLOCKER ===" -ForegroundColor Green
if ($DryRun) { Write-Host "[MODO DRY-RUN] No se aplicara ningun cambio real." -ForegroundColor Magenta }

# 1. Detectar volumenes
Write-Log "Detectando volumenes del sistema..."
try {
    $volumenes = Get-BitLockerVolume -ErrorAction Stop
} catch {
    Write-Log "No se pudo obtener informacion de BitLocker: $_" "ERROR"
    exit 1
}

Write-Host "`n--- ESTADO ACTUAL DE BITLOCKER ---" -ForegroundColor White
foreach ($vol in $volumenes) {
    $estado = switch ($vol.VolumeStatus) {
        "FullyEncrypted"       { "Cifrado completamente" }
        "FullyDecrypted"       { "Sin cifrar" }
        "EncryptionInProgress" { "Cifrando en progreso" }
        default                { $vol.VolumeStatus }
    }
    $proteccion = if ($vol.ProtectionStatus -eq "On") { "PROTECCION ACTIVA" } else { "PROTECCION INACTIVA" }
    Write-Host ("  Volumen {0}: {1} | {2} | Metodo: {3}" -f $vol.MountPoint, $estado, $proteccion, $vol.EncryptionMethod)
    Write-Log ("Volumen $($vol.MountPoint): $($vol.VolumeStatus) / $($vol.ProtectionStatus)")
}

# 2. Activar BitLocker en C: si no esta activo
$volC = $volumenes | Where-Object { $_.MountPoint -eq "C:" }

if ($null -eq $volC) {
    Write-Log "No se encontro el volumen C:." "WARN"
} elseif ($volC.ProtectionStatus -eq "On" -and $volC.VolumeStatus -eq "FullyEncrypted") {
    Write-Host "`nOK: BitLocker ya esta activo y completamente cifrado en C:." -ForegroundColor Green
    Write-Log "BitLocker ya activo en C:. Sin cambios necesarios."
} else {
    Write-Host "`nAVISO: BitLocker NO esta activo en C:. Procediendo a activarlo..." -ForegroundColor Yellow
    Write-Log "Iniciando activacion de BitLocker en C:..." "WARN"

    try {
        $tpm = Get-Tpm -ErrorAction Stop
        if (-not $tpm.TpmPresent) {
            Write-Log "TPM no disponible en este equipo." "ERROR"
            Write-Host "ERROR: TPM no encontrado. BitLocker requiere TPM." -ForegroundColor Red
            exit 1
        }
        Write-Log "TPM disponible: $($tpm.TpmReady)"
    } catch {
        Write-Log "No se pudo verificar el TPM: $_" "WARN"
    }

    if (-not $DryRun) {
        Write-Log "Creando punto de restauracion del sistema..."
        try {
            Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
            Checkpoint-Computer -Description "Antes de activar BitLocker" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
            Write-Log "Punto de restauracion creado."
        } catch {
            Write-Log "No se pudo crear punto de restauracion: $_" "WARN"
        }

        try {
            Enable-BitLocker -MountPoint "C:" -TpmProtector -EncryptionMethod XtsAes256 -UsedSpaceOnly -ErrorAction Stop
            Write-Log "BitLocker activado en C: con TPM y XtsAes256."
            Write-Host "OK: BitLocker activado correctamente en C:." -ForegroundColor Green
        } catch {
            Write-Log "Error al activar BitLocker: $_" "ERROR"
            Write-Host "ERROR al activar BitLocker: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[DRY-RUN] Se ejecutaria: Enable-BitLocker -MountPoint C: -TpmProtector -EncryptionMethod XtsAes256" -ForegroundColor Magenta
    }
}

# 3. Exportar clave de recuperacion
Write-Host "`n--- EXPORTACION DE CLAVE DE RECUPERACION ---" -ForegroundColor White

$escritorio = [Environment]::GetFolderPath("Desktop")
$archivoRec = "$escritorio\BITLOCKER_RECOVERY_KEY_GUARDAR_EN_PROTONMAIL.txt"

$volC2 = Get-BitLockerVolume -MountPoint "C:" -ErrorAction SilentlyContinue
if ($volC2) {
    $protectores = $volC2.KeyProtector | Where-Object { $_.KeyProtectorType -eq "RecoveryPassword" }
    if ($protectores) {
        $contenido = "CLAVE DE RECUPERACION DE BITLOCKER`r`nGenerado: $(Get-Date)`r`nEquipo: $($env:COMPUTERNAME)`r`n`r`n"
        foreach ($p in $protectores) {
            $contenido += "ID: $($p.KeyProtectorId)`r`n"
            $contenido += "CLAVE: $($p.RecoveryPassword)`r`n"
        }
        $contenido += "`r`nINSTRUCCIONES:`r`n1. Envia este contenido a tu ProtonMail (de ti mismo para ti mismo)`r`n2. Confirma que llego`r`n3. BORRA este archivo del Escritorio`r`n4. Vacia la Papelera de reciclaje"

        if (-not $DryRun) {
            $contenido | Out-File -FilePath $archivoRec -Encoding UTF8
            Write-Log "Clave de recuperacion exportada a: $archivoRec"
            Write-Host "OK: Clave guardada en: $archivoRec" -ForegroundColor Green
        } else {
            Write-Host "[DRY-RUN] Se crearia: $archivoRec" -ForegroundColor Magenta
        }
    } else {
        Write-Log "No se encontro clave de recuperacion en C:." "WARN"
        Write-Host "AVISO: No hay clave de recuperacion configurada." -ForegroundColor Yellow
    }
}

Write-Host "`n--- PASOS SIGUIENTES ---" -ForegroundColor Yellow
Write-Host "  1. Abre el archivo del Escritorio: BITLOCKER_RECOVERY_KEY_GUARDAR_EN_PROTONMAIL.txt"
Write-Host "  2. Envialo por correo a tu ProtonMail (de ti para ti)"
Write-Host "  3. Confirma que llego y BORRA el archivo del Escritorio"
Write-Host "  4. Vacia la Papelera de reciclaje"
Write-Host ""

if (-not $DryRun) { Write-Host "Log guardado en: $LogFile" -ForegroundColor Cyan }
