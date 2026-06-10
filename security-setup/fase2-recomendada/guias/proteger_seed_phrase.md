# Proteger la Seed Phrase de tu Hardware Wallet (Jade Wallet)

## Por qué la seed phrase ES el activo real

Tu hardware wallet (Jade) es solo un dispositivo para firmar transacciones de forma segura. El activo real es la **seed phrase** (frase semilla): las 12 o 24 palabras generadas al configurar el dispositivo.

**Con la seed phrase puedes:**
- Recuperar todos tus BTC en cualquier hardware wallet compatible (Ledger, Trezor, Coldcard, etc.)
- Recuperar en software wallets (Electrum, Sparrow)
- Acceder aunque el Jade se rompa, pierda o robe

**Sin la seed phrase y con el Jade dañado:** Los fondos son irrecuperables para siempre.

**Conclusión:** Quien tenga tu seed phrase tiene tus BTC. Punto.

---

## Lo que NUNCA debes hacer con la seed phrase

| ❌ Acción prohibida | Por qué |
|--------------------|---------|
| Fotografiarla con el móvil | Las fotos se sincronizan con la nube (iCloud, Google Photos) automáticamente |
| Guardarla en Google Drive, OneDrive, Dropbox | Almacenamiento de terceros, no bajo tu control |
| Enviarla por email o WhatsApp | Los servidores de email/mensajería la almacenan |
| Escribirla en una app de notas (Apple Notes, OneNote, etc.) | Sincronizada con la nube |
| Guardarla en Bitwarden u otro gestor de contraseñas | Si comprometen tu Bitwarden, pierdes todo |
| Escribirla en el ordenador en cualquier archivo | Ransomware, keyloggers, backups en nube automáticos |
| Decírsela a nadie | Ingeniería social, testigos no invitados |
| Introducirla en ningún sitio web | Phishing, sitios falsos que la roban |

**Regla de oro:** La seed phrase solo existe en papel (o metal) en el mundo físico.

---

## Cómo almacenarla correctamente

### Opción básica — Papel (mínimo recomendado)

**Materiales necesarios:**
- 2 hojas de papel de buena calidad (o cartulina)
- Bolígrafo permanente (no rotulador que se borre)
- 2 sobres opacos y resistentes
- Cinta adhesiva para sellar

**Proceso:**
1. Desconecta el ordenador de internet (o usa una habitación donde no haya cámaras)
2. Escribe las palabras a mano, numeradas, con letra clara
3. Incluye también: número de palabras total (12 o 24), derivation path si es no estándar, y nombre del wallet
4. Sella el sobre
5. Escribe en el exterior: "Documentos importantes — No abrir" (no menciones Bitcoin ni seed)
6. Crea la segunda copia de la misma manera

**Dónde guardar las dos copias:**
- **Copia 1:** En casa, en un lugar seguro pero accesible para ti (cajón con llave, caja fuerte, carpeta de documentos importantes)
- **Copia 2:** En una ubicación física DIFERENTE: casa de un familiar de confianza, caja de seguridad bancaria, segunda residencia

**Por qué dos ubicaciones:** Un incendio, inundación o robo en una ubicación no debería afectar a la otra.

---

### Opción avanzada — Planchas de metal (resistencia al fuego y agua)

El papel se destruye a ~230°C. Un incendio doméstico supera fácilmente los 600°C. El metal aguanta.

**Productos recomendados:**

| Producto | Material | Precio aprox. | Características |
|----------|----------|---------------|-----------------|
| **Cryptosteel Capsule** | Acero inoxidable 304 | ~80€ | Aguanta hasta 1400°C, resistente al agua |
| **Bilodeau Seeds** | Acero inoxidable | ~40€ | Opción más económica, buena calidad |
| **Coldbit Steel** | Acero inoxidable | ~50€ | Grabado manual con punzón |
| **Keystone Tablet** | Aleación de titanio | ~60€ | El más resistente (titanio funde a 1670°C) |

**Importante sobre el Cryptosteel:** Usa letras individuales deslizables, no necesitas grabar. Puedes reconfigurar si cometes errores. Cada palabra del BIP-39 se puede identificar con las 4 primeras letras — solo necesitas grabar/colocar esas 4 letras por palabra.

**Abreviaturas BIP-39:** En el estándar de las 2048 palabras de Bitcoin, las primeras 4 letras de cada palabra son únicas — no hay dos palabras BIP-39 con el mismo inicio de 4 letras. Esto significa que `ABAN` es suficiente para `abandon`, `ABSO` para `absorb`, etc.

---

## Verificar periódicamente la seed phrase

Cada 6-12 meses, verifica que:
1. El papel/metal sigue siendo legible (la tinta no se ha borrado, el metal no está oxidado)
2. Las palabras están en el orden correcto y son legibles
3. El sobre/contenedor no ha sido manipulado

**Cómo verificar sin comprometer la seguridad:**
- Abre el sobre en privado, sin cámaras ni personas alrededor
- Lee las palabras mentalmente confirmando que son 12 o 24 palabras válidas del BIP-39
- **No las introduzcas en ningún dispositivo** para "verificar" — no es necesario ni seguro
- Cierra y sella el sobre de nuevo

**Test real de recuperación (opcional, máximo cada 2-3 años):**
Si quieres confirmar que la seed phrase funciona:
1. Usa un hardware wallet diferente (pide uno prestado o usa Coldcard en modo air-gapped)
2. Introduce la seed phrase en el nuevo dispositivo
3. Verifica que la dirección de BTC derivada coincide con la de tu Jade
4. **Borra el dispositivo de prueba después** — nunca dejes tu seed en un dispositivo que no es tuyo

---

## Consideraciones adicionales para tu perfil

- **Testamento:** Considera dejar instrucciones sobre cómo acceder a tus BTC para tus herederos (sin revelar la seed phrase en el documento público del testamento — usa un sobre sellado que el notario custodie)
- **Passphrase adicional (25ª palabra):** Si usas una passphrase adicional en Jade, esta debe almacenarse por separado de la seed phrase — si alguien encuentra la seed sin la passphrase, no puede acceder a los fondos. Pero si olvidas la passphrase, tampoco puedes tú.
- **Cantidades grandes:** Si almacenas más de 10.000€ en BTC, considera usar una billetera multi-sig (requiere varias seed phrases para firmar)
