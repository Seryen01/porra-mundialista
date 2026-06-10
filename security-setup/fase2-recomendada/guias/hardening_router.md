# Hardening del Router Doméstico

El router es la puerta de entrada a tu red. Si está mal configurado, todos los dispositivos conectados son vulnerables independientemente del software de seguridad que tengas instalado.

---

## 1. Acceder al panel de administración

### IPs de acceso según ISP español

| ISP | IP del router | Usuario por defecto | Contraseña |
|-----|--------------|---------------------|------------|
| **Movistar / O2** | 192.168.1.1 | admin | 1234 o en pegatina |
| **Vodafone** | 192.168.1.1 | user | password o en pegatina |
| **Orange** | 192.168.1.1 | admin | admin o en pegatina |
| **MásMóvil / Yoigo** | 192.168.1.1 | admin | en pegatina del router |
| **Digi** | 192.168.1.1 | admin | admin o en pegatina |

**Cómo encontrar la IP si no sabes cuál es:**
1. Abre PowerShell
2. Ejecuta: `ipconfig`
3. Busca la línea **"Puerta de enlace predeterminada"** — esa es la IP de tu router

**Para acceder:**
1. Abre cualquier navegador (preferiblemente en la red local, no en VPN)
2. Escribe la IP en la barra de direcciones: `http://192.168.1.1`
3. Introduce usuario y contraseña (están en la pegatina del router o en el manual)

---

## 2. Lista de verificación de seguridad

### ✅ Cambiar contraseña de administrador

**Por qué:** La contraseña por defecto es pública y cualquier dispositivo en tu red puede acceder al panel.

1. En el panel del router, busca: **"Administración"**, **"Sistema"** o **"Mantenimiento"**
2. Busca la opción: **"Contraseña del administrador"** o **"Cambiar contraseña"**
3. Introduce la nueva contraseña: genera una de 16+ caracteres con Bitwarden
4. Guarda la contraseña en Bitwarden bajo el nombre: "Router doméstico - Admin"
5. Aplica los cambios y vuelve a iniciar sesión con la nueva contraseña

---

### ✅ Desactivar WPS

**Por qué:** WPS (Wi-Fi Protected Setup) tiene vulnerabilidades conocidas que permiten ataques de fuerza bruta al PIN en minutos. No aporta ningún beneficio de seguridad real.

1. En el panel, busca: **"Wi-Fi"** → **"WPS"** o **"Configuración avanzada de Wi-Fi"**
2. Cambia WPS de **Activado** a **Desactivado**
3. Aplica los cambios

---

### ✅ Verificar y actualizar firmware

**Por qué:** El firmware desactualizado puede tener vulnerabilidades críticas conocidas.

1. En el panel, busca: **"Actualización de firmware"**, **"Software"** o **"Mantenimiento"**
2. Haz clic en **"Buscar actualizaciones"**
3. Si hay una versión más reciente, descárgala e instálala
4. ⚠️ No desconectes el router durante la actualización
5. Si tu router es del ISP, puede actualizarse automáticamente — verifica que la actualización automática está activada

---

### ✅ Cambiar el nombre de red Wi-Fi (SSID)

**Por qué:** Los SSIDs como "Vodafone-1234" o "MOVISTAR_PLUS_ABCD" revelan tu ISP y el modelo del router, dando pistas a un atacante.

1. En el panel, busca: **"Wi-Fi"** → **"Red inalámbrica"** o **"SSID"**
2. Cambia el nombre a algo que:
   - No revele tu nombre, dirección ni ISP
   - No revele el modelo del router
   - Sea reconocible para ti: ej. "RedCasa", "HomeNet-5G"
3. Si tienes banda de 2.4 GHz y 5 GHz, cámbialas ambas
4. Aplica — tus dispositivos necesitarán reconectarse con la nueva red

---

### ✅ Separar red de invitados

**Por qué:** Los invitados (y dispositivos IoT: Smart TV, cámaras, etc.) no deben tener acceso a tu red principal donde están el PC y el NAS.

1. Busca: **"Red de invitados"** o **"Guest Network"**
2. Actívala
3. Dale un nombre diferente al de tu red principal (ej. "RedCasa-Invitados")
4. Establece una contraseña separada
5. Activa la opción **"Aislar clientes de la red de invitados"** si está disponible (impide que dispositivos de invitados se comuniquen entre sí o accedan a tu LAN)
6. Conecta todos los dispositivos IoT y Smart TV a esta red de invitados

---

### ✅ Desactivar UPnP

**Por qué:** UPnP (Universal Plug and Play) permite que cualquier dispositivo de la red abra puertos en el router automáticamente, lo que puede ser explotado por malware.

1. Busca: **"UPnP"** o **"Universal Plug and Play"** en la configuración avanzada
2. Desactívalo
3. ⚠️ Si tienes una consola de videojuegos que requiere UPnP (PS5, Xbox), puede que afecte al NAT. En ese caso, configura manualmente el reenvío de puertos solo para los puertos específicos necesarios.

---

### ✅ Desactivar acceso remoto al panel de administración

**Por qué:** Si el acceso remoto está activo, cualquiera en internet puede intentar acceder a tu router.

1. Busca: **"Administración remota"**, **"Acceso remoto"** o **"Remote Management"**
2. Asegúrate de que está **Desactivado**
3. La administración solo debe ser posible desde la red local (LAN)

---

### ✅ Verificar protocolo Wi-Fi (WPA3 o WPA2-AES)

**Por qué:** WEP está roto en minutos. TKIP es vulnerable. Solo WPA2-AES y WPA3 son seguros.

1. Busca: **"Seguridad Wi-Fi"**, **"Tipo de autenticación"** o **"Modo de seguridad"**
2. Configura a: **WPA3** (si todos tus dispositivos lo soportan) o **WPA2-AES** (más compatible)
3. Evita: WEP, WPA-TKIP, modo mixto WPA/WPA2 si es posible
4. Cambia la contraseña de la red Wi-Fi si usas la que venía de fábrica: genera 20+ caracteres con Bitwarden

---

## 3. Si el router es del ISP y no permite ciertos cambios

Algunos routers de operador (especialmente Movistar HGU, Vodafone Power Station) tienen opciones limitadas:

**Opciones disponibles:**
1. **Modo bridge + router propio:** Puedes pedir al ISP que pongan el router en modo bridge y conectar un router propio (ej. ASUS RT-AX88U, TP-Link Archer AX73) que tienes tú bajo control total
2. **Aceptar las limitaciones:** Para la mayoría de usuarios, configurar lo disponible (contraseña admin, red de invitados, WPA2-AES) ya es suficiente
3. **Contactar con soporte del ISP:** Algunos cambios (como desactivar acceso remoto que usa el ISP para soporte) pueden negociarse, aunque el ISP puede rechazarlo

**Pasos mínimos si tienes router limitado:**
- Cambiar la contraseña de administrador ✅
- Cambiar el nombre SSID ✅
- Cambiar la contraseña Wi-Fi ✅
- Separar red de invitados ✅
- Desactivar WPS ✅ (casi siempre se puede)
