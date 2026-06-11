# Fase 1 — Acciones Inmediatas (Esta Semana)

Esta fase contiene las medidas de seguridad con mayor impacto y menor tiempo de implementación. Ejecuta todo en el orden indicado.

## Orden de ejecución recomendado

| # | Tarea | Tipo | Tiempo estimado | Prioridad |
|---|-------|------|-----------------|-----------|
| 1 | Instalar Aegis/Raivo (app 2FA) | Guía manual | 10 min | 🔴 CRÍTICO |
| 2 | Exportar contraseñas de Chrome/Edge | Guía manual | 10 min | 🔴 CRÍTICO |
| 3 | Instalar y configurar Bitwarden | Guía manual | 30 min | 🔴 CRÍTICO |
| 4 | Activar 2FA en ProtonMail | Guía manual | 10 min | 🔴 CRÍTICO |
| 5 | Activar 2FA en Microsoft/Hotmail | Guía manual | 10 min | 🔴 CRÍTICO |
| 6 | Activar 2FA en DEGIRO | Guía manual | 10 min | 🔴 CRÍTICO |
| 7 | Activar 2FA en Interactive Brokers | Guía manual | 15 min | 🔴 CRÍTICO |
| 8 | Verificar BitLocker | Script | 15 min | 🟠 ALTO |
| 9 | Cambiar DNS a Quad9 | Script | 5 min | 🟠 ALTO |
| 10 | Desactivar contraseñas en navegadores | Script | 5 min | 🟡 MEDIO |
| 11 | Instalar uBlock Origin | Guía manual | 15 min | 🟡 MEDIO |
| 12 | Verificar filtraciones (HIBP) | Script + Guía | 10 min | 🟡 MEDIO |

## Scripts disponibles

```
scripts/
├── check_bitlocker.ps1          # Verifica y activa BitLocker en C:
├── disable_browser_passwords.ps1 # Desactiva guardado de contraseñas en navegadores
├── set_dns_quad9.ps1            # Configura DNS Quad9 en todos los adaptadores
└── check_pwned_api.ps1          # Verifica filtraciones en HaveIBeenPwned
```

## Guías disponibles

```
guias/
├── exportar_contrasenas_chrome_edge.md  # Exportar contraseñas antes de migrar
├── instalar_bitwarden.md                # Configurar Bitwarden completo
├── activar_2fa.md                       # 2FA en ProtonMail, Hotmail, DEGIRO, IB, Revolut
├── instalar_aegis_raivo.md              # App autenticadora Android/iOS
├── instalar_ublock_origin.md            # Bloqueador de anuncios y rastreadores
└── verificar_filtraciones.md            # Verificar si tus datos han sido filtrados
```

## Cómo ejecutar los scripts

Abre PowerShell **como Administrador** (clic derecho → "Ejecutar como administrador"):

```powershell
# Verificar BitLocker (dry-run primero)
.\scripts\check_bitlocker.ps1 -DryRun
.\scripts\check_bitlocker.ps1

# Cambiar DNS a Quad9 (dry-run primero)
.\scripts\set_dns_quad9.ps1 -DryRun
.\scripts\set_dns_quad9.ps1

# Desactivar contraseñas en navegadores (dry-run primero)
.\scripts\disable_browser_passwords.ps1 -DryRun
.\scripts\disable_browser_passwords.ps1

# Verificar filtraciones (requiere API key de haveibeenpwned.com)
.\scripts\check_pwned_api.ps1 -Emails "tucorreo@hotmail.com,tucorreo@proton.me" -ApiKey "TU_KEY"
```

## Resultado esperado al completar esta fase

Al terminar todos los pasos de la Fase 1 tendrás:
- ✅ Disco cifrado con BitLocker (datos protegidos ante robo físico)
- ✅ Gestor de contraseñas Bitwarden con contraseñas únicas por servicio
- ✅ 2FA activo en todas las cuentas críticas financieras y de email
- ✅ DNS que filtra dominios maliciosos (Quad9)
- ✅ Bloqueador de rastreadores y malware en el navegador (uBlock Origin)
- ✅ Conocimiento de si tus datos han sido filtrados previamente
