# MASTER README — Auditoría de Seguridad Personal

> Sistema completo de hardening para Windows 11 con perfil de riesgo: funcionario público + inversor (DEGIRO, IB) + BTC en hardware wallet + cuentas ProtonMail/Hotmail.

---

## Índice completo de archivos

### Fase 1 — Acciones Inmediatas (Esta Semana)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| [fase1-inmediata/scripts/check_bitlocker.ps1](fase1-inmediata/scripts/check_bitlocker.ps1) | Script | Verifica y activa BitLocker en C: con TPM; exporta clave de recuperación al Escritorio |
| [fase1-inmediata/scripts/disable_browser_passwords.ps1](fase1-inmediata/scripts/disable_browser_passwords.ps1) | Script | Desactiva el guardado de contraseñas en Chrome y Edge mediante políticas de registro |
| [fase1-inmediata/scripts/set_dns_quad9.ps1](fase1-inmediata/scripts/set_dns_quad9.ps1) | Script | Configura DNS Quad9 (9.9.9.9) en todos los adaptadores de red activos |
| [fase1-inmediata/scripts/check_pwned_api.ps1](fase1-inmediata/scripts/check_pwned_api.ps1) | Script | Consulta HaveIBeenPwned API v3 con k-anonymity para varios correos simultáneos |
| [fase1-inmediata/guias/exportar_contrasenas_chrome_edge.md](fase1-inmediata/guias/exportar_contrasenas_chrome_edge.md) | Guía | Exportar contraseñas de Chrome y Edge en CSV antes de migrar a Bitwarden |
| [fase1-inmediata/guias/instalar_bitwarden.md](fase1-inmediata/guias/instalar_bitwarden.md) | Guía | Crear cuenta, contraseña maestra robusta, importar contraseñas, configurar 2FA y bloqueo automático |
| [fase1-inmediata/guias/activar_2fa.md](fase1-inmediata/guias/activar_2fa.md) | Guía | Activar 2FA TOTP en ProtonMail, Hotmail, DEGIRO, IB, Revolut y banco genérico |
| [fase1-inmediata/guias/instalar_aegis_raivo.md](fase1-inmediata/guias/instalar_aegis_raivo.md) | Guía | Aegis Authenticator (Android, F-Droid y Play Store) + Raivo OTP (iOS) + backup cifrado |
| [fase1-inmediata/guias/instalar_ublock_origin.md](fase1-inmediata/guias/instalar_ublock_origin.md) | Guía | uBlock Origin en Chrome/Edge/Firefox con listas recomendadas y modo avanzado |
| [fase1-inmediata/guias/verificar_filtraciones.md](fase1-inmediata/guias/verificar_filtraciones.md) | Guía | HaveIBeenPwned: verificación web, suscripción a alertas, obtener API key |

### Fase 2 — Mejoras Recomendadas (Este Mes)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| [fase2-recomendada/scripts/setup_backup.ps1](fase2-recomendada/scripts/setup_backup.ps1) | Script | Tarea programada semanal con robocopy hacia disco externo; notificaciones Windows |
| [fase2-recomendada/scripts/firefox_hardening.ps1](fase2-recomendada/scripts/firefox_hardening.ps1) | Script | Instala Firefox silencioso y aplica user.js con 40+ configuraciones de privacidad |
| [fase2-recomendada/guias/backup_321_completo.md](fase2-recomendada/guias/backup_321_completo.md) | Guía | Sistema 3-2-1 completo: disco externo (WD 2TB) + Macrium Reflect + Proton Drive |
| [fase2-recomendada/guias/firefox_contenedores.md](fase2-recomendada/guias/firefox_contenedores.md) | Guía | Multi-Account Containers (Finanzas/Trabajo/Personal/Compras) + tabla about:config |
| [fase2-recomendada/guias/hardening_router.md](fase2-recomendada/guias/hardening_router.md) | Guía | Checklist completo: contraseña admin, WPS, firmware, SSID, red invitados, UPnP, WPA3 |
| [fase2-recomendada/guias/instalar_mullvad.md](fase2-recomendada/guias/instalar_mullvad.md) | Guía | Mullvad sin email, WireGuard, kill switch, cuándo usar VPN, verificar fugas DNS/WebRTC |
| [fase2-recomendada/guias/proteger_seed_phrase.md](fase2-recomendada/guias/proteger_seed_phrase.md) | Guía | Almacenamiento físico seguro: papel + metal (Cryptosteel), dos ubicaciones distintas |
| [fase2-recomendada/guias/migrar_a_protonmail.md](fase2-recomendada/guias/migrar_a_protonmail.md) | Guía | Lista priorizada de servicios, reenvío temporal desde Hotmail, plan de 30 días |

