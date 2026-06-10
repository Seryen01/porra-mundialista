# Verificar filtraciones de datos con HaveIBeenPwned

HaveIBeenPwned (HIBP) es el servicio de referencia para verificar si tus correos electrónicos o contraseñas han aparecido en filtraciones de datos conocidas. Es gratuito para uso básico y está mantenido por Troy Hunt, investigador de seguridad de reputación internacional.

---

## Verificación rápida en la web (sin API key)

### Verificar correo electrónico
1. Ve a: https://haveibeenpwned.com
2. Introduce tu dirección de correo en el campo central
3. Haz clic en **"pwned?"**
4. El resultado indicará:
   - **Verde ("Oh no — pwned!"):** Tu correo NO aparece en filtraciones conocidas ✅
   - **Rojo:** Tu correo SÍ aparece — verás la lista de servicios afectados

### Verificar correos a verificar (para tu perfil)
Verifica en este orden:
1. Tu correo de Hotmail principal
2. Tu correo de ProtonMail
3. Cualquier otro correo que uses para servicios financieros

### Qué hacer si apareces en una filtración
1. Identifica qué datos fueron expuestos (contraseña, email, teléfono, etc.)
2. Si incluyó contraseña: **cambia la contraseña en ese servicio inmediatamente**
3. Si usaste la misma contraseña en otros sitios: **cámbiala en todos ellos**
4. Activa 2FA en todos los servicios afectados si aún no lo tienes

---

## Verificar contraseñas específicas

HIBP también permite verificar si una contraseña concreta ha aparecido en filtraciones, usando k-anonymity (nunca envía la contraseña completa al servidor).

1. Ve a: https://haveibeenpwned.com/Passwords
2. Introduce la contraseña que quieres verificar
3. El servicio usa k-anonymity: solo envía los primeros 5 caracteres del hash SHA-1, nunca la contraseña en texto plano
4. Si aparece: esa contraseña está en bases de datos de hackers — cámbiala aunque no haya habido filtración directa tuya

---

## Obtener una API key gratuita (para el script automatizado)

El script `check_pwned_api.ps1` requiere una API key. La capa gratuita es suficiente para uso personal.

1. Ve a: https://haveibeenpwned.com/API/Key
2. En el campo de email, introduce tu dirección de correo
3. Marca que aceptas los términos de uso
4. Haz clic en **"Notify me"**
5. Recibirás un correo con tu API key (formato: cadena de caracteres alfanuméricos)
6. Guarda la API key en Bitwarden como nota segura: **"HaveIBeenPwned API Key"**

### Usar el script automatizado
Una vez tengas la API key:

```powershell
# Verificar un correo
.\check_pwned_api.ps1 -Emails "tucorreo@hotmail.com" -ApiKey "TU_API_KEY_AQUI"

# Verificar múltiples correos
.\check_pwned_api.ps1 -Emails "correo1@hotmail.com,correo2@proton.me" -ApiKey "TU_API_KEY_AQUI"
```

---

## Configurar alertas de nuevas filtraciones

Puedes suscribirte para recibir un email automático cuando tu correo aparezca en una nueva filtración:

1. Ve a: https://haveibeenpwned.com/NotifyMe
2. Introduce tu dirección de correo
3. Haz clic en **"Notify me"**
4. Confirma la suscripción desde el email que recibirás
5. Repite el proceso para cada correo que uses

---

## Recursos adicionales de verificación

| Servicio | URL | Qué verifica |
|----------|-----|--------------|
| HaveIBeenPwned | https://haveibeenpwned.com | Emails y contraseñas en filtraciones |
| Firefox Monitor | https://monitor.firefox.com | Similar a HIBP (usa la misma base de datos) |
| Dehashed | https://dehashed.com | Búsqueda más detallada (requiere registro) |
| LeakCheck | https://leakcheck.io | Alternativa con más fuentes (versión de pago) |

---

## Frecuencia de verificación recomendada

- **Inmediata:** Al terminar esta guía por primera vez
- **Mensual:** Al ejecutar el script de verificación mensual (`mantenimiento/scripts/verificacion_mensual.ps1`)
- **Tras cualquier noticia de brecha:** Cuando veas noticias de filtraciones de datos en servicios que uses
- **Trimestral:** Revisión completa de todos tus correos como parte del checklist trimestral
