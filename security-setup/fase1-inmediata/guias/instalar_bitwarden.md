# Instalar y configurar Bitwarden

Bitwarden es un gestor de contraseñas de código abierto, auditado independientemente, con apps para Windows, macOS, Linux, Android e iOS, y extensiones para todos los navegadores principales.

---

## 1. Descarga oficial

- **Aplicación de escritorio Windows:** https://bitwarden.com/download/
  - Descarga el instalador `.exe` para Windows
  - Verifica la firma digital: clic derecho en el .exe → Propiedades → Firmas digitales → debe aparecer "Bitwarden Inc."

- **Web vault (sin instalar):** https://vault.bitwarden.com

---

## 2. Crear una contraseña maestra robusta

La contraseña maestra es la única que necesitas recordar. **No se puede recuperar si la pierdes.**

### Método de las 4 palabras aleatorias (Diceware)
Genera 4 palabras completamente aleatorias y sin relación entre sí. Ejemplo ficticio:

```
tigre-parlamento-cactus-tornillo
```

**Reglas:**
- Mínimo 4 palabras (idealmente 5)
- Deben ser palabras reales pero sin relación lógica entre ellas
- Sepáralas con guiones o espacios
- No uses frases con sentido ("mi-perro-se-llama-rex" es predecible)
- Para generar palabras verdaderamente aleatorias: https://www.eff.org/dice o lanza dados físicos

**Fortaleza resultante:** Una contraseña de 4 palabras aleatorias tiene ~51 bits de entropía. Con 5 palabras supera los 64 bits — prácticamente inviolable con fuerza bruta.

### Qué hacer con la contraseña maestra
- Memorízala
- Escríbela en papel y guárdala en un lugar físico seguro (no en el ordenador)
- **Nunca** la guardes en Bitwarden ni en ningún gestor de contraseñas

---

## 3. Crear cuenta en Bitwarden

1. Ve a https://vault.bitwarden.com/#/register
2. Introduce tu dirección de correo ProtonMail (no Hotmail)
3. Escribe tu contraseña maestra en los dos campos
4. Haz clic en **"Crear cuenta"**
5. Bitwarden enviará un correo de verificación a tu ProtonMail — haz clic en el enlace

---

## 4. Instalar la extensión de navegador

### Chrome
1. Ve a: https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb
2. Verifica: publicado por "Bitwarden Inc.", más de 3 millones de usuarios
3. Haz clic en **"Añadir a Chrome"**
4. Aparecerá el icono del escudo en la barra de herramientas
5. Haz clic en él e inicia sesión con tu cuenta

### Edge
1. Ve a: https://microsoftedge.microsoft.com/addons/detail/bitwarden-free-password-m/jbkfoedolllekgbhcbcoahefnbanhhlh
2. Haz clic en **"Obtener"**
3. Inicia sesión con tu cuenta

### Firefox
1. Ve a: https://addons.mozilla.org/es/firefox/addon/bitwarden-password-manager/
2. Haz clic en **"Añadir a Firefox"**

---

## 5. Importar contraseñas desde Chrome y Edge

### Desde Chrome
1. Inicia sesión en https://vault.bitwarden.com
2. Ve a **Herramientas → Importar datos**
3. En "Formato del archivo" selecciona: **"Chrome (csv)"**
4. Haz clic en **"Elegir archivo"** y selecciona `chrome_passwords_temp.csv`
5. Haz clic en **"Importar datos"**
6. Verifica que el número de entradas importadas coincide

### Desde Edge
1. Repite el proceso anterior pero selecciona el formato **"Microsoft Edge (csv)"**
2. Selecciona `edge_passwords_temp.csv`
3. Importa

> Si aparecen duplicados (mismos sitios en Chrome y Edge), Bitwarden te los mostrará — puedes borrar los duplicados manualmente después.

---

## 6. Configurar bloqueo automático

1. Abre la extensión de Bitwarden en el navegador
2. Ve a **Configuración → Preferencias de la cuenta**
3. En **"Tiempo de espera de la sesión"** selecciona: **15 minutos**
4. En **"Acción de tiempo de espera"** selecciona: **Bloquear** (no Cerrar sesión, para no tener que re-autenticarte cada vez)
5. Activa **"Bloquear con PIN maestro"** si quieres desbloquear con un PIN corto (más cómodo que la contraseña maestra completa)

En la app de escritorio:
1. Ve a **Archivo → Preferencias**
2. Configura el mismo tiempo de bloqueo automático

---

## 7. Activar 2FA dentro de Bitwarden

Proteger el gestor con 2FA es crítico — si alguien obtiene tu contraseña maestra sin 2FA, accede a todo.

1. Inicia sesión en https://vault.bitwarden.com
2. Haz clic en tu nombre de usuario (arriba derecha) → **"Configuración de la cuenta"**
3. Ve a la pestaña **"Seguridad"** → **"Inicio de sesión en dos pasos"**
4. Haz clic en **"Gestionar"** junto a **"Aplicación de autenticación (TOTP)"**
5. Introduce tu contraseña maestra para confirmar
6. Aparecerá un código QR — escanéalo con Aegis (Android) o Raivo (iOS)
7. Introduce el código de 6 dígitos que genera la app para confirmar
8. **Guarda los códigos de recuperación** que Bitwarden te proporciona — imprímelos o guárdalos en papel en un lugar seguro

---

## 8. Gestionar contraseñas débiles o reutilizadas

1. En la app o web vault, ve a **Herramientas → Informe de seguridad**
2. Revisa:
   - **"Contraseñas expuestas"** — contraseñas que aparecen en filtraciones conocidas
   - **"Contraseñas reutilizadas"** — la misma contraseña en varios sitios
   - **"Contraseñas débiles"** — contraseñas cortas o predecibles
3. Para cada entrada problemática: abre el elemento → edita → usa el generador de Bitwarden para crear una contraseña nueva y aleatoria de 20+ caracteres
4. Cambia la contraseña en el sitio correspondiente
5. Prioridad: correos > bancos > brokers > redes sociales > resto

### Usar el generador de contraseñas de Bitwarden
- En la extensión: icono de la varita mágica al crear/editar una contraseña
- Configuración recomendada: 20 caracteres, mayúsculas + minúsculas + números + símbolos
- También puedes generar frases de contraseña: 5 palabras, separadas por guiones

---

## Checklist de configuración completada

- [ ] Cuenta creada con correo ProtonMail
- [ ] Contraseña maestra de 4+ palabras memorizada y en papel seguro
- [ ] Extensión instalada en Chrome y/o Edge
- [ ] Contraseñas de Chrome importadas
- [ ] Contraseñas de Edge importadas
- [ ] Archivos CSV temporales eliminados del equipo
- [ ] Bloqueo automático configurado a 15 minutos
- [ ] 2FA activado con Aegis/Raivo
- [ ] Códigos de recuperación de Bitwarden guardados en papel
- [ ] Contraseñas débiles/reutilizadas marcadas para cambiar
