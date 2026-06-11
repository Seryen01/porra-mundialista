# Sistema de Backup 3-2-1 — Guía Completa

## ¿Qué es la regla 3-2-1?

| Regla | Significado | Tu implementación |
|-------|-------------|-------------------|
| **3** copias de los datos | Original + 2 copias | PC + disco externo + nube |
| **2** tipos de soporte distintos | No dos discos iguales | HDD interno + HDD externo |
| **1** copia fuera de casa | Offsite backup | Proton Drive (nube cifrada) |

**Por qué importa:** Si solo tienes los datos en tu PC y el disco falla (o te roban el portátil), pierdes todo. Con 3-2-1, necesitarías tres fallos simultáneos independientes.

---

## Capa 1 — Backup incremental semanal (disco externo)

Usa el script `setup_backup.ps1` para configurar esto automáticamente.

### Qué disco externo comprar

**Recomendaciones concretas (2025):**

| Modelo | Capacidad | Precio aprox. | Tipo |
|--------|-----------|---------------|------|
| **WD My Passport 2TB** | 2 TB | ~70€ | HDD portátil (bus-powered) |
| **Seagate Backup Plus Slim 2TB** | 2 TB | ~65€ | HDD portátil (bus-powered) |
| **Samsung T7 1TB** (si priorizas velocidad) | 1 TB | ~90€ | SSD portátil |

**Criterios de selección:**
- Mínimo 2 TB (si tienes mucho vídeo, considera 4 TB)
- Alimentación por USB (sin fuente externa para portátil)
- Marca reconocida (WD, Seagate, Toshiba, Samsung)
- Sin software propietario — usa el disco "desnudo" con nuestro script

**Formato del disco:**
- Formatea en **NTFS** (compatibilidad total con Windows)
- Etiqueta el volumen: "BACKUP-[NOMBRE_EQUIPO]"
- No cifres el disco externo con la contraseña del sistema — usa un contenedor VeraCrypt o BitLocker To Go si quieres cifrarlo

---

## Capa 2 — Imagen completa del sistema con Macrium Reflect

Macrium Reflect Free crea una imagen completa de tu disco, incluyendo el sistema operativo. Si el disco principal falla, puedes restaurar todo en un nuevo disco en minutos.

### Instalación

1. Descarga Macrium Reflect Free desde: https://www.macrium.com/reflectfree.aspx
2. Ejecuta el instalador — durante la instalación, **desmarca** las opciones de "Home" o versiones de pago si solo quieres la versión gratuita
3. Abre Macrium Reflect

### Crear primera imagen completa del sistema

1. En la pantalla principal, selecciona **"Create an image of the partition(s) required to backup and restore Windows"**
2. Haz clic en **"Next"**
3. En destino, selecciona tu disco externo (ej: `E:\Imagenes_Sistema\`)
4. Deja la compresión en **"Medium"** (equilibrio velocidad/tamaño)
5. Haz clic en **"Next"** → **"Finish"**
6. El proceso tardará entre 30 minutos y 2 horas según el tamaño de tu disco

### Programar imagen mensual

1. En Macrium Reflect, ve a **"Backup" → "Define a backup plan"**
2. Selecciona tu imagen como base
3. Configura: **Mensual** (primer domingo de cada mes), **02:00**
4. Esquema: **1 imagen completa al mes + 3 incrementales semanales**
5. Retención: mantener las últimas 2 imágenes completas

---

## Capa 3 — Copia en nube con Proton Drive

### Configurar Proton Drive

1. Si tienes cuenta Proton: ve a https://drive.proton.me
2. Descarga la app de Proton Drive para Windows desde: https://proton.me/drive/download
3. Instala y configura la sincronización

### Qué sincronizar con Proton Drive

**Prioridad alta** (sincronizar siempre):
- Documentos importantes: DNI, pasaporte, contratos, escrituras (escaneados en PDF)
- Clave de recuperación de BitLocker
- Backups cifrados de Aegis/Raivo
- Códigos de recuperación 2FA (en Bitwarden, pero también aquí como redundancia)

**Prioridad media:**
- Fotos importantes (no todo el archivo fotográfico — para eso usa el disco externo)
- Proyectos de trabajo activos

**No sincronizar:**
- Software instalado (ocupa espacio innecesariamente, se puede reinstalar)
- Carpeta de Descargas entera
- Archivos temporales

### Plan gratuito de Proton Drive

El plan gratuito incluye 1 GB. Para más espacio:
- **Proton Unlimited** (~10€/mes): 500 GB + ProtonMail, ProtonVPN, Proton Calendar
- Valorar si compensa vs. pagar solo por Proton Drive

---

## Verificar que un backup es restaurable

**Un backup que no has verificado no existe.** Haz esta prueba cada 6 meses:

### Test básico (5 minutos)

1. Conecta el disco externo
2. Navega a la carpeta de backup: `[Disco]:\Backup_[NombreEquipo]\`
3. Verifica que las carpetas principales existen (Escritorio, Documentos, etc.)
4. Abre 3-5 archivos al azar para confirmar que no están corruptos

### Test completo de imagen del sistema (30-60 minutos)

1. Abre Macrium Reflect
2. Ve a **"Restore"** → selecciona la imagen del disco externo
3. Selecciona **"Verify image"** (no restaurar, solo verificar integridad)
4. Macrium calculará el checksum y confirmará si la imagen es íntegra

### Simulacro de restauración (opcional, recomendado anualmente)

En un equipo de prueba o máquina virtual:
1. Arranca desde el USB de rescate de Macrium Reflect
2. Conecta el disco de backup
3. Inicia una restauración completa
4. Verifica que el sistema arranca correctamente

---

## Resumen del sistema 3-2-1 para tu caso

```
Tu portátil (datos originales)
    ↓ cada domingo 23:00 (automático)
Disco externo WD 2TB (copia local)
    ↓ manualmente / mensual
Proton Drive (copia en nube cifrada)
    ↓ mensual (Macrium Reflect)
Imagen completa del sistema en disco externo
```

**Tiempo total de configuración:** 2-3 horas
**Tiempo de mantenimiento:** 0 (automático) + 5 min/semana (conectar disco externo)
