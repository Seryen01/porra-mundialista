# Configurar YubiKey 5 NFC

La YubiKey es un token de hardware físico que actúa como segundo factor de autenticación. Es significativamente más segura que las apps TOTP porque requiere presencia física y no puede ser phisheada remotamente.

---

## 1. Qué modelo comprar y dónde

**Modelo recomendado:** YubiKey 5 NFC

| Característica | Valor |
|---------------|-------|
| Precio | ~55€ |
| Conexión | USB-A + NFC (para móvil también) |
| Protocolos | FIDO2/WebAuthn, TOTP, OTP, OpenPGP, PIV |
| Compatibilidad | Windows, macOS, Linux, Android (NFC), iOS (NFC) |

**Dónde comprar (oficial):**
- Yubico Store EU: https://www.yubico.com/es/store/
- Amazon.es (vendedor: Yubico): busca "YubiKey 5 NFC"
- También disponible en PCComponentes y otras tiendas de electrónica

> ⚠️ Compra siempre en tiendas oficiales o distribuidores autorizados. Una YubiKey de origen desconocido podría estar comprometida.

**Recomendación adicional:** Compra DOS (una principal + una de backup). Yubico ofrece descuento por dos unidades. Si pierdes la única que tienes sin backup, quedas bloqueado de todas las cuentas.

---

## 2. FIDO2/WebAuthn vs TOTP — cuándo usar cada uno

| Protocolo | Cómo funciona | Seguridad | Compatibilidad |
|-----------|--------------|-----------|----------------|
| **FIDO2/WebAuthn** | El sitio web genera un desafío criptográfico que la YubiKey firma físicamente | Máxima (resistente a phishing) | Sitios modernos (Bitwarden, ProtonMail, Google, GitHub) |
| **TOTP** | La YubiKey genera un código de 6 dígitos (igual que Aegis pero en hardware) | Alta (no resistente a phishing avanzado) | Cualquier sitio con 2FA estándar |

**Regla práctica:**
- Usa **FIDO2** cuando el sitio lo soporte — es más seguro y más cómodo (solo tocas el botón dorado)
- Usa **TOTP en YubiKey** (via Yubico Authenticator) para sitios que no soportan FIDO2

---

## 3. Configuración en ProtonMail (FIDO2)

1. Inicia sesión en https://account.proton.me
2. Ve a **"Seguridad y privacidad"** → **"Autenticación de dos factores"**
3. Haz clic en **"Añadir clave de seguridad"**
4. Introduce tu contraseña de Proton para confirmar
5. Cuando aparezca el prompt "Toca tu clave de seguridad", inserta la YubiKey en el USB y toca el botón dorado
6. Dale un nombre a la clave: "YubiKey 5 NFC - Principal"
7. Si tienes una segunda YubiKey de backup, añádela también
8. Guarda los códigos de recuperación en Bitwarden

---

## 4. Configuración en Bitwarden (FIDO2)

1. Inicia sesión en https://vault.bitwarden.com
2. Ve a tu perfil (arriba derecha) → **"Configuración de la cuenta"** → **"Seguridad"** → **"Inicio de sesión en dos pasos"**
3. Haz clic en **"Gestionar"** junto a **"Clave FIDO2 WebAuthn"**
4. Introduce tu contraseña maestra
5. Haz clic en **"Leer clave"**
6. Inserta la YubiKey y toca el botón dorado cuando se ilumine
7. Dale un nombre descriptivo
8. Añade también Aegis/Raivo como segundo método de backup (en caso de perder la YubiKey)

---

## 5. Para sitios que solo soportan TOTP — Yubico Authenticator

Para sitios que no soportan FIDO2, puedes almacenar los tokens TOTP en la YubiKey en lugar de en Aegis.

### Instalar Yubico Authenticator

1. Descarga desde: https://www.yubico.com/products/yubico-authenticator/
2. Disponible para Windows, macOS, Linux, Android, iOS
3. La app requiere la YubiKey conectada para mostrar los códigos — si no tienes la YubiKey, no puedes ver los códigos (seguridad adicional)

### Añadir una cuenta TOTP a la YubiKey

1. Abre Yubico Authenticator con la YubiKey conectada
2. Haz clic en el botón **"+"** (Añadir cuenta)
3. Escanea el código QR del servicio que quieres añadir
4. El token se guarda en la YubiKey (no en el teléfono)
5. La YubiKey almacena hasta 32 tokens TOTP

**Limitación:** La versión gratuita de OATH/TOTP en la YubiKey 5 tiene un máximo de 32 cuentas. Es más que suficiente para uso personal.

---

## 6. Qué hacer si pierdes la YubiKey

**Esta es la situación que más debes prevenir.** Prepara antes:

1. **Siempre configura un método de backup:** Al añadir la YubiKey, mantén activo Aegis/Raivo como método alternativo
2. **Guarda los códigos de recuperación** de cada servicio en Bitwarden (nota segura separada)
3. **Segunda YubiKey:** Añade la segunda YubiKey como dispositivo alternativo en todos los servicios donde configures la primera

**Si pierdes la YubiKey sin backup:**
- Usa los códigos de recuperación guardados en Bitwarden para cada servicio
- Elimina la YubiKey perdida de todos los servicios desde la configuración de seguridad
- Registra la nueva YubiKey

---

## 7. Configurar PIN en la YubiKey

El PIN protege la YubiKey si alguien la roba. Sin PIN, cualquiera que tenga la llave física puede usarla.

### Instalar YubiKey Manager

1. Descarga desde: https://www.yubico.com/support/download/yubikey-manager/
2. Instala YubiKey Manager en Windows
3. Inserta la YubiKey
4. Abre YubiKey Manager

### Configurar PIN FIDO2

1. En YubiKey Manager, ve a **"Applications"** → **"FIDO2"**
2. Haz clic en **"Set PIN"**
3. Introduce un PIN de 6-8 dígitos (no uses 123456 ni fechas de cumpleaños)
4. Guarda el PIN en Bitwarden — si lo olvidas, necesitas resetear la YubiKey (perderás los tokens TOTP guardados en ella)

**Tras configurar el PIN:** Windows te pedirá el PIN cada vez que uses la YubiKey para autenticarte, además de requerir tocar el botón. Esto es seguridad en capas.

### Límite de intentos fallidos de PIN
La YubiKey bloquea la función FIDO2 después de 8 intentos fallidos de PIN. Para desbloquear se necesita una operación de reset que borra todos los datos FIDO2. Los tokens TOTP (OATH) tienen su propio PIN separado.
