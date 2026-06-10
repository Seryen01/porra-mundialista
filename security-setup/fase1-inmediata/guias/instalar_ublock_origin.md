# Instalar y configurar uBlock Origin

uBlock Origin es el bloqueador de anuncios y rastreadores más eficaz disponible. Es de código abierto, no monetiza datos, y tiene un impacto mínimo en el rendimiento del navegador.

> ⚠️ **Importante:** Existe una extensión fraudulenta llamada "uBlock" (sin "Origin"). Asegúrate de instalar **uBlock Origin** del desarrollador **Raymond Hill (gorhill)**.

---

## Instalación por navegador

### Google Chrome
1. Ve a: https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm
2. **Verifica antes de instalar:**
   - Nombre exacto: **"uBlock Origin"**
   - Desarrollador: **"Raymond Hill"**
   - Instalaciones: más de 10 millones
3. Haz clic en **"Añadir a Chrome"**
4. En el popup de confirmación, haz clic en **"Añadir extensión"**
5. El icono rojo del escudo aparecerá en la barra de herramientas

### Microsoft Edge
1. Ve a: https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odfafepnkmbhccpbejgmiehpchacaeak
2. **Verifica:** Desarrollador "Raymond Hill", millones de usuarios
3. Haz clic en **"Obtener"**
4. Confirma la instalación

### Firefox
1. Ve a: https://addons.mozilla.org/es/firefox/addon/ublock-origin/
2. **Verifica:** Desarrollador "Raymond Hill", extensión recomendada por Mozilla
3. Haz clic en **"Añadir a Firefox"**
4. Confirma los permisos

---

## Cómo verificar que es la extensión legítima

Una vez instalada, verifica su autenticidad:

1. En Chrome: ve a `chrome://extensions/`
2. Localiza uBlock Origin y haz clic en **"Detalles"**
3. Verifica:
   - ID de la extensión en Chrome: `cjpalhdlnbpafiamejdnhcphjbkeiagm`
   - Código fuente disponible en GitHub: https://github.com/gorhill/uBlock
4. Haz clic derecho en el icono de uBlock → **"Opciones"** → debe mostrarse el panel de configuración sin publicidad ni suscripciones de pago

---

## Configurar listas de filtros recomendadas

1. Haz clic derecho en el icono de uBlock Origin → **"Opciones"**
2. Ve a la pestaña **"Listas de filtros"**
3. Activa las siguientes listas (algunas ya estarán activas por defecto):

| Lista | Propósito | Activar |
|-------|-----------|---------|
| uBlock filters | Filtros propios de uBlock | ✅ Ya activa |
| uBlock filters – Ads | Bloqueo de anuncios adicional | ✅ Ya activa |
| uBlock filters – Privacy | Protección de privacidad | ✅ Activar |
| uBlock filters – Badware risks | Sitios peligrosos | ✅ Activar |
| EasyList | Lista estándar anti-anuncios | ✅ Ya activa |
| EasyPrivacy | Rastreadores y analíticas | ✅ Activar |
| Peter Lowe's Ad and tracking server list | Servidores de anuncios/tracking | ✅ Activar |
| Online Malicious URL Blocklist | URLs maliciosas | ✅ Activar |
| Spam404 | Sitios de spam y phishing | ✅ Activar |

4. Haz clic en **"Aplicar cambios"** (botón azul que aparece al hacer modificaciones)
5. Haz clic en **"Actualizar ahora"** para descargar las listas actualizadas

---

## Activar el modo avanzado (opcional pero recomendado)

El modo avanzado permite control granular sobre qué scripts y conexiones se permiten.

1. En las Opciones de uBlock Origin, ve a la pestaña **"Configuración"**
2. Activa la casilla **"I am an advanced user"** (o "Soy un usuario avanzado")
3. Lee la advertencia que aparece — confirma que entiendes que en modo avanzado puedes romper sitios si bloqueas recursos necesarios
4. Haz clic en el icono de uBlock en cualquier página — verás un panel de control más detallado con columnas de dominios y tipos de recursos

---

## Verificar que uBlock Origin está funcionando

### Método 1 — Test rápido
1. Ve a: https://ads-blocker.com/testing/
2. Si uBlock funciona, no deberías ver anuncios de prueba en la página

### Método 2 — Contador de bloqueos
1. Visita cualquier sitio de noticias (ej: elmundo.es, elpais.com)
2. El número que aparece en el icono de uBlock indica cuántos elementos han sido bloqueados en esa página
3. En sitios de noticias típicos, el número suele ser entre 20 y 80

### Método 3 — Verificar ausencia de anuncios
1. Visita YouTube
2. Los vídeos deben reproducirse sin anuncios previos
3. En el panel de uBlock para YouTube debería mostrar múltiples bloqueos

---

## Gestionar excepciones (whitelist)

Si algún sitio deja de funcionar correctamente:

1. Haz clic en el icono de uBlock → icono de **"Encendido"** (el botón grande)
2. Esto desactiva uBlock solo para ese sitio
3. Recarga la página
4. Si funciona, el sitio usa recursos que uBlock bloquea — puedes mantener la excepción para ese dominio específico

Para sitios de confianza que quieras permitir completamente (ej: tu banco):
1. Haz clic en el icono de uBlock en el sitio
2. Haz clic en el candado para crear una excepción permanente para ese dominio
