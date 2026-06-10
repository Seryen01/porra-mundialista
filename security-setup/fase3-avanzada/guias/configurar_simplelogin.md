# Sistema de Aliases de Correo con SimpleLogin

SimpleLogin te permite crear direcciones de email únicas para cada servicio. Si un servicio sufre una filtración, el atacante solo obtiene un alias — no tu dirección real, y puedes desactivarlo sin afectar al resto de cuentas.

---

## 1. Qué es SimpleLogin y por qué es útil para tu perfil

**El problema:** Usas el mismo email en DEGIRO, tu banco, Amazon y 50 servicios más. Si cualquiera de ellos sufre una filtración, tu email real queda expuesto y los atacantes pueden hacer phishing dirigido.

**La solución SimpleLogin:**
- `degiro-alias@simplelogin.com` → reenvía a tu ProtonMail real
- `amazon-alias@simplelogin.com` → reenvía a tu ProtonMail real
- Si Amazon tiene una filtración: desactivas ese alias y nada más
- Nadie conoce tu dirección ProtonMail real excepto tú

**Ventajas adicionales:**
- Puedes responder correos desde el alias sin revelar tu dirección real
- Ves qué servicios te envían spam (si recibes spam en "amazon-alias@", Amazon vendió tu datos)
- Compatible con cualquier proveedor de email

---

## 2. Crear cuenta con integración ProtonMail

SimpleLogin fue adquirido por Proton en 2022 y está integrado nativamente:

1. Ve a: https://simplelogin.io
2. Haz clic en **"Iniciar con Proton"** (botón morado)
3. Serás redirigido a Proton para autenticarte con tu cuenta existente
4. Autoriza el acceso de SimpleLogin a tu cuenta Proton
5. Listo — SimpleLogin y ProtonMail quedan vinculados sin configuración adicional

**Plan gratuito:** 10 aliases activos (suficiente para empezar)
**Plan Premium** (~30€/año): aliases ilimitados, dominios personalizados, catch-all

---

## 3. Generar aliases para los servicios más importantes

### Desde el panel web de SimpleLogin

1. Ve a: https://app.simplelogin.io/dashboard
2. Haz clic en **"Nuevo alias"**
3. Elige el formato:
   - **Prefijo personalizado:** `degiro.xxxx@simplelogin.com` (memorable, fácil de identificar)
   - **Aleatorio:** `palabra.palabra.xxxx@simplelogin.com` (más privado, más difícil de adivinar)
4. Haz clic en **"Crear"**
5. Copia el alias generado y úsalo al registrarte/actualizar el email en el servicio correspondiente

### Desde la extensión de navegador

1. Instala la extensión SimpleLogin en Firefox/Chrome: https://simplelogin.io/#download
2. Al rellenar un campo de email en cualquier web, haz clic en el icono de SimpleLogin en el campo
3. La extensión sugerirá automáticamente un alias basado en el dominio del sitio
4. Haz clic en "Crear y usar" para generar el alias al vuelo

### Plan de aliases para los 20 servicios más importantes

| Servicio | Alias sugerido | Prioridad |
|----------|---------------|-----------|
| DEGIRO | `degiro@simplelogin.com` o similar | 🔴 1 |
| Interactive Brokers | `ibkr@simplelogin.com` | 🔴 2 |
| Revolut | `revolut@simplelogin.com` | 🔴 3 |
| Banco principal | `banco-[nombre]@simplelogin.com` | 🔴 4 |
| AEAT / Hacienda | `aeat@simplelogin.com` | 🟠 5 |
| Seguridad Social | `segsocial@simplelogin.com` | 🟠 6 |
| Amazon | `amazon@simplelogin.com` | 🟡 7 |
| Netflix | `netflix@simplelogin.com` | 🟡 8 |
| Spotify | `spotify@simplelogin.com` | 🟡 9 |
| GitHub | `github@simplelogin.com` | 🟡 10 |
| Foros y comunidades | Alias aleatorio diferente por foro | ⚪ 11+ |

---

## 4. Gestionar aliases desde el panel de control

### Ver todos tus aliases
En https://app.simplelogin.io/dashboard verás todos tus aliases con:
- Estado (activo / inactivo)
- Número de emails recibidos
- Última actividad

### Desactivar un alias comprometido
Si recibes phishing o spam en un alias:
1. Haz clic en el alias en el dashboard
2. Haz clic en **"Desactivar"** (toggle)
3. Todos los emails enviados a ese alias serán rechazados automáticamente
4. Tu dirección real queda protegida

### Ver desde qué alias llega cada correo
ProtonMail mostrará en el campo "Para:" el alias al que se envió cada correo, no tu dirección real. Así sabes exactamente qué servicio te está escribiendo.

---

## 5. Responder correos desde un alias sin revelar tu email real

Cuando recibes un email a través de SimpleLogin y necesitas responder:

1. En ProtonMail, abre el correo recibido (llegará desde `reply+xxx@simplelogin.com`)
2. Haz clic en **"Responder"** normalmente
3. SimpleLogin intercepta automáticamente la respuesta
4. El destinatario recibe tu respuesta desde el alias, **no desde tu ProtonMail real**

---

## 6. Plan de migración para los 20 servicios más importantes

### Semana 1 (servicios financieros y administración)
1. Crea alias para DEGIRO, IB, Revolut, banco
2. Actualiza el email en cada servicio
3. Confirma el cambio de email con la verificación de cada plataforma
4. Actualiza la información en Bitwarden (email de acceso)

### Semana 2 (servicios digitales clave)
5. GitHub, Amazon, servicios de trabajo
6. Verifica que recibes correos de confirmación en ProtonMail vía el alias

### Semana 3-4 (servicios secundarios)
7. Netflix, Spotify, otras suscripciones
8. Foros y comunidades (usando alias aleatorios)

### Registro en Bitwarden
Para cada alias, actualiza la entrada correspondiente en Bitwarden:
- **Usuario:** el alias de SimpleLogin (no tu ProtonMail real)
- **Notas:** "Alias: `degiro@simplelogin.com` → ProtonMail"

Así, si en el futuro necesitas saber qué email usaste en un servicio, lo tienes en Bitwarden.
