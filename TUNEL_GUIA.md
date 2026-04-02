# 🌐 ACCESO PÚBLICO GRATIS - Túnel Cloudflare

Esta guía te permite acceder a tu aplicación desde **cualquier dispositivo** (celular, tablet, otro computador) sin contratar un servidor.

---

## ✅ VENTAJAS

| Ventaja | Descripción |
|---------|-------------|
| 💰 **Gratis** | Sin costo mensual |
| 🔒 **HTTPS** | Conexión segura automática |
| 📱 **Universal** | Funciona desde cualquier dispositivo |
| ⚡ **Rápido** | Listo en 2 minutos |

---

## ⚠️ IMPORTANTE

- El túnel funciona **mientras tu computador esté encendido**
- Si apagas el computador, la app no estará disponible
- Ideal para **demostraciones** y **pruebas**
- Para uso permanente, después puedes contratar un VPS

---

## 📋 PASO 1: INSTALAR CLOUDFLARED

### En MAC (macOS):

```bash
# Abre Terminal y ejecuta:
brew install cloudflared
```

### En LINUX:

```bash
# Ejecuta estos comandos:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### En WINDOWS:

**Opción A - PowerShell (como Administrador):**
```powershell
winget install Cloudflare.cloudflared
```

**Opción B - Descarga manual:**
1. Ve a: https://github.com/cloudflare/cloudflared/releases
2. Descarga: `cloudflared-windows-amd64.exe`
3. Renómbralo a `cloudflared.exe`
4. Muévelo a una carpeta en tu PATH

---

## 📋 PASO 2: CREAR EL TÚNEL

### Opción A - Comando simple:

```bash
cloudflared tunnel --url http://localhost:3000
```

### Opción B - Usando el script:

```bash
cd /home/z/my-project
chmod +x scripts/start-tunnel.sh
./scripts/start-tunnel.sh
```

---

## 📋 PASO 3: OBTENER TU URL PÚBLICA

Después de ejecutar el comando, verás algo como:

```
2025/01/15 10:30:45 INFO  Your quick Tunnel has been created!
2025/01/15 10:30:45 INFO  Visit it at:
2025/01/15 10:30:45 INFO  https://random-name-xyz-abc.trycloudflare.com
```

**⚡ COPIA ESA URL** (en este ejemplo: `https://random-name-xyz-abc.trycloudflare.com`)

---

## 📋 PASO 4: PROBAR ACCESO

### Desde tu computador:
```
Abre el navegador con la URL que te dio cloudflared
```

### Desde otro dispositivo:
```
1. Abre el navegador en tu celular/tablet
2. Escribe la URL completa (incluyendo https://)
3. Deberías ver la pantalla de login
```

---

## 🔑 CREDENCIALES DE ACCESO

Para entrar a la aplicación usa:

| Usuario | Contraseña |
|---------|------------|
| `admin@condominio.com` | `Admin123!` |
| `supervisor@condominio.com` | `Super123!` |

---

## 📱 EJEMPLO DE USO

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   TU COMPUTADOR                    CUALQUIER DISPOSITIVO       │
│   ┌─────────────┐                  ┌─────────────────────────┐ │
│   │ App Next.js  │                  │ Celular / Tablet / PC  │ │
│   │ puerto 3000  │                  │                         │ │
│   └──────┬──────┘                  │  https://xxx.try...    │ │
│          │                         │          │              │ │
│          ▼                         │          ▼              │ │
│   ┌─────────────┐                  │  ┌─────────────────┐    │ │
│   │ cloudflared │══════════════════│  │ App Condominio  │    │ │
│   │   (túnel)   │    INTERNET      │  │   funciona! ✓   │    │ │
│   └─────────────┘                  │  └─────────────────┘    │ │
│                                    └─────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 MANTENER EL TÚNEL ACTIVO

El túnel se cierra si:
- Presionas `Ctrl+C` en la terminal
- Cierres la terminal
- Apagas el computador

Para volver a activarlo, simplemente ejecuta el comando otra vez.

---

## 💡 TIPS

### Túnel con URL personalizada:

```bash
# Si tienes un dominio en Cloudflare:
cloudflared tunnel --hostname app.tudominio.com --url http://localhost:3000
```

### Ver logs del túnel:

```bash
cloudflared tunnel --url http://localhost:3000 --loglevel debug
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "No puedo acceder desde otro dispositivo"
- Verifica que la URL tenga `https://` al inicio
- Espera unos segundos, a veces tarda en propagarse

### "La URL no funciona"
- Verifica que tu app esté corriendo en puerto 3000
- Reinicia el túnel (Ctrl+C y ejecuta de nuevo)

### "Error de conexión"
- Verifica tu conexión a internet
- El túnel requiere internet para funcionar

---

## 📊 COMPARATIVA

| Opción | Costo | Disponibilidad | Ideal para |
|--------|-------|----------------|------------|
| **Túnel Cloudflare** | Gratis | Solo cuando PC encendido | Demos, pruebas |
| **VPS DigitalOcean** | $4-6/mes | 24/7 | Producción |

---

## ✅ CHECKLIST

- [ ] Instalé cloudflared
- [ ] Ejecuté el comando del túnel
- [ ] Obtuve mi URL pública
- [ ] Probé desde mi computador
- [ ] Probé desde mi celular
- [ ] Probé desde otro WiFi/datos móviles

---

**¿Todo funciona? ¡Genial! Ahora puedes usar la app desde cualquier lugar.**
