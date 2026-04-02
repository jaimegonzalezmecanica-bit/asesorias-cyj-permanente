# 🔐 ACCESO DESDE CELULAR - SOLUCIONES

## PROBLEMA: "Conexión no segura"

Los túneles gratuitos de Cloudflare a veces son bloqueados por navegadores móviles.

---

## SOLUCIÓN 1: ACEPTAR CERTIFICADO (Más rápido)

### En Chrome/Android:
1. Escribe la URL
2. Aparece: "Tu conexión no es privada"
3. Toca en **"Avanzado"**
4. Toca en **"Continuar hacia [URL] (no seguro)"**

### En Safari/iPhone:
1. Escribe la URL
2. Aparece: "Esta conexión no es privada"
3. Toca en **"Mostrar detalles"**
4. Toca en **"Visitar este sitio web"**

---

## SOLUCIÓN 2: USAR FIREFOX

Firefox es más permisivo con certificados:

1. Descarga Firefox desde Play Store / App Store
2. Abre Firefox
3. Escribe la URL del túnel
4. Debería cargar sin problemas

---

## SOLUCIÓN 3: CREAR TÚNEL TÚ MISMO (Más confiable)

Si tienes el proyecto corriendo en TU computador:

### Windows (PowerShell):
```powershell
# Instalar
winget install Cloudflare.cloudflared

# Crear túnel
cloudflared tunnel --url http://localhost:3000
```

### Mac (Terminal):
```bash
# Instalar
brew install cloudflared

# Crear túnel
cloudflared tunnel --url http://localhost:3000
```

### Linux:
```bash
# Instalar
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Crear túnel
./cloudflared tunnel --url http://localhost:3000
```

---

## SOLUCIÓN 4: USAR NGROK (Requiere cuenta gratis)

### Paso 1: Crear cuenta
1. Ve a https://ngrok.com/
2. Regístrate gratis
3. Ve a "Your Authtoken" y cópialo

### Paso 2: Instalar y configurar
```bash
# Descargar ngrok
# (ver instrucciones en ngrok.com/download)

# Configurar tu token
ngrok config add-authtoken TU_TOKEN_AQUI

# Crear túnel
ngrok http 3000
```

### Paso 3: Usar la URL
Ngrok te dará una URL HTTPS válida que funciona en cualquier dispositivo.

---

## SOLUCIÓN 5: ACCESO POR IP LOCAL (Solo mismo WiFi)

Si tu celular está en el mismo WiFi que tu computador:

### En tu computador, averigua tu IP local:
- **Windows:** Abre CMD → `ipconfig` → Busca "IPv4"
- **Mac/Linux:** Abre Terminal → `ipconfig getifaddr en0` o `hostname -I`

### En tu celular:
1. Abre el navegador
2. Escribe: `http://[TU-IP-LOCAL]:3000`
3. Ejemplo: `http://192.168.1.50:3000`

⚠️ Solo funciona si estás en el MISMO WiFi

---

## RECOMENDACIÓN FINAL

Para uso permanente y sin problemas de certificados:

| Opción | Costo | Beneficio |
|--------|-------|-----------|
| **VPS + Dominio** | ~$5 USD/mes | HTTPS real, URL fija, 24/7 |

Con un VPS y dominio propio, tendrás:
- ✅ Certificado SSL válido (candado verde)
- ✅ URL fija: `app.tucondominio.cl`
- ✅ App disponible 24/7
- ✅ Sin mensajes de "no seguro"
