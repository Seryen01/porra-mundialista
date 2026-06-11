# Migrar el correo principal a ProtonMail

## Por qué migrar de Hotmail a ProtonMail

| Criterio | Hotmail/Outlook | ProtonMail |
|----------|-----------------|------------|
| Cifrado | En tránsito solo | E2E entre usuarios Proton |
| Acceso de Microsoft | Sí (términos de uso) | No (zero-knowledge) |
| Escaneo para publicidad | Histórico (ahora dicen que no) | No |
| Sede legal | EE.UU. (PRISM, FISA) | Suiza (neutralidad) |
| 2FA robusto | Sí | Sí (FIDO2 disponible) |
| Aliases | No | Con SimpleLogin integrado |

---

## Lista priorizada de servicios a migrar

Cambia el email registrado en este orden (de mayor a menor riesgo financiero/legal):

### Prioridad 1 — Crítico (hacer primero)
1. **DEGIRO** — acceso a inversiones
2. **Interactive Brokers** — acceso a inversiones
3. **Revolut** — dinero/pagos
4. **Banco tradicional** — cuenta bancaria principal
5. **Bitwarden** — gestor de contraseñas (si usaste Hotmail al registrarte)

### Prioridad 2 — Alto (hacer en la primera semana)
6. **Hacienda / AEAT** — sede.agenciatributaria.gob.es
7. **Seguridad Social** — sede.seg-social.gob.es
8. **Cl@ve / DNIe** — sistema de identificación digital
9. **DGT** — si tienes notificaciones de tráfico
10. **Correos** — si tienes paquetes con seguimiento

### Prioridad 3 — Medio (hacer en el primer mes)
11. Amazon
12. Tiendas online habituales
13. Servicios de streaming (Netflix, Spotify, etc.)
14. Redes sociales

### Prioridad 4 — Bajo (ir haciendo)
15. Foros y comunidades online
16. Suscripciones a newsletters
17. Cuentas con poca actividad

---

## Proceso de cambio de email en cada tipo de servicio

### Servicios financieros (DEGIRO, IB, Revolut)
1. Inicia sesión
2. Ve a **Perfil / Configuración de cuenta / Datos personales**
3. Busca el apartado de **"Email"** o **"Correo electrónico"**
4. Introduce el nuevo correo de ProtonMail
5. El servicio enviará un email de confirmación a la nueva dirección — confírmalo
6. Tras confirmar, inicia sesión para verificar que el cambio es correcto

> ⚠️ Algunos brokers pueden requerir verificación adicional (llamada telefónica, email a atención al cliente) para cambiar el correo. Prepárate para el proceso de verificación de identidad.

### Administración pública española
El cambio de email en los servicios públicos puede requerir identificación con DNI electrónico o Cl@ve:
1. Accede con tu certificado digital o Cl@ve
2. Busca "Mis datos" o "Perfil"
3. Modifica el email de contacto
4. Para la AEAT: https://www.agenciatributaria.gob.es → Sede Electrónica → Mis datos censales

---

## Configurar reenvío temporal desde Hotmail a ProtonMail

Durante la transición, configura Hotmail para reenviar todos los correos a ProtonMail. Así no perderás ninguna comunicación mientras completas la migración.

### En Outlook.com (Hotmail)
1. Inicia sesión en https://outlook.live.com
2. Haz clic en el icono de engranaje (⚙️) → **"Ver toda la configuración de Outlook"**
3. Ve a **"Correo"** → **"Reenvío"**
4. Activa **"Habilitar el reenvío"**
5. Introduce tu dirección de ProtonMail
6. Marca **"Conservar una copia de los mensajes reenviados"** (para no perder nada durante la transición)
7. Haz clic en **"Guardar"**

**Duración recomendada del reenvío:** 6 meses mínimo, hasta que confirmes que has cambiado el email en todos los servicios importantes.

---

## Usar SimpleLogin para aliases únicos por servicio

SimpleLogin genera direcciones de email únicas para cada servicio. Si un servicio sufre una filtración, solo ese alias queda comprometido — desactívalo sin afectar a tu email real.

### Configuración rápida con ProtonMail
ProtonMail y SimpleLogin están integrados (Proton adquirió SimpleLogin en 2022):

1. Ve a: https://simplelogin.io
2. Haz clic en **"Iniciar con Proton"** — te autentica automáticamente con tu cuenta Proton
3. Queda vinculado a tu ProtonMail sin configuración adicional

### Crear un alias para cada servicio
1. En SimpleLogin, haz clic en **"Nuevo alias"**
2. Selecciona el formato: `nombre-elegido@simplelogin.com` o uno aleatorio
3. Dale un nombre descriptivo: "DEGIRO alias", "Amazon alias"
4. Todos los emails a ese alias llegarán a tu ProtonMail
5. Puedes responder desde el alias sin revelar tu dirección real

---

## Plan de 30 días para completar la migración

| Días | Tareas |
|------|--------|
| 1-3 | Activar reenvío Hotmail → ProtonMail. Cambiar email en brokers y banco. |
| 4-7 | Cambiar email en AEAT, Seguridad Social, Cl@ve. Cambiar en Bitwarden. |
| 8-14 | Cambiar en servicios financieros secundarios (tarjetas, seguros). Configurar SimpleLogin. |
| 15-21 | Cambiar en Amazon y principales tiendas online. Cambiar en servicios de streaming. |
| 22-30 | Cambiar en redes sociales y servicios secundarios. Auditar que no queda ningún crítico sin migrar. |
| +30 días | Mantener reenvío activo 6 meses más. Verificar ocasionalmente si llega algo a Hotmail. |

> **Criterio de finalización:** Cuando durante 30 días consecutivos no llegue ningún correo importante a Hotmail (solo publicidad o correos ya migrados), la migración está completada.
