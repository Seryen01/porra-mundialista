# Fase 2 — Mejoras Recomendadas (Este Mes)

Esta fase consolida la seguridad con backups, privacidad en el navegador, protección de la red y la seed phrase de Bitcoin.

## Orden de ejecución recomendado

| # | Tarea | Tipo | Tiempo | Prioridad |
|---|-------|------|--------|-----------|
| 1 | Proteger seed phrase (papel/metal) | Guía manual | 30 min | 🔴 CRÍTICO |
| 2 | Configurar backup 3-2-1 | Script + Guía | 2-3 h | 🟠 ALTO |
| 3 | Hardening del router | Guía manual | 45 min | 🟠 ALTO |
| 4 | Firefox hardening + contenedores | Script + Guía | 45 min | 🟡 MEDIO |
| 5 | Instalar Mullvad VPN | Guía manual | 20 min | 🟡 MEDIO |
| 6 | Migrar correo principal a ProtonMail | Guía manual | 1 h/semana × 4 semanas | 🟡 MEDIO |

## Scripts disponibles

```
scripts/
├── setup_backup.ps1        # Configura tarea de backup semanal con robocopy
└── firefox_hardening.ps1   # Instala Firefox y aplica user.js de privacidad
```

## Guías disponibles

```
guias/
├── backup_321_completo.md     # Sistema 3-2-1: disco externo + Macrium + Proton Drive
├── firefox_contenedores.md    # Multi-Account Containers + about:config
├── hardening_router.md        # Checklist de seguridad del router doméstico
├── instalar_mullvad.md        # VPN anónima con kill switch y WireGuard
├── proteger_seed_phrase.md    # Backup físico de la seed phrase del Jade Wallet
└── migrar_a_protonmail.md     # Plan de 30 días para migrar de Hotmail
```

## Cómo ejecutar los scripts

```powershell
# Configurar backup (reemplaza E con la letra de tu disco externo)
.\scripts\setup_backup.ps1 -DiscoDest E -DryRun
.\scripts\setup_backup.ps1 -DiscoDest E

# Hardening de Firefox
.\scripts\firefox_hardening.ps1 -DryRun
.\scripts\firefox_hardening.ps1
```
