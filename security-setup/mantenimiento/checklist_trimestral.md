# Checklist de Mantenimiento Trimestral

Realiza esta revisión cada 3 meses. Marca cada punto al completarlo.

**Fecha de revisión:** ________________  
**Próxima revisión prevista:** ________________

---

## 🔑 Contraseñas y accesos

- [ ] **Rotar contraseñas críticas** — Cambia la contraseña de al menos los siguientes servicios con contraseñas generadas nuevas por Bitwarden (20+ chars):
  - [ ] ProtonMail
  - [ ] Bitwarden (contraseña maestra — solo si sospechas compromiso)
  - [ ] DEGIRO
  - [ ] Interactive Brokers

- [ ] **Auditar contraseñas reutilizadas** — Abrir Bitwarden → Herramientas → Informe de seguridad → cambiar todas las reutilizadas

- [ ] **Auditar contraseñas expuestas** — Bitwarden → Informe de seguridad → "Contraseñas expuestas" → cambiar las marcadas

- [ ] **Revisar accesos OAuth** — Para cada servicio importante, verificar qué aplicaciones de terceros tienen acceso:
  - [ ] Google (si tienes cuenta): https://myaccount.google.com/permissions
  - [ ] Microsoft/Hotmail: https://account.microsoft.com/privacy/app-access
  - [ ] ProtonMail: Ajustes → Seguridad → Conexiones OAuth
  - [ ] GitHub (si aplica): Settings → Applications → Authorized OAuth Apps
  - Revocar acceso de cualquier app que no reconozcas o no uses

---

## 🔐 2FA y autenticación

- [ ] **Verificar que el 2FA sigue activo** en todas las cuentas críticas:
  - [ ] ProtonMail — Ajustes → Seguridad → Ver estado del 2FA
  - [ ] Hotmail/Microsoft — account.microsoft.com/security
  - [ ] DEGIRO — Ajustes → Seguridad
  - [ ] Interactive Brokers — Gestión de cuenta → Seguridad
  - [ ] Revolut — App → Perfil → Seguridad
  - [ ] Bitwarden — Configuración → Seguridad → Inicio de sesión en dos pasos

- [ ] **Verificar backup de Aegis/Raivo** — Abrir la app → Exportar → confirmar que el archivo cifrado está en Proton Drive y es accesible

- [ ] **Verificar que los códigos de recuperación 2FA están en Bitwarden** — Buscar en Bitwarden "recuperación" y confirmar que hay entradas para cada servicio crítico

---

## 🛡️ Sistema y red

- [ ] **Ejecutar informe de seguridad mensual** si no se ha ejecutado automáticamente:
  ```powershell
  .\mantenimiento\scripts\verificacion_mensual.ps1
  ```

- [ ] **Verificar filtraciones con HIBP**:
  ```powershell
  .\fase1-inmediata\scripts\check_pwned_api.ps1 -Emails "tucorreo@proton.me,tucorreo@hotmail.com" -ApiKey "TU_KEY"
  ```

- [ ] **Actualizar firmware del router** — Acceder al panel de administración y verificar si hay actualizaciones disponibles (ver guía `hardening_router.md`)

- [ ] **Verificar que BitLocker sigue activo en C:**
  ```powershell
  Get-BitLockerVolume -MountPoint C: | Select MountPoint, VolumeStatus, ProtectionStatus
  ```

- [ ] **Verificar DNS Quad9** — Ir a https://on.quad9.net/ y confirmar "You are protected"

- [ ] **Verificar que Mullvad VPN no tiene fugas** (si usas VPN):
  - DNS: https://dnsleaktest.com
  - Fugas: https://mullvad.net/es/check

---

## 💾 Backups

- [ ] **Verificar que el backup semanal se ha ejecutado** — Abrir `C:\BackupLogs\` y confirmar logs recientes (menos de 10 días)

- [ ] **Verificar integridad de la imagen Macrium** (si la tienes configurada):
  - Abrir Macrium Reflect → seleccionar imagen → "Verify image"

- [ ] **Confirmar que Proton Drive está sincronizado** — Abrir Proton Drive y verificar que los archivos críticos están actualizados

- [ ] **Verificar backup cifrado de 2FA** — Confirmar que el backup de Aegis/Raivo está en Proton Drive y que puedes descifrarlo con la contraseña guardada en Bitwarden

---

## 🌐 Software y navegadores

- [ ] **Actualizar Firefox** y todas sus extensiones (uBlock Origin, Bitwarden, contenedores)

- [ ] **Actualizar Bitwarden** (app de escritorio y extensiones de navegador)

- [ ] **Actualizar Mullvad VPN** si hay nueva versión disponible

- [ ] **Revisar extensiones instaladas en Chrome/Edge** — eliminar cualquiera que no uses o no reconozcas

- [ ] **Actualizar YubiKey Manager** y firmware de la YubiKey si hay actualización disponible (ver Yubico Authenticator → About)

---

## 📧 Correo y aliases

- [ ] **Revisar que el reenvío de Hotmail a ProtonMail sigue activo** si aún estás en fase de migración

- [ ] **Verificar aliases de SimpleLogin** — Dashboard de SL → confirmar que no hay aliases comprometidos (recibiendo spam no esperado)

- [ ] **Desactivar aliases comprometidos** — Si algún alias recibe spam, desactívalo y actualiza el email en el servicio correspondiente

---

## 🪙 Bitcoin / Hardware wallet

- [ ] **Verificar que la seed phrase es legible** — Revisar físicamente el papel/metal en ambas ubicaciones de almacenamiento

- [ ] **Verificar saldo de la wallet** — Abrir Jade + software (Sparrow o Jade app) para confirmar que el saldo es el esperado y no hay transacciones desconocidas

- [ ] **Actualizar firmware del Jade Wallet** si hay nueva versión disponible (desde la app oficial de Blockstream)

---

## 📝 Notas de esta revisión

_Anota aquí cualquier incidencia, cambio pendiente o acción tomada:_

```
Fecha: 
Incidencias detectadas:

Acciones tomadas:

Pendiente para próxima revisión:
```