### Fase 3 — Endurecimiento Avanzado (Próximos 3 Meses)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| [fase3-avanzada/scripts/windows11_hardening.ps1](fase3-avanzada/scripts/windows11_hardening.ps1) | Script | 4 bloques: telemetría, seguridad sistema, servicios, firewall; punto de restauración + undo |
| [fase3-avanzada/scripts/crear_perfiles_firefox.ps1](fase3-avanzada/scripts/crear_perfiles_firefox.ps1) | Script | 3 perfiles Firefox aislados (Trabajo/Finanzas/Personal) con accesos directos y user.js |
| [fase3-avanzada/guias/configurar_yubikey.md](fase3-avanzada/guias/configurar_yubikey.md) | Guía | YubiKey 5 NFC: FIDO2 en Proton + Bitwarden, TOTP en Yubico Authenticator, PIN |
| [fase3-avanzada/guias/configurar_simplelogin.md](fase3-avanzada/guias/configurar_simplelogin.md) | Guía | Aliases únicos por servicio; integración con ProtonMail; plan de migración 20 servicios |
| [fase3-avanzada/guias/separacion_identidades.md](fase3-avanzada/guias/separacion_identidades.md) | Guía | 3 perfiles: Trabajo (admin pública), Finanzas (brokers), Personal; reglas por perfil |
| [fase3-avanzada/guias/instalar_signal.md](fase3-avanzada/guias/instalar_signal.md) | Guía | Signal Android/iOS/Desktop; mensajes que desaparecen; por qué Signal ≠ Telegram |

### Mantenimiento

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| [mantenimiento/scripts/verificacion_mensual.ps1](mantenimiento/scripts/verificacion_mensual.ps1) | Script | Informe HTML: BitLocker, backups, Defender, updates, firewall, conexiones, logins |
| [mantenimiento/checklist_trimestral.md](mantenimiento/checklist_trimestral.md) | Checklist | Revisión trimestral: contraseñas, 2FA, red, backups, correo, Bitcoin (~45 min) |
| [mantenimiento/checklist_anual.md](mantenimiento/checklist_anual.md) | Checklist | Auditoría anual completa: Bitwarden, seed phrase, exposición online, stack herramientas |

---

## Orden de ejecución recomendado

```
DÍA 1 (2 horas)
├── [GUÍA] instalar_aegis_raivo.md       ← Instala la app 2FA PRIMERO
├── [GUÍA] exportar_contrasenas.md       ← Exporta contraseñas de navegadores
├── [GUÍA] instalar_bitwarden.md         ← Gestor de contraseñas
└── [GUÍA] activar_2fa.md → ProtonMail   ← 2FA en el correo más importante

DÍA 1-2 (1 hora)
├── [GUÍA] activar_2fa.md → Hotmail, DEGIRO, IB, Revolut
└── [GUÍA] instalar_ublock_origin.md

DÍA 2-3 (scripts, 30 min)
├── [SCRIPT] check_bitlocker.ps1
├── [SCRIPT] set_dns_quad9.ps1
├── [SCRIPT] disable_browser_passwords.ps1  ← DESPUÉS de exportar y migrar a Bitwarden
└── [SCRIPT] check_pwned_api.ps1

ESTA SEMANA (Fase 1 completada)
└── Todos los puntos anteriores marcados ✅

ESTE MES — Fase 2 (por orden)
├── [GUÍA] proteger_seed_phrase.md       ← Crítico para Bitcoin
├── [SCRIPT] setup_backup.ps1 -DiscoDest E
├── [GUÍA] hardening_router.md
├── [SCRIPT] firefox_hardening.ps1
├── [GUÍA] firefox_contenedores.md
├── [GUÍA] instalar_mullvad.md
└── [GUÍA] migrar_a_protonmail.md (plan de 30 días)

PRÓXIMOS 3 MESES — Fase 3
├── [GUÍA] separacion_identidades.md     ← Leer primero
├── [SCRIPT] windows11_hardening.ps1 -DryRun, luego sin -DryRun
├── [SCRIPT] crear_perfiles_firefox.ps1
├── [GUÍA] configurar_simplelogin.md
├── [GUÍA] configurar_yubikey.md         ← Tras recibir la YubiKey
└── [GUÍA] instalar_signal.md

MANTENIMIENTO CONTINUO
├── [SCRIPT] verificacion_mensual.ps1    ← Se programa solo el día 1 de cada mes
├── [CHECKLIST] checklist_trimestral.md  ← Cada 3 meses
└── [CHECKLIST] checklist_anual.md       ← En enero de cada año
```

