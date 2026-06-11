# Activar 2FA (autenticación en dos pasos) en cuentas críticas

> **Prerequisito obligatorio:** Instala Aegis (Android) o Raivo (iOS) ANTES de empezar.
> Ver guía: `instalar_aegis_raivo.md`

El 2FA mediante TOTP (contraseñas de un solo uso) añade una segunda capa de seguridad. Aunque alguien obtenga tu contraseña, no podrá acceder sin el código temporal de 6 dígitos que cambia cada 30 segundos.

---

## 1. ProtonMail

**URL de configuración:** https://account.proton.me/account-password

### Pasos
1. Inicia sesión en https://proton.me/mail
2. Haz clic en el icono de tu perfil (arriba derecha) → **"Configuración"**
3. En el menú lateral izquierdo, haz clic en **"Seguridad y privacidad"**
4. Busca la sección **"Autenticación de dos factores"** y haz clic en **"Habilitar 2FA"**
5. Introduce tu contraseña actual de Proton para confirmar
6. Aparecerá un código QR — abre Aegis/Raivo → pulsa el botón **"+"** → **"Escanear código QR"**
7. Apunta la cámara al QR de la pantalla
8. Introduce el código de 6 dígitos que genera la app en el campo de verificación
9. Haz clic en **"Habilitar"**
10. Proton te mostrará **códigos de recuperación** (8 códigos de un solo uso) — guárdalos en Bitwarden como "Nota segura" con el título "ProtonMail - Códigos de recuperación 2FA"
11. Haz clic en **"He guardado mis códigos"**

### Advertencias específicas
- Si pierdes acceso a tu app de 2FA SIN los códigos de recuperación, perderás acceso permanente a tu cuenta ProtonMail (ProtonMail no puede recuperar cuentas con 2FA)
- Los códigos de recuperación son de un solo uso — úsalos solo en emergencia

---

## 2. Hotmail / Outlook (cuenta Microsoft)

**URL de configuración:** https://account.microsoft.com/security

### Pasos
1. Ve a https://account.microsoft.com/security
2. Inicia sesión con tu cuenta de Hotmail
3. Haz clic en **"Opciones de seguridad avanzadas"**
4. Busca la sección **"Verificación en dos pasos"** y haz clic en **"Activar"**
5. Haz clic en **"Siguiente"** en la pantalla de presentación
6. Selecciona **"Usar una aplicación"** (no el SMS)
7. En la siguiente pantalla, selecciona **"No puedo escanear el código de barras"** si prefieres introducir la clave manualmente, o deja la pantalla con el QR visible
8. Abre Aegis/Raivo → **"+"** → **"Escanear código QR"** → apunta al QR de Microsoft
9. Introduce el código de 6 dígitos generado por la app
10. Microsoft te dará un **código de recuperación** — guárdalo en Bitwarden

### Advertencias específicas
- Microsoft también puede usar SMS o email como 2FA — el TOTP (app) es más seguro que el SMS
- Si usas aplicaciones de escritorio de Office, puede que necesites generar contraseñas de aplicación específicas en: https://account.microsoft.com/security → "Contraseñas de aplicación"

---

## 3. DEGIRO

**URL de configuración:** https://trader.degiro.nl/login → Ajustes de seguridad

### Pasos
1. Inicia sesión en https://trader.degiro.nl
2. Haz clic en tu nombre de usuario (arriba derecha) → **"Mi perfil"**
3. En el menú, selecciona **"Seguridad"**
4. Busca **"Autenticación de dos factores"** y haz clic en **"Activar"**
5. Introduce tu contraseña actual de DEGIRO
6. Aparecerá un código QR — escanéalo con Aegis/Raivo
7. Introduce el código de verificación de 6 dígitos
8. Confirma la activación
9. Guarda los códigos de recuperación en Bitwarden

### Advertencias específicas
- DEGIRO puede requerir el 2FA en cada inicio de sesión (no solo en nuevos dispositivos)
- Si cambias de móvil, deberás regar el 2FA — hazlo antes de formatear el teléfono viejo

