# Instalar y configurar Signal

Signal es el estándar de oro en mensajería cifrada. Usa el protocolo Signal (E2E) para todos los mensajes, desarrollado por criptógrafos independientes y auditado públicamente. Su código es abierto.

---

## 1. Instalación

### Android
1. Abre Google Play Store
2. Busca: **"Signal - Private Messenger"**
3. Desarrollador: **"Signal Messenger LLC"** — verifica que es el oficial
4. Más de 100 millones de descargas
5. Instala y abre la app

### iOS
1. Abre App Store
2. Busca: **"Signal - Private Messenger"**
3. Desarrollador: **"Signal Messenger LLC"**
4. Instala y abre la app

### Windows (Signal Desktop)
1. Ve a: https://signal.org/es/download/
2. Descarga el instalador para Windows
3. Signal Desktop **requiere la app móvil** para la configuración inicial — instálala primero en el móvil
4. En la app móvil: Ajustes → Dispositivos vinculados → Vincular nuevo dispositivo
5. Escanea el código QR que muestra Signal Desktop en el PC

---

## 2. Configuración recomendada

### Mensajes que desaparecen (Disappearing Messages)
Los mensajes que desaparecen se eliminan automáticamente después del tiempo configurado, en todos los dispositivos.

**Para conversaciones sensibles:**
1. Abre la conversación
2. Toca el nombre del contacto (arriba)
3. Selecciona **"Mensajes que desaparecen"**
4. Configura: **7 días** para conversaciones laborales/financieras

**Para conversaciones personales de menor sensibilidad:**
- 30 días o desactivado — según tu preferencia

**Configurar por defecto para nuevas conversaciones:**
- Ajustes → Privacidad → Mensajes que desaparecen por defecto → 1 semana

### Bloqueo con PIN
1. Ve a Ajustes → Cuenta → Bloqueo del registro
2. Activa **"Bloqueo del registro"**
3. Configura un PIN de 6+ dígitos
4. Este PIN evita que alguien traslade tu cuenta a otro número sin tu autorización

### Biometría y bloqueo de pantalla
1. Ajustes → Privacidad → Bloqueo de pantalla
2. Activa el bloqueo con huella/PIN del móvil

### Notificaciones sin contenido
1. Ajustes → Notificaciones → Mostrar → **"Sin nombre ni mensaje"**
2. Las notificaciones solo mostrarán "Nuevo mensaje de Signal" sin revelar el contenido ni el remitente en la pantalla de bloqueo

### Desactivar vista previa del teclado y sugerencias
1. Ajustes → Privacidad → Teclado en incognito: **Activado**
2. Esto impide que el teclado aprenda de tus mensajes de Signal

### Difuminar rostros en imágenes
Antes de enviar una foto con personas:
1. Selecciona la foto en Signal
2. Toca el icono de edición → **"Difuminar"**
3. Signal puede difuminar automáticamente rostros detectados

---

## 3. Qué conversaciones migrar a Signal y por qué

### Migrar prioritariamente

| Tipo de conversación | Por qué migrar | Plataforma actual problemática |
|---------------------|----------------|-------------------------------|
| Discusiones sobre inversiones/BTC | Información financiera sensible | WhatsApp (Meta), Telegram |
| Conversaciones con asesores o abogados | Confidencialidad profesional | Email sin cifrar, WhatsApp |
| Coordinación familiar sobre herencias, propiedades | Información privada y legal | WhatsApp |
| Cualquier cosa que no dirías en público | Por defecto Signal | WhatsApp, Telegram |

### No necesitas migrar
- Conversaciones puramente sociales e intrascendentes: puedes seguir en WhatsApp
- Grupos grandes de comunidades o asociaciones: difícil migrar a todos
- Cuentas de negocios y soporte al cliente: suelen requerir WhatsApp/Telegram

**Criterio simple:** ¿Estarías cómodo si esta conversación fuera pública? Si no: Signal.

---

## 4. Por qué Telegram no es equivalente a Signal

| Característica | Signal | Telegram |
|---------------|--------|----------|
| Cifrado por defecto | ✅ Siempre E2E | ❌ NO (solo en "chats secretos") |
| Cifrado en grupos | ✅ Siempre | ❌ Nunca (grupos no están E2E) |
| Código abierto (servidor) | ✅ Sí | ❌ No (solo cliente) |
| Almacenamiento en nube | ❌ No (por diseño) | ✅ Sí (todos tus mensajes en los servidores de Telegram) |
| Metadatos protegidos | ✅ Mínimo | ❌ Telegram conoce con quién hablas y cuándo |
| Monetización | Donaciones/nonprofit | Publicidad y suscripciones |

**Telegram NO es privado por defecto.** Sus chats regulares y todos los grupos están almacenados en sus servidores sin cifrado de extremo a extremo, accesibles para Telegram y, potencialmente, para autoridades.

Telegram es útil para comunidades públicas y canales de información. No es adecuado para comunicaciones privadas sensibles.

---

## 5. Cómo configurar Signal como app predeterminada sin perder WhatsApp

Signal puede coexistir con WhatsApp en el mismo teléfono.

**En Android:**
1. Cuando instalas Signal, te preguntará si quieres usarlo como app de SMS predeterminada — puedes decir que sí (reemplazará los SMS normales también) o no
2. WhatsApp y Signal son independientes — tener Signal no afecta a WhatsApp
3. Simplemente usa Signal para las conversaciones que has decidido migrar, y WhatsApp para el resto

**En iOS:**
- Signal e WhatsApp coexisten sin problemas
- Signal puede usarse para SMS en iOS limitadamente
- Abre cada app según la conversación que quieras tener

**Estrategia de transición gradual:**
1. Instala Signal
2. Invita a tus contactos más cercanos a instalarlo también (pueden hacerlo sin dejar WhatsApp)
3. Para conversaciones sensibles, di: "Mejor hablamos por Signal"
4. No es necesario dar ninguna explicación — Signal es una app de mensajería normal
5. Con el tiempo, las conversaciones importantes migran a Signal naturalmente
