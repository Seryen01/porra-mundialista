# Instalar app autenticadora 2FA: Aegis (Android) o Raivo (iOS)

> ⚠️ **Instala la app ANTES de activar el 2FA en cualquier servicio.**
> Sin la app no podrás completar el proceso de activación.

---

## Android: Aegis Authenticator

Aegis es de código abierto, auditable, con cifrado local AES-256 y backups exportables.

### Opción A — Instalar desde Google Play (más fácil)
1. Abre Google Play en tu Android
2. Busca: **"Aegis Authenticator"**
3. El autor debe ser: **"beemdevelopment"**
4. Verifica que tiene más de 1 millón de descargas y valoración alta
5. Toca **"Instalar"**

### Opción B — Instalar desde F-Droid (más privada, sin cuenta Google)
F-Droid es una tienda de apps de código abierto que no requiere cuenta de Google ni telemetría.

1. En tu Android, ve a: https://f-droid.org
2. Descarga e instala la app de F-Droid (deberás permitir instalación de fuentes desconocidas para el navegador)
3. Una vez instalado F-Droid, ábrelo y busca: **"Aegis"**
4. El paquete oficial es: `com.beemdevelopment.aegis`
5. Instala Aegis desde F-Droid

**Diferencia entre Play Store y F-Droid:**
- Google Play requiere cuenta de Google y registra datos de uso
- F-Droid no rastrea instalaciones y sirve el APK directamente desde el código fuente
- La funcionalidad de Aegis es idéntica en ambos casos
- Para mayor privacidad: usa F-Droid

---

## iOS: Raivo OTP

Raivo es de código abierto, almacena tokens en iCloud Keychain (cifrado de extremo a extremo).

### Instalación
1. Abre la App Store en tu iPhone
2. Busca: **"Raivo OTP"**
3. El desarrollador debe ser: **"Tijme Gommers"**
4. Verifica que es la app correcta (icono azul con un escudo)
5. Toca **"Obtener"** e instala

> **Alternativa multiplataforma:** Si tienes tanto Android como iOS, considera **2FAS Auth** (disponible en ambas plataformas, código abierto, con backup en Google Drive o iCloud cifrado).

---

## Configuración inicial de Aegis

### Primer inicio
1. Abre Aegis
2. Toca **"Empezar"**
3. Selecciona el método de desbloqueo:
   - **PIN** (6 dígitos mínimo, recomendado) — equilibrio entre seguridad y comodidad
   - **Contraseña** — más segura pero menos cómoda
   - **Biométrico** (huella/cara) — cómodo, se puede añadir además del PIN
4. Introduce y confirma tu PIN o contraseña

### Configurar backup cifrado (OBLIGATORIO)
El backup cifrado es tu seguro ante pérdida o rotura del teléfono. Sin él, perderías acceso a todos tus 2FA.

1. En Aegis, toca el menú de tres puntos (⋮) arriba a la derecha
2. Selecciona **"Ajustes"**
3. Ve a **"Copias de seguridad"** → **"Exportar"**
4. Selecciona **"Exportar cifrado (AES-256)"**
5. Introduce una contraseña para cifrar el archivo de backup (puede ser diferente al PIN de Aegis — guárdala en Bitwarden)
6. Elige dónde guardar el archivo:
   - **Recomendado:** Proton Drive (aplicación de Proton para Android)
   - Alternativa: Google Drive (menos privado, pero funciona)
   - El archivo resultante tendrá extensión `.json` o `.aegis`

### Habilitar backup automático (Aegis)
1. En **Ajustes → Copias de seguridad**
2. Activa **"Copia de seguridad automática"**
3. Selecciona una carpeta en tu almacenamiento del teléfono
4. Sincroniza esa carpeta con Proton Drive o Google Drive

---

## Configuración inicial de Raivo (iOS)

1. Abre Raivo al instalarlo
2. Sigue el asistente de configuración
3. Selecciona **"iCloud"** como destino de backup (cifrado de extremo a extremo de Apple)
4. Configura un PIN de desbloqueo para la app
5. Activa FaceID/TouchID para mayor comodidad

### Exportar backup en Raivo
1. Ve a **Configuración** (icono de engranaje)
2. Toca **"Exportar"** → **"Exportar a ZIP cifrado"**
3. Guarda el archivo ZIP en Proton Drive

---

## Dónde guardar el backup

**Recomendación por orden de prioridad:**

1. **Proton Drive** (https://drive.proton.me) — cifrado de extremo a extremo, el más seguro
2. Un pendrive físico guardado en lugar seguro (combinado con la opción 1)
3. Google Drive como opción secundaria de emergencia

**NO guardes el backup de 2FA en:**
- El mismo dispositivo que tiene la app (si lo pierdes, pierdes ambas cosas)
- OneDrive (asociado a Microsoft/Hotmail)
- Correo electrónico

---

## Checklist antes de activar 2FA en cualquier servicio

- [ ] Aegis o Raivo instalado y con PIN configurado
- [ ] Backup cifrado creado y subido a Proton Drive
- [ ] Contraseña del backup guardada en Bitwarden
- [ ] Backup accesible desde un segundo dispositivo (verificado)
- [ ] Entiendo que si pierdo el teléfono Y el backup, necesitaré los códigos de recuperación
