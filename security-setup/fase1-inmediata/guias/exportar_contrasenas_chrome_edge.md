# Exportar contraseñas de Chrome y Edge antes de migrar a Bitwarden

> **Hazlo ANTES de ejecutar `disable_browser_passwords.ps1`**

---

## Google Chrome

### Paso 1 — Abrir el gestor de contraseñas
1. Abre Chrome
2. En la barra de direcciones escribe: `chrome://password-manager/passwords`
3. Pulsa Enter

### Paso 2 — Exportar todas las contraseñas
1. En la parte superior derecha verás un icono de tres puntos verticales (⋮) junto al título "Contraseñas guardadas"
2. Haz clic en ese icono
3. Selecciona **"Exportar contraseñas"**
4. Chrome te pedirá confirmación — haz clic en **"Exportar contraseñas"** de nuevo
5. Windows te pedirá tu contraseña de usuario o PIN para confirmar la exportación
6. Elige dónde guardar el archivo. **Importante:** guárdalo temporalmente en el Escritorio con el nombre `chrome_passwords_temp.csv`
7. Haz clic en **Guardar**

### Paso 3 — Verificar la exportación
1. Abre el archivo `.csv` con el Bloc de notas (no con Excel, para evitar problemas de formato)
2. Verifica que contiene las columnas: `name,url,username,password`
3. Cuenta que el número de entradas corresponde aproximadamente con las que recuerdas tener

---

## Microsoft Edge

### Paso 1 — Abrir el gestor de contraseñas
1. Abre Edge
2. En la barra de direcciones escribe: `edge://settings/passwords`
3. Pulsa Enter

### Paso 2 — Exportar todas las contraseñas
1. Busca el apartado **"Contraseñas guardadas"**
2. A la derecha verás tres puntos (⋯) — haz clic en ellos
3. Selecciona **"Exportar contraseñas"**
4. En el menú desplegable que aparece, vuelve a seleccionar **"Exportar contraseñas"**
5. Windows solicitará tu contraseña o PIN de Windows Hello para autorizar
6. Guarda el archivo en el Escritorio como `edge_passwords_temp.csv`

### Paso 3 — Verificar la exportación
1. Abre el CSV con el Bloc de notas
2. Verifica que el formato es correcto: `name,url,username,password`

---

## Importar a Bitwarden

Una vez exportados, sigue los pasos de la guía `instalar_bitwarden.md` para importar ambos archivos a Bitwarden.

---

## Eliminar los archivos temporales

**Después de confirmar que las contraseñas están correctamente importadas en Bitwarden:**

1. Borra `chrome_passwords_temp.csv` del Escritorio
2. Borra `edge_passwords_temp.csv` del Escritorio
3. Haz clic derecho en la Papelera de reciclaje → **"Vaciar la Papelera de reciclaje"**

> ⚠️ Estos archivos CSV contienen TODAS tus contraseñas en texto plano. No los dejes en el equipo más tiempo del estrictamente necesario. No los envíes por correo ni los subas a ninguna nube.
