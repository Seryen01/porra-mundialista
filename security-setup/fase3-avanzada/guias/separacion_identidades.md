# Separación de Identidades Digitales

La separación de identidades evita la contaminación cruzada entre tus actividades: si una cuenta personal es comprometida, no afecta a tus cuentas financieras, y viceversa.

---

## Perfil A — Trabajo / Administración Pública

### Propósito
Acceso a sedes electrónicas, portales del gobierno, trámites laborales y actividades profesionales. Máxima trazabilidad requerida por la ley — no intentar anonimizar.

### Herramientas y configuración

| Elemento | Configuración |
|----------|--------------|
| **Navegador** | Firefox — Perfil "Trabajo" (ver script `crear_perfiles_firefox.ps1`) |
| **Email** | SimpleLogin alias específico → ProtonMail; o email profesional directo |
| **2FA** | YubiKey (FIDO2 donde sea posible) + Aegis como backup |
| **VPN** | NO para trámites con la Administración — las sedes requieren IP española real |
| **Extensiones** | uBlock Origin + Bitwarden únicamente |
| **Contraseñas** | Bitwarden, contraseñas únicas y largas para cada portal |
| **Documentos** | Guardar solo en Proton Drive, nunca en OneDrive |
| **Certificado digital** | Solo en este perfil — no en el navegador Personal |

### Sitios asignados a este perfil
- sede.agenciatributaria.gob.es (AEAT)
- sede.seg-social.es (Seguridad Social)
- sede.gob.es
- cl@ve / miDNI
- dgt.gob.es
- Portal laboral correspondiente a tu puesto
- Correo institucional (si aplica)

### Reglas
- **No** usar este navegador para redes sociales ni compras
- **No** guardar cookies de sesión — cerrar sesión en cada uso
- **No** acceder desde redes Wi-Fi públicas sin VPN (aunque no usas VPN para los trámites, sí para navegar hasta llegar a la sede)
- Certificado digital instalado **solo** en este perfil

---

## Perfil B — Inversiones / Finanzas

### Propósito
Acceso a brokers, bancos y servicios financieros. Máxima seguridad y mínima exposición.

### Herramientas y configuración

| Elemento | Configuración |
|----------|--------------|
| **Navegador** | Firefox — Perfil "Finanzas" (aislado del resto) |
| **Email** | SimpleLogin alias únicos por broker/banco → ProtonMail |
| **2FA** | YubiKey (FIDO2 o TOTP en Yubico Authenticator) — **OBLIGATORIO** |
| **VPN** | Decisión personal: si usas VPN, usa split tunneling para que los brokers vean siempre la misma IP de origen (tu IP doméstica) |
| **Extensiones** | uBlock Origin + Bitwarden ÚNICAMENTE — nada más |
| **Contraseñas** | 20+ caracteres, únicas, generadas por Bitwarden |
| **Sesión** | Cerrar sesión completa después de cada uso — nunca "recordar sesión" |
| **Documentos financieros** | Proton Drive, carpeta "Finanzas" con acceso restringido |

### Sitios asignados a este perfil
- trader.degiro.nl
- interactivebrokers.com / client.interactivebrokers.com
- revolut.com
- Tu banco principal (banca online)
- Declaración de la renta (AEAT — mismo perfil o Trabajo, según preferencia)

### Reglas
- **Nunca** abrir este perfil en redes Wi-Fi públicas
- **Nunca** hacer clic en enlaces de emails supuestamente del banco/broker — ir siempre directamente a la URL conocida
- **Revisar** los movimientos mensualmente — cualquier transacción desconocida, reportar inmediatamente
- **No** instalar extensiones adicionales — cada extensión es una superficie de ataque
- Si recibes un email sospechoso "de tu banco": céralo y abre el navegador manualmente con la URL

### Señales de phishing financiero (para tu perfil específico)
- Emails de "DEGIRO", "IB" o tu banco con urgencia ("tu cuenta será bloqueada en 24h")
- URLs similares pero no exactas: `deg1ro.com`, `interactivbrokers.com`, `bancosantander-online.com`
- Solicitudes de seed phrase, PIN, o contraseña completa vía email o web
- Llamadas telefónicas de "soporte técnico" del broker — los brokers reales no llaman sin previo aviso

---

## Perfil C — Personal

### Propósito
Uso cotidiano, redes sociales, entretenimiento, compras online. Menor criticidad de seguridad, pero separado de los perfiles financiero y laboral.

### Herramientas y configuración

| Elemento | Configuración |
|----------|--------------|
| **Navegador** | Firefox — Perfil "Personal" o Chrome/Edge para mayor compatibilidad |
| **Email** | SimpleLogin aliases para compras y servicios; ProtonMail directo para contacto personal |
| **2FA** | Aegis/Raivo — suficiente para este perfil |
| **VPN** | Mullvad activada para actividad general |
| **Extensiones** | uBlock Origin + Bitwarden + extensiones de entretenimiento |
| **Contenedores** | Multi-Account Containers: "Personal", "Compras", "Redes Sociales" |

### Sitios asignados
- Redes sociales (si las usas)
- Amazon, eBay y otras tiendas online
- Streaming (Netflix, Spotify, YouTube)
- Foros y comunidades

### Reglas
- **No** usar cuentas personales para hacer login en servicios financieros
- **Aceptable:** cookies y sesiones persistentes (menor fricción para uso cotidiano)
- Si instalas extensiones adicionales, verifica reputación y permisos

---

## Resumen de aislamiento

```
                    PERFIL TRABAJO         PERFIL FINANZAS        PERFIL PERSONAL
                   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
Navegador          │ Firefox      │        │ Firefox      │        │ Firefox/    │
                   │ Perfil Work  │        │ Perfil Fin.  │        │ Chrome      │
                   └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
                          │                       │                       │
Email              ProtonMail alias       ProtonMail alias       ProtonMail /
                   trabajo@SL             broker@SL              personal@SL
                          │                       │                       │
2FA                YubiKey FIDO2          YubiKey OBLIGATORIO    Aegis/Raivo
                          │                       │                       │
VPN                NO (trámites)          Opcional               SÍ (Mullvad)
                          │                       │                       │
Contraseñas        Bitwarden              Bitwarden              Bitwarden
                   20+ chars              20+ chars              16+ chars
```

La separación es efectiva solo si respetas las reglas. Un login financiero en el perfil Personal anula todo el aislamiento.
