# Checklist de Mantenimiento Anual

Realiza esta revisión una vez al año, preferiblemente en enero. Complementa (no reemplaza) los checklists trimestrales.

**Año de revisión:** ________________  
**Fecha de revisión:** ________________  
**Duración estimada:** 3-4 horas

---

## 🔑 Auditoría completa de contraseñas (Bitwarden)

- [ ] **Exportar informe completo de seguridad de Bitwarden**:
  1. Bitwarden Web Vault → Herramientas → Informe de seguridad
  2. Revisar TODAS las categorías: expuestas, reutilizadas, débiles, inactivas, sin 2FA, sin URI

- [ ] **Cambiar contraseñas de TODOS los servicios críticos** con contraseñas nuevas generadas por Bitwarden:
  - [ ] Servicios financieros (brokers, banco)
  - [ ] Correos (ProtonMail, Hotmail si aún activo)
  - [ ] Administración pública (AEAT, Seg. Social — si permiten cambio)
  - [ ] Bitwarden (contraseña maestra — recomendado hacerlo anualmente)

- [ ] **Eliminar cuentas inactivas** — Identificar servicios en Bitwarden que ya no usas y:
  1. Iniciar sesión en el servicio
  2. Eliminar la cuenta permanentemente (buscar opción "Eliminar mi cuenta")
  3. Eliminar la entrada de Bitwarden

- [ ] **Revisar entradas duplicadas en Bitwarden** — Fusionar duplicados, actualizar emails obsoletos

---

## 🔐 Auditoría de 2FA

- [ ] **Listar todos los servicios con 2FA activo** — En Aegis/Raivo, exportar lista de todas las cuentas con 2FA (sin claves, solo nombres)

- [ ] **Verificar que cada cuenta de 2FA tiene su contraseña en Bitwarden** — Cruzar la lista de Aegis con Bitwarden

- [ ] **Rotar los códigos de recuperación** en los servicios más críticos (genera nuevos y borra los anteriores):
  - [ ] ProtonMail
  - [ ] Bitwarden
  - [ ] Microsoft/Hotmail

- [ ] **Actualizar backup de Aegis/Raivo** — Crear nuevo backup cifrado y subir a Proton Drive (reemplazando el anterior)

---

## 🔑 Verificación de la seed phrase (Bitcoin)

- [ ] **Verificar ambas copias físicas** de la seed phrase:
  - [ ] Copia 1 (ubicación principal): palabras legibles, orden correcto
  - [ ] Copia 2 (ubicación secundaria): palabras legibles, orden correcto
  - [ ] Los sobres/contenedores no han sido manipulados

- [ ] **Verificar que la seed phrase es correcta** (sin introducirla en ningún dispositivo conectado a internet):
  - Opción segura: usa Jade en modo offline para verificar que las palabras coinciden con el descriptor de la wallet
  - Confirmar que el saldo visible en Jade coincide con el esperado

- [ ] **Evaluar actualización del almacenamiento físico** — ¿El papel sigue en buen estado? ¿Necesitas grabar en metal?

- [ ] **Revisar el plan de herencia** — ¿Tu familiar designado sabe dónde están las copias? ¿Las instrucciones están actualizadas?

---

## 🌐 Auditoría de exposición de datos personales online

- [ ] **Búsqueda de tu nombre completo en Google** — Verificar qué información personal aparece públicamente. Solicitar eliminación si aparece en:
  - Directorios de empresas (LinkedIn, páginas web de tu organización)
  - Páginas de datos personales (páginas de personas que agregan datos de registros públicos)

- [ ] **Verificar filtraciones de datos** para TODOS tus correos:
  ```powershell
  .\fase1-inmediata\scripts\check_pwned_api.ps1 -Emails "todos,tus,correos" -ApiKey "TU_KEY"
  ```

- [ ] **Revisar configuraciones de privacidad en redes sociales** (si las usas):
  - Quién puede ver tu perfil, fotos, amigos
  - Apps de terceros con acceso
  - Historial de actividad y publicidad

- [ ] **Verificar que tu dirección postal y teléfono no son públicos** en directorios online:
  - 11888.es, paginasblancas.es, infotelefono.es — solicitar eliminación si apareces

---

## 💻 Evaluación del stack de herramientas

- [ ] **Evaluar si las herramientas siguen siendo las mejores opciones**:
  - [ ] ¿Bitwarden sigue siendo el mejor gestor de contraseñas? (revisar comparativas anuales)
  - [ ] ¿Mullvad sigue manteniendo su política de no-logs? (revisar auditorías recientes)
  - [ ] ¿Quad9 sigue siendo una buena opción de DNS? (revisar alternativas: NextDNS, Cloudflare 1.1.1.1)
  - [ ] ¿ProtonMail ha mantenido sus estándares de seguridad? (revisar auditorías y noticias)

- [ ] **Actualizar todos los sistemas y software**:
  - [ ] Windows Update — instalar todas las actualizaciones
  - [ ] Firefox y extensiones
  - [ ] Bitwarden (app escritorio + extensiones)
  - [ ] Mullvad VPN
  - [ ] Yubico Authenticator y firmware de YubiKey

---

## 📧 Auditoría de correo y aliases

- [ ] **Revisar progreso de migración de Hotmail a ProtonMail** — ¿Quedan servicios críticos sin migrar?

- [ ] **Auditar todos los aliases de SimpleLogin** — Eliminar aliases de servicios que ya no uses

- [ ] **Revisar si SimpleLogin sigue siendo el mejor servicio de aliases** (alternativa: addy.io, duckduckgo email protection)

---

## 📋 Renovación de suscripciones de seguridad

- [ ] **Verificar que Mullvad VPN está pagada** (5€/mes, recarga cuando quieras)

- [ ] **Verificar plan de SimpleLogin** — ¿Necesitas más aliases? ¿El plan Premium sigue valiendo la pena?

- [ ] **Verificar almacenamiento en Proton Drive** — ¿Tienes suficiente espacio? ¿El plan actual es adecuado?

---

## 🔧 Mantenimiento del hardware

- [ ] **Verificar estado del disco externo de backup**:
  - Conectar el disco y ejecutar `chkdsk E: /f /r` (reemplaza E: con tu letra)
  - O usar CrystalDiskInfo para ver la salud S.M.A.R.T. del disco

- [ ] **Verificar que el portátil arranca correctamente** desde el USB de rescate de Macrium Reflect

- [ ] **Comprobar el estado de la batería del portátil** — En Administrador de dispositivos → revisar si la batería necesita reemplazo

---

## 📝 Resumen anual

_Completa al terminar la revisión:_

```
Año revisado: 
Fecha de revisión: 
Tiempo invertido: 

INCIDENCIAS DETECTADAS:
- 
- 

CAMBIOS REALIZADOS:
- 
- 

PENDIENTES PARA EL PRÓXIMO AÑO:
- 
- 

VALORACIÓN GENERAL DEL ESTADO DE SEGURIDAD (1-10): 
```
