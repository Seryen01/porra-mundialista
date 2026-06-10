#Requires -Version 5.1
<#
.SYNOPSIS
    Consulta la API de HaveIBeenPwned para verificar si un correo aparece en filtraciones.
.DESCRIPTION
    Usa la API v3 de HIBP con k-anonymity para consultas seguras.
    Requiere una API key gratuita de https://haveibeenpwned.com/API/Key
.PARAMETER Emails
    Una o varias direcciones de correo a verificar (separadas por comas).
.PARAMETER ApiKey
    Tu API key personal de HaveIBeenPwned.
.PARAMETER Truncate
    Si se indica, solo muestra el nombre del breach sin detalles.
.EXAMPLE
    .\check_pwned_api.ps1 -Emails "tucorreo@example.com" -ApiKey "tu_api_key_aqui"
    .\check_pwned_api.ps1 -Emails "correo1@a.com,correo2@b.com" -ApiKey "tu_api_key"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Emails,

    [Parameter(Mandatory = $true)]
    [string]$ApiKey,

    [switch]$Truncate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir  = "C:\SecurityHardening"
$LogFile = "$LogDir\hibp_check_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

function Write-Log {
    param([string]$Mensaje, [string]$Nivel = "INFO")
    $linea = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Nivel] $Mensaje"
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $linea
}

# ── Cabecera ───────────────────────────────────────────────────────────────────
Write-Host @"
╔══════════════════════════════════════════════════════════════════════╗
║          VERIFICADOR DE FILTRACIONES — HaveIBeenPwned              ║
║               API v3 con k-anonymity (consulta segura)             ║
╚══════════════════════════════════════════════════════════════════════╝

⚠️  CÓMO OBTENER TU API KEY GRATUITA:
    1. Ve a: https://haveibeenpwned.com/API/Key
    2. Introduce tu correo y haz clic en "Notify me"
    3. La API key gratuita permite consultar breaches por email
    4. La clave llegará por correo — úsala en el parámetro -ApiKey

"@ -ForegroundColor Green

# ── Procesar lista de emails ──────────────────────────────────────────────────
$listaEmails = $Emails -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

Write-Host "Correos a verificar: $($listaEmails.Count)" -ForegroundColor Cyan
Write-Log "Iniciando verificación para $($listaEmails.Count) correo(s)."

$resumenGeneral = @()

foreach ($email in $listaEmails) {
    Write-Host "`n━━━ Verificando: $email ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
    Write-Log "Consultando HIBP para: $email"

    $uri = "https://haveibeenpwned.com/api/v3/breachedaccount/$([Uri]::EscapeDataString($email))?truncateResponse=$(if ($Truncate) {'true'} else {'false'})"

    $headers = @{
        "hibp-api-key" = $ApiKey
        "User-Agent"   = "SecurityAudit-PowerShell/1.0"
    }

    try {
        $respuesta = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -ErrorAction Stop

        if ($respuesta -and $respuesta.Count -gt 0) {
            Write-Host "  🚨 ENCONTRADO EN $($respuesta.Count) FILTRACION(ES):" -ForegroundColor Red
            Write-Log "Email $email encontrado en $($respuesta.Count) breach(es)." "WARN"

            $urgentes = @()
            foreach ($breach in $respuesta) {
                $datosExpuestos = if ($breach.DataClasses) { $breach.DataClasses -join ", " } else { "N/A" }
                $fechaBrech     = if ($breach.BreachDate)  { $breach.BreachDate }  else { "desconocida" }
                $esVerificado   = if ($breach.IsVerified)  { "✅ Verificado" }     else { "⚠️  No verificado" }

                Write-Host @"
  ┌─────────────────────────────────────────────────────────────────
  │ Servicio:        $($breach.Name)
  │ Fecha:           $fechaBrech
  │ Estado:          $esVerificado
  │ Datos expuestos: $datosExpuestos
  │ Registros:       $("{0:N0}" -f $breach.PwnCount)
  └─────────────────────────────────────────────────────────────────
"@ -ForegroundColor Red

                Write-Log "  Breach: $($breach.Name) | Fecha: $fechaBrech | Datos: $datosExpuestos"

                # Marcar como urgente si incluye contraseñas
                if ($breach.DataClasses -contains "Passwords") {
                    $urgentes += $breach.Name
                }
            }

            if ($urgentes.Count -gt 0) {
                Write-Host "  🔴 URGENTE — CAMBIAR CONTRASEÑA en estos servicios (expusieron passwords):" -ForegroundColor Red
                $urgentes | ForEach-Object { Write-Host "     → $_" -ForegroundColor Red }
            }

            $resumenGeneral += [PSCustomObject]@{
                Email      = $email
                Breaches   = $respuesta.Count
                Urgentes   = $urgentes.Count
                Servicios  = ($respuesta | Select-Object -ExpandProperty Name) -join "; "
            }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        switch ($statusCode) {
            404 {
                Write-Host "  ✅ No encontrado en filtraciones conocidas." -ForegroundColor Green
                Write-Log "Email $email no encontrado en HIBP."
                $resumenGeneral += [PSCustomObject]@{
                    Email     = $email
                    Breaches  = 0
                    Urgentes  = 0
                    Servicios = "Ninguna filtración"
                }
            }
            401 {
                Write-Host "  ❌ API Key inválida o no autorizada." -ForegroundColor Red
                Write-Log "Error 401: API key inválida." "ERROR"
            }
            429 {
                Write-Host "  ⚠️  Límite de peticiones alcanzado. Espera 6 segundos..." -ForegroundColor Yellow
                Write-Log "Rate limit alcanzado, esperando..." "WARN"
                Start-Sleep -Seconds 6
            }
            default {
                Write-Host "  ❌ Error HTTP $statusCode al consultar HIBP." -ForegroundColor Red
                Write-Log "Error HTTP $statusCode para $email : $_" "ERROR"
            }
        }
    }

    # Respetar rate limit de la API (1 petición por 1.5 segundos)
    if ($listaEmails.Count -gt 1) { Start-Sleep -Milliseconds 1600 }
}

# ── Resumen final ──────────────────────────────────────────────────────────────
Write-Host @"

━━━ RESUMEN EJECUTIVO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor White

$resumenGeneral | Format-Table -AutoSize Email, Breaches, Urgentes, Servicios

$totalUrgentes = ($resumenGeneral | Measure-Object -Property Urgentes -Sum).Sum
if ($totalUrgentes -gt 0) {
    Write-Host @"
  🔴 ACCIÓN REQUERIDA:
  Hay $totalUrgentes servicio(s) que expusieron contraseñas.
  Cambia esas contraseñas AHORA usando Bitwarden para generar
  contraseñas únicas y aleatorias para cada servicio.

"@ -ForegroundColor Red
} else {
    Write-Host "  ✅ No se detectaron filtraciones de contraseñas que requieran acción inmediata.`n" -ForegroundColor Green
}

Write-Host "📋 Log guardado en: $LogFile`n" -ForegroundColor Cyan
Write-Log "Verificación completada. Total urgentes: $totalUrgentes"