---

## Cómo abrir PowerShell como Administrador

**Método 1 (más rápido):**
1. Pulsa `Win + X`
2. Selecciona **"Terminal de Windows (Administrador)"** o **"PowerShell (Administrador)"**

**Método 2:**
1. Busca "PowerShell" en el menú de inicio
2. Haz clic derecho en **"Windows PowerShell"**
3. Selecciona **"Ejecutar como administrador"**

**Navegar a la carpeta de scripts:**
```powershell
cd "C:\Users\Admin\Desktop\Proyecto Porra Mundialista\porra-app\security-setup"
```

---

## Comandos exactos de ejecución

```powershell
# ── FASE 1 ──────────────────────────────────────────────────────────
# BitLocker (dry-run primero, siempre)
.\fase1-inmediata\scripts\check_bitlocker.ps1 -DryRun
.\fase1-inmediata\scripts\check_bitlocker.ps1

# DNS Quad9
.\fase1-inmediata\scripts\set_dns_quad9.ps1 -DryRun
.\fase1-inmediata\scripts\set_dns_quad9.ps1
# Para revertir DNS:
.\fase1-inmediata\scripts\set_dns_quad9.ps1 -Revertir

# Deshabilitar contraseñas en navegadores (EXPORTA PRIMERO)
.\fase1-inmediata\scripts\disable_browser_passwords.ps1 -DryRun
.\fase1-inmediata\scripts\disable_browser_passwords.ps1

# Verificar filtraciones (necesitas API key de haveibeenpwned.com)
.\fase1-inmediata\scripts\check_pwned_api.ps1 `
  -Emails "tucorreo@hotmail.com,tucorreo@proton.me" `
  -ApiKey "TU_API_KEY_AQUI"

# ── FASE 2 ──────────────────────────────────────────────────────────
# Backup semanal (E = letra de tu disco externo)
.\fase2-recomendada\scripts\setup_backup.ps1 -DiscoDest E -DryRun
.\fase2-recomendada\scripts\setup_backup.ps1 -DiscoDest E

# Firefox hardening
.\fase2-recomendada\scripts\firefox_hardening.ps1 -DryRun
.\fase2-recomendada\scripts\firefox_hardening.ps1

# ── FASE 3 ──────────────────────────────────────────────────────────
# Hardening Windows 11
.\fase3-avanzada\scripts\windows11_hardening.ps1 -DryRun
.\fase3-avanzada\scripts\windows11_hardening.ps1 -Bloques A,B    # Solo privacidad+seguridad
.\fase3-avanzada\scripts\windows11_hardening.ps1                  # Todos los bloques
# Para deshacer:
PowerShell -ExecutionPolicy Bypass -File "C:\SecurityHardening\undo_hardening.ps1"

# Crear perfiles Firefox
.\fase3-avanzada\scripts\crear_perfiles_firefox.ps1 -DryRun
.\fase3-avanzada\scripts\crear_perfiles_firefox.ps1

# ── MANTENIMIENTO ───────────────────────────────────────────────────
# Informe mensual (abre el HTML automáticamente)
.\mantenimiento\scripts\verificacion_mensual.ps1 -Abrir
```

---

## Advertencias importantes antes de ejecutar cada script

