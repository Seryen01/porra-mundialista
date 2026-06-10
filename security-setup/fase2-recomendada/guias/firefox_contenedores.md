# Firefox Multi-Account Containers — Configuración completa

Los contenedores de Firefox aíslan completamente las cookies, la caché y la sesión entre diferentes categorías de uso. Esto evita que Facebook sepa que estás mirando tu broker, o que Google rastree tu actividad bancaria.

---

## 1. Instalar Firefox Multi-Account Containers

1. Abre Firefox
2. Ve a: https://addons.mozilla.org/es/firefox/addon/multi-account-containers/
3. Haz clic en **"Añadir a Firefox"**
4. Confirma los permisos
5. Aparecerá el icono de contenedores en la barra de herramientas (icono de cuadrado de colores)

---

## 2. Crear y configurar contenedores

### Abrir el gestor de contenedores
1. Haz clic en el icono de contenedores (cuadrado de colores) en la barra de herramientas
2. Selecciona **"Administrar contenedores"**
3. Haz clic en **"Añadir un nuevo contenedor"** para crear cada uno

### Contenedor A: Finanzas

| Campo | Valor |
|-------|-------|
| Nombre | Finanzas |
| Color | Verde (o dorado) |
| Icono | Dólar / billetera |
| Sitios | degiro.nl, interactivebrokers.com, revolut.com, tu banco |

**Cómo asignar sitios automáticamente:**
1. Abre DEGIRO en una pestaña del contenedor Finanzas
2. Haz clic derecho en la pestaña → **"Reabrir en contenedor"** → selecciona "Finanzas"
3. Firefox te preguntará si siempre quieres abrir ese dominio en ese contenedor — haz clic en **"Usar siempre este contenedor"**
4. Repite para cada dominio financiero

### Contenedor B: Trabajo / Administración

| Campo | Valor |
|-------|-------|
| Nombre | Trabajo-Admin |
| Color | Azul |
| Icono | Maletín / documento |
| Sitios | sede.gob.es, agenciatributaria.gob.es, seg-social.es, cl@ve, tu portal de trabajo |

### Contenedor C: Personal

| Campo | Valor |
|-------|-------|
| Nombre | Personal |
| Color | Naranja |
| Icono | Persona |
| Sitios | redes sociales, entretenimiento, foros |

### Contenedor D: Compras

| Campo | Valor |
|-------|-------|
| Nombre | Compras |
| Color | Rosa / rojo |
| Icono | Carrito |
| Sitios | amazon.es, ebay.es, aliexpress.com |

---

## 3. Abrir sitios en contenedores específicos

### Método 1 — Al abrir un enlace
1. Haz clic derecho en cualquier enlace
2. Selecciona **"Abrir enlace en nuevo contenedor"**
3. Elige el contenedor

### Método 2 — Nueva pestaña en contenedor
1. Haz clic en la flecha junto al botón "+" de nueva pestaña
2. Selecciona el contenedor para la nueva pestaña

### Método 3 — Asignación automática (permanente)
Una vez asignado un dominio a un contenedor, Firefox lo abrirá automáticamente en ese contenedor siempre. Puedes gestionar estas asignaciones en:
- Icono de contenedores → **"Administrar contenedores"** → haz clic en un contenedor → **"Sitios web asignados"**

---

## 4. Configuración recomendada de about:config

Abre `about:config` en la barra de direcciones de Firefox y aplica estos ajustes adicionales:

> ⚠️ Acepta el aviso de "Aquí hay dragones" que aparece al abrir about:config

| Clave | Valor recomendado | Efecto |
|-------|-------------------|--------|
| `network.http.referer.XOriginPolicy` | `2` | No envía el header Referer a dominios externos |
| `network.http.referer.XOriginTrimmingPolicy` | `2` | Solo envía el origen, no la URL completa |
| `browser.send_pings` | `false` | Desactiva pings de hipervínculos para tracking |
| `dom.battery.enabled` | `false` | Evita fingerprinting por nivel de batería |
| `media.navigator.enabled` | `false` | Desactiva acceso a cámara/micrófono sin permiso explícito |
| `network.http.sendRefererHeader` | `1` | Solo envía Referer en mismo dominio |
| `dom.event.clipboardevents.enabled` | `false` | Impide que sitios intercepten copia/pegado |
| `browser.urlbar.suggest.searches` | `false` | Desactiva sugerencias de búsqueda en tiempo real |
| `browser.search.suggest.enabled` | `false` | Desactiva sugerencias mientras escribes |
| `security.ssl.require_safe_negotiation` | `true` | Requiere TLS seguro en todas las conexiones |
| `security.tls.version.min` | `3` | TLS 1.2 mínimo (bloquea TLS 1.0 y 1.1 obsoletos) |

**Cómo cambiar un valor en about:config:**
1. Escribe el nombre de la clave en la barra de búsqueda de about:config
2. Si aparece como `boolean`: haz doble clic para cambiar true/false
3. Si aparece como `integer`: haz doble clic e introduce el valor numérico
4. Si no existe: haz clic derecho → "Nuevo" → selecciona el tipo → introduce clave y valor

---

## 5. Verificar el aislamiento de contenedores

Para confirmar que el aislamiento funciona:
1. Inicia sesión en Gmail en el contenedor "Personal"
2. Abre una nueva pestaña en el contenedor "Finanzas"
3. Ve a gmail.com — no deberías estar logueado (el contenedor Finanzas tiene sus propias cookies, completamente aisladas)
4. ✅ Si no está logueado: el aislamiento funciona correctamente

---

## Extensiones complementarias recomendadas para Firefox

| Extensión | URL | Propósito |
|-----------|-----|-----------|
| uBlock Origin | addons.mozilla.org | Bloqueo de anuncios y rastreadores |
| Bitwarden | addons.mozilla.org | Gestor de contraseñas |
| ClearURLs | addons.mozilla.org | Elimina parámetros de seguimiento de URLs |
| LocalCDN | addons.mozilla.org | Sirve librerías JS localmente (evita CDNs de terceros) |
