# Fase 3 — Endurecimiento Avanzado (Próximos 3 meses)

Esta fase implementa las medidas más sofisticadas: separación de identidades, hardware de seguridad, y comunicaciones cifradas.

## Orden de ejecución recomendado

| # | Tarea | Tipo | Tiempo | Prioridad |
|---|-------|------|--------|-----------|
| 1 | Separación de identidades (leer guía) | Guía manual | 30 min lectura | 🟠 ALTO |
| 2 | Hardening Windows 11 | Script | 45 min | 🟠 ALTO |
| 3 | Crear perfiles Firefox separados | Script | 15 min | 🟠 ALTO |
| 4 | Configurar SimpleLogin | Guía manual | 1-2 h | 🟡 MEDIO |
| 5 | Adquirir y configurar YubiKey | Guía manual | 1 h + envío postal | 🟡 MEDIO |
| 6 | Instalar Signal | Guía manual | 20 min | 🟡 MEDIO |

## Scripts disponibles

```
scripts/
├── windows11_hardening.ps1      # Hardening completo: telemetría, seguridad, servicios, firewall
└── crear_perfiles_firefox.ps1   # Tres perfiles Firefox aislados con accesos directos
```

## Guías disponibles

```
guias/
├── configurar_yubikey.md        # YubiKey 5 NFC: FIDO2 en Proton + Bitwarden + TOTP
├── configurar_simplelogin.md    # Aliases de email únicos por servicio
├── separacion_identidades.md    # Tres perfiles: Trabajo, Finanzas, Personal
└── instalar_signal.md           # Mensajería cifrada E2E
```

## Comandos de ejecución

```powershell
# Hardening Windows 11 — siempre dry-run primero
.\scripts\windows11_hardening.ps1 -DryRun
.\scripts\windows11_hardening.ps1 -Bloques A,B    # Solo telemetría y seguridad
.\scripts\windows11_hardening.ps1                  # Todos los bloques

# Crear perfiles Firefox
.\scripts\crear_perfiles_firefox.ps1 -DryRun
.\scripts\crear_perfiles_firefox.ps1

# Deshacer el hardening si algo falla
PowerShell -ExecutionPolicy Bypass -File "C:\SecurityHardening\undo_hardening.ps1"
```