| Script | Advertencia |
|--------|-------------|
| `check_bitlocker.ps1` | La clave de recuperación que genera es el único modo de acceder al disco si olvidas la contraseña — guárdala en ProtonMail INMEDIATAMENTE y borra el TXT del Escritorio |
| `disable_browser_passwords.ps1` | **Exporta las contraseñas de Chrome y Edge antes.** Este script las desactivará para nuevas guardadas, pero no borra las ya guardadas — eso lo haces tú manualmente después |
| `set_dns_quad9.ps1` | Si algún servicio deja de funcionar tras el cambio, ejecuta el script con `-Revertir` para restaurar el DNS del ISP |
| `setup_backup.ps1` | El disco externo debe estar conectado antes de ejecutar el script de configuración. Conectarlo cada domingo antes de las 23:00 |
| `windows11_hardening.ps1` | Crea un punto de restauración automáticamente. Si algo falla, abre Configuración → Sistema → Recuperación → Restaurar sistema. El script `undo_hardening.ps1` también deshace los cambios |
| `firefox_hardening.ps1` | `privacy.resistFingerprinting = true` puede mostrar algunos sitios en inglés — es el comportamiento esperado |

---

## Tabla resumen de impacto

| Tarea | Tipo | Tiempo | Impacto | Dificultad | Fase |
|-------|------|--------|---------|------------|------|
| Activar 2FA (todas las cuentas) | Guía | 1.5 h | 🔴 Crítico | ⭐ Fácil | 1 |
| Instalar Bitwarden | Guía | 45 min | 🔴 Crítico | ⭐ Fácil | 1 |
| Instalar Aegis/Raivo | Guía | 15 min | 🔴 Crítico | ⭐ Fácil | 1 |
| Activar BitLocker | Script | 15 min | 🟠 Alto | ⭐ Fácil | 1 |
| Cambiar DNS a Quad9 | Script | 5 min | 🟠 Alto | ⭐ Fácil | 1 |
| uBlock Origin | Guía | 15 min | 🟠 Alto | ⭐ Fácil | 1 |
| Proteger seed phrase | Guía | 30 min | 🔴 Crítico | ⭐⭐ Medio | 2 |
| Backup 3-2-1 | Script+Guía | 3 h | 🟠 Alto | ⭐⭐ Medio | 2 |
| Hardening router | Guía | 45 min | 🟠 Alto | ⭐⭐ Medio | 2 |
| Firefox + contenedores | Script+Guía | 1 h | 🟡 Medio | ⭐⭐ Medio | 2 |
| Mullvad VPN | Guía | 30 min | 🟡 Medio | ⭐ Fácil | 2 |
| Migrar a ProtonMail | Guía | 4 h total | 🟡 Medio | ⭐⭐ Medio | 2 |
| Hardening Windows 11 | Script | 45 min | 🟠 Alto | ⭐⭐ Medio | 3 |
| Separación de identidades | Guía+Script | 1 h | 🟡 Medio | ⭐⭐ Medio | 3 |
| SimpleLogin | Guía | 2 h | 🟡 Medio | ⭐⭐ Medio | 3 |
| YubiKey | Guía | 2 h | 🟡 Medio | ⭐⭐⭐ Avanzado | 3 |
| Signal | Guía | 20 min | 🟡 Medio | ⭐ Fácil | 3 |
| Informe mensual | Script | Auto | 🟢 Bajo | ⭐ Fácil | M |

---

## Mejora del perfil de riesgo al completar cada fase

```
HOY (sin medidas):
├── Sin 2FA     → Cualquier filtración = cuenta comprometida
├── Sin BitLocker → Robo del portátil = pérdida de todos los datos
├── Sin gestor  → Contraseñas reutilizadas = efecto dominó
└── Sin backup  → Fallo de disco = pérdida irreversible de datos

TRAS FASE 1 (+2-3 horas):
├── 2FA en todas las cuentas críticas
├── Gestor de contraseñas con contraseñas únicas
├── Disco cifrado con BitLocker
└── DNS con filtrado de malware

TRAS FASE 2 (+1 semana):
├── Sistema de backup 3-2-1 automatizado
├── Seed phrase protegida físicamente
├── Router securizado
└── VPN y navegación con aislamiento de contenedores

TRAS FASE 3 (+3 meses):
├── Identidades digitales completamente separadas
├── Hardware 2FA (YubiKey) resistente a phishing
├── Aliases de email únicos — filtraciones contenidas
└── Comunicaciones sensibles cifradas E2E (Signal)
```

---

*Generado el 31/05/2026 — Auditoría de seguridad personal completa para Windows 11*  
*Versión: 1.0 — Revisar y actualizar en la auditoría anual*
