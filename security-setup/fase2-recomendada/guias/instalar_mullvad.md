# Instalar y configurar Mullvad VPN

Mullvad es una VPN con sede en Suecia, sin registros de actividad, que no requiere email ni datos personales para crear una cuenta. Es la opción más privada del mercado para uso personal.

---

## 1. Crear una cuenta anónima en Mullvad

**La característica única de Mullvad:** No necesitas proporcionar ningún dato personal, ni siquiera un email.

1. Ve a: https://mullvad.net/es/account/create
2. Haz clic en **"Generar número de cuenta"**
3. Mullvad te generará un número de cuenta de 16 dígitos: `XXXX XXXX XXXX XXXX`
4. **Copia y guarda este número en Bitwarden** — es tu único identificador. No hay email, no hay contraseña, solo este número
5. Si pierdes este número, **pierdes la cuenta** (no hay recuperación)

---

## 2. Métodos de pago y privacidad

| Método | Privacidad | Disponibilidad |
|--------|-----------|----------------|
| **Efectivo por correo** | Máxima (anónimo) | Universal |
| **Monero (XMR)** | Muy alta (criptomoneda privada) | Requiere tener XMR |
| **Bitcoin (BTC)** | Alta (si mezclas o usas Lightning) | Requiere tener BTC |
| **Tarjeta regalo Mullvad** | Alta (comprada en efectivo) | Disponible en tiendas |
| **Tarjeta de crédito/débito** | Media (Mullvad no guarda datos, pero el banco sí) | Universal |
| **PayPal** | Baja (PayPal registra todo) | No recomendado |

**Recomendación para tu perfil:**
- Si tienes BTC en hardware wallet: paga con BTC (y asegúrate de enviar desde una dirección que no esté vinculada a exchanges KYC si quieres anonimato)
- Si prefieres simplicidad: tarjeta de débito es suficiente — Mullvad no guarda datos de pago

**Precio:** 5€/mes (no hay descuentos por suscripción larga — otra señal de privacidad: no quieren compromisos largos que permitan rastrear patrones)

**Cómo pagar:**
1. Entra en https://mullvad.net/es/account/login con tu número de cuenta
2. Haz clic en **"Añadir tiempo"**
3. Selecciona tu método de pago preferido
4. Sigue las instrucciones del método elegido

---

## 3. Instalar el cliente de Windows

1. Ve a: https://mullvad.net/es/download/vpn/windows
2. Descarga el instalador para Windows
3. Ejecuta el instalador — requiere privilegios de administrador
4. Una vez instalado, abre Mullvad VPN
5. En la pantalla de inicio, haz clic en **"¿Ya tienes una cuenta?"**
6. Introduce tu número de cuenta de 16 dígitos
7. Haz clic en **"Iniciar sesión"**

---

## 4. Configuración recomendada

### Protocolo: WireGuard
1. En la app, haz clic en **"Configuración"** (icono de engranaje)
2. Ve a **"VPN"** → **"Protocolo de túnel"**
3. Selecciona **"WireGuard"**
   - WireGuard es más rápido, más moderno y más seguro que OpenVPN
   - Menor latencia: ideal para navegación y streaming

### Kill Switch (obligatorio)
El Kill Switch bloquea todo el tráfico de internet si la VPN se desconecta, evitando que tu IP real quede expuesta.

1. Ve a **"Configuración"** → **"VPN"**
2. Activa **"Kill switch"** → **"Siempre activo"**
3. Con esta configuración, si Mullvad se cae, no podrás acceder a internet hasta que la VPN vuelva a conectarse (esto es lo esperado — protección máxima)

### DNS Leak Protection
1. En **"Configuración"** → **"DNS"**
2. Selecciona **"Usar el servidor DNS de Mullvad"**
3. Mullvad usa sus propios servidores DNS que no registran consultas

### Servidor de conexión
1. En la pantalla principal, haz clic en **"Seleccionar ubicación"**
2. Recomendación: elige un servidor en **Suecia** o **Alemania** para menor latencia desde España
3. Para máxima velocidad: usa la opción **"Más rápido"** (auto-selección)

---

## 5. Cuándo usar y cuándo no usar la VPN

### Úsala para:
- ✅ Redes Wi-Fi públicas (aeropuertos, cafeterías, hoteles) — siempre
- ✅ Cuando no quieres que tu ISP vea qué sitios visitas
- ✅ Torrent u otras actividades que no quieres que tracee tu ISP
- ✅ Evitar que tu IP real quede registrada en sitios que visitas
- ✅ Acceder a contenido con restricción geográfica

### No la uses para (o usa con precaución):
- ⚠️ Banca y brokers: algunas entidades bloquean o solicitan verificación extra desde IPs de VPN. Usa la IP real de casa para estos servicios, o crea una excepción en el Split Tunneling
- ⚠️ Servicios donde necesitas verificación por SMS (puede generar problemas con algunos operadores)
- ❌ Creer que la VPN te hace completamente anónimo — si estás logueado en Google/Facebook, te rastrean igualmente

### Split Tunneling (excluir apps específicas de la VPN)
1. Ve a **"Configuración"** → **"Split tunneling"**
2. Añade las apps que quieres que usen tu IP real (ej. tu app de banca)
3. El resto del tráfico seguirá por la VPN

---

## 6. Verificar que la VPN no tiene fugas

### DNS Leak Test
1. Con la VPN conectada, ve a: https://dnsleaktest.com
2. Haz clic en **"Extended test"**
3. Todos los servidores DNS que aparecen deben ser de Mullvad o del país del servidor que usas
4. Si aparece tu ISP (ej. Movistar, Orange), hay una fuga DNS — revisa la configuración

### WebRTC Leak Test
1. Con la VPN conectada, ve a: https://browserleaks.com/webrtc
2. Verifica que la IP local y pública mostradas son de la VPN, no las tuyas reales
3. Si ves tu IP real, el user.js de Firefox ya desactiva WebRTC (`media.peerconnection.enabled = false`)

### IP Check rápido
1. Ve a: https://mullvad.net/es/check
2. Mullvad te indicará si tu conexión pasa por sus servidores y si hay fugas detectadas