---

## 4. Interactive Brokers

**URL de configuración:** https://www.interactivebrokers.com → Gestión de cuenta → Seguridad

### Pasos
1. Inicia sesión en https://www.interactivebrokers.com/sso/Login
2. Ve a **"Gestión de cuenta"** (esquina superior derecha) → **"Configuración"**
3. En el menú de la izquierda, selecciona **"Seguridad"** → **"Dispositivos de seguridad"**
4. Haz clic en **"Añadir dispositivo"** o **"Gestionar dispositivos IB Key"**
5. Selecciona **"IBKR Mobile"** o **"Aplicación de autenticación de terceros (TOTP)"**
6. Si eliges TOTP externo: escanea el QR con Aegis/Raivo
7. Introduce el código de verificación
8. Interactive Brokers puede requerir un segundo paso de verificación por email o teléfono

### Advertencias específicas
- IB tiene su propio sistema llamado **"IB Key"** integrado en la app móvil de IBKR — considera usarlo como alternativa
- Para operaciones o retiradas de fondos, IB puede requerir autenticación adicional independientemente del 2FA configurado
- Guarda los códigos de backup en Bitwarden

---

## 5. Revolut

**URL de configuración:** App de Revolut → Perfil → Seguridad

### Pasos (desde la app móvil)
1. Abre la app de Revolut en tu móvil
2. Toca en tu foto de perfil (arriba izquierda) → **"Perfil"**
3. Ve a **"Seguridad"**
4. Toca en **"Autenticación en dos pasos"** o **"2FA"**
5. Selecciona **"Aplicación de autenticación"**
6. Escanea el código QR que aparece en pantalla con Aegis/Raivo
   - Como estás en el móvil, en Aegis toca **"+"** → **"Introducir clave manualmente"** y escribe la clave secreta que muestra Revolut junto al QR
7. Introduce el código de 6 dígitos generado
8. Guarda los códigos de recuperación

### Advertencias específicas
- Revolut usa el número de teléfono como verificación principal — el 2FA añade una capa extra
- Si cambias de número de teléfono, notifica a Revolut previamente para evitar perder el acceso

---

## 6. Banco tradicional (instrucciones genéricas)

Los bancos españoles suelen tener sistemas propios. Proceso general:

1. Accede a la banca online de tu banco (web o app)
2. Busca en el menú: **"Seguridad"**, **"Ajustes"** o **"Mi perfil"**
3. Localiza la opción: **"Verificación en dos pasos"**, **"Segundo factor"** o **"OTP"**
4. Los bancos españoles suelen ofrecer:
   - **SMS (OTP por SMS)** — mínimo aceptable, mejor que nada
   - **App del banco como segundo factor** — común en CaixaBank, BBVA, Santander
   - **Coordenadas en tarjeta** — obsoleto pero aún presente en algunos
5. Activa la opción más segura disponible
6. Si el banco ofrece app propia como 2FA, configúrala siguiendo las instrucciones en pantalla

### Bancos específicos en España
- **CaixaBank:** CaixaBankNow app → Seguridad → Activar reconocimiento biométrico + CaixaSign
- **BBVA:** App BBVA → Más → Seguridad → Verificación en dos pasos
- **Santander:** App Santander → Menú → Seguridad → Clave digital personal (CDP)
- **ING:** App ING → Acceder a la configuración de seguridad → Verificación adicional

---

## Dónde guardar los códigos de recuperación

**Para cada servicio, guarda en Bitwarden:**
1. Abre Bitwarden → **"Nuevo elemento"** → **"Nota segura"**
2. Título: `[Servicio] - Códigos de recuperación 2FA`
3. Contenido: pega los códigos exactamente como los proporciona el servicio
4. En el campo de notas añade la fecha en que los generaste

> Los códigos de recuperación son de un solo uso en la mayoría de servicios. Después de usarlos, regenera nuevos códigos.
