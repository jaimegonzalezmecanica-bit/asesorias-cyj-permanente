# 🖥️ GUÍA DETALLADA - Crear Droplet en DigitalOcean

## URL: https://www.digitalocean.com/

---

## PASO 1: CREAR CUENTA

1. Ve a https://www.digitalocean.com/
2. Clic en **"Sign Up"** (esquina superior derecha)
3. Puedes registrarte con:
   - Google (más rápido)
   - GitHub
   - Email tradicional

4. **Verificar email** si usaste email tradicional

---

## PASO 2: AGREGAR MÉTODO DE PAGO

⚠️ **OBLIGATORIO antes de crear el Droplet**

1. Después de iniciar sesión, ve a:
   ```
   Settings → Billing → Payment Methods
   ```

2. Agrega:
   - Tarjeta de crédito o débito
   - O PayPal

3. Recarga mínima: **$5 USD**

---

## PASO 3: CREAR EL DROPLET (Servidor)

### 3.1 Iniciar creación
```
Clic en el botón verde "Create" (esquina superior derecha)
→ Seleccionar "Droplets"
```

---

### 3.2 CONFIGURACIÓN DETALLADA

#### A) REGIÓN (Datacenter)
```
☑️ Seleccionar: New York (NYC1) 
   o San Francisco (SFO3)
   
   💡 Por qué: Más cerca de Chile = menor latencia
```

---

#### B) IMAGEN (Sistema Operativo)
```
☑️ Seleccionar: Ubuntu
☑️ Versión: 24.04 LTS (LTS) x64

   ┌─────────────────────────────────┐
   │  Ubuntu 24.04 LTS (LTS) x64     │
   │  ○ 22.04 LTS (LTS) x64          │
   │  ○ 20.04 LTS (LTS) x64          │
   └─────────────────────────────────┘
   
   💡 LTS = Long Term Support (soporte largo, más estable)
```

---

#### C) TAMAÑO (RAM, CPU, Disco)

**OPCIÓN RECOMENDADA:**
```
☑️ Basic
☑️ Regular (SSD)

   ┌────────────────────────────────────────────────────┐
   │  PREMIUM CPU OPTIONS (ignorar)                     │
   ├────────────────────────────────────────────────────┤
   │  BASIC                                             │
   │  ┌──────────────────────────────────────────────┐  │
   │  │ $4/mes                                       │  │
   │  │ • 512 MB RAM      (suficiente para empezar) │  │
   │  │ • 1 vCPU                                     │  │
   │  │ • 10 GB SSD Disk                             │  │
   │  │ • 500 GB Transfer                            │  │
   │  └──────────────────────────────────────────────┘  │
   │                                                    │
   │  ┌──────────────────────────────────────────────┐  │
   │  │ $6/mes  ← MEJOR OPCIÓN si hay presupuesto    │  │
   │  │ • 1 GB RAM        (mejor rendimiento)        │  │
   │  │ • 1 vCPU                                     │  │
   │  │ • 10 GB SSD Disk                             │  │
   │  │ • 1000 GB Transfer                           │  │
   │  └──────────────────────────────────────────────┘  │
   └────────────────────────────────────────────────────┘

💡 RECOMENDACIÓN: El de $6/mes si es posible, mejor rendimiento
```

---

#### D) AUTENTICACIÓN (MUY IMPORTANTE)

**OPCIÓN A: SSH Key (MÁS SEGURA - RECOMENDADA)**

```
☑️ SSH Key

   Pasos:
   1. Clic en "New SSH Key"
   2. Pegar tu clave pública SSH
   
   Si NO tienes clave SSH, crearla en tu computador:
   
   ┌─────────────────────────────────────────────────────┐
   │  En tu computador (Mac/Linux/Windows PowerShell):  │
   │                                                     │
   │  ssh-keygen -t ed25519 -C "tu-email@email.com"     │
   │                                                     │
   │  Luego copiar el contenido:                        │
   │  cat ~/.ssh/id_ed25519.pub                         │
   │                                                     │
   │  Pegar ese texto en DigitalOcean                   │
   └─────────────────────────────────────────────────────┘
```

**OPCIÓN B: Password (MÁS FÁCIL PARA PRINCIPIANTES)**

```
☑️ Password

   ┌─────────────────────────────────────────────────────┐
   │  Crear contraseña segura:                           │
   │  • Mínimo 8 caracteres                             │
   │  • Incluir mayúsculas, minúsculas, números         │
   │  • Ejemplo: Cond0min10Laguna!2025                  │
   │                                                     │
   │  ⚠️ GUARDA ESTA CONTRASEÑA - La necesitarás        │
   └─────────────────────────────────────────────────────┘
```

💡 **MI RECOMENDACIÓN:** Si es tu primera vez, usa **Password** y anota la contraseña bien.

---

#### E) HOSTNAME (Nombre del servidor)

```
Hostname: condominio-laguna
   
   ┌─────────────────────────────────┐
   │  condominio-laguna              │
   └─────────────────────────────────┘
   
   💡 Puedes usar cualquier nombre, pero usa algo 
      identificable como "condominio-laguna" o "app-laguna"
```

---

#### F) OPCIONES ADICIONALES (OPCIONAL)

```
☐ Add improved metrics monitoring and alerting (free)
   → Puedes activarlo, es gratis y útil

☐ Add automated backups ($0.08/week)
   → NO necesario por ahora, haremos backups manuales
```

---

## PASO 4: CREAR EL DROPLET

1. Revisa el resumen final:
   ```
   ┌─────────────────────────────────────────────────────┐
   │  Summary:                                          │
   │  • Region: New York (NYC1)                         │
   │  • Image: Ubuntu 24.04 LTS x64                     │
   │  • Size: Basic - $6/mes                            │
   │  • Auth: Password                                  │
   │  • Hostname: condominio-laguna                     │
   │                                                    │
   │  Monthly cost: $6                                  │
   │                                                    │
   │  [Create Droplet]  ← CLIC AQUÍ                     │
   └─────────────────────────────────────────────────────┘
   ```

2. Espera 1-2 minutos mientras se crea

---

## PASO 5: ANOTAR LA IP DEL SERVIDOR

Una vez creado, verás algo como:

```
┌─────────────────────────────────────────────────────────────┐
│  condominio-laguna                                          │
│  ─────────────────                                          │
│  📍 IPv4: 164.90.123.45     ← ANOTA ESTA IP               │
│  📍 IPv6: 2604:a880:xxxx::xxxx                             │
│                                                             │
│  Status: Running ✓                                          │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE: Guarda la IP IPv4 (los 4 números separados por puntos)**

---

## PASO 6: PROBAR CONEXIÓN SSH

### Si usaste PASSWORD:

```bash
# En tu computador (terminal o PowerShell):
ssh root@164.90.123.45

# Te pedirá la contraseña que creaste
# La escribes (no se ve mientras escribes) y presionas Enter
```

### Si usaste SSH KEY:

```bash
ssh root@164.90.123.45

# Debería conectar automáticamente sin pedir contraseña
```

---

## ✅ CHECKLIST FINAL

| Item | Valor |
|------|-------|
| IP del VPS | `_______________` |
| Usuario | `root` |
| Contraseña | `_______________` |
| Región | New York / San Francisco |
| Sistema | Ubuntu 24.04 LTS |

---

## 🆘 PROBLEMAS COMUNES

### "No me deja pagar con mi tarjeta"
- Intenta con otra tarjeta
- Usa PayPal si está disponible
- Verifica que tu tarjeta tenga compras internacionales activadas

### "No puedo conectar por SSH"
```bash
# Verifica que el servidor está corriendo en DigitalOcean
# Intenta con:
ssh -o StrictHostKeyChecking=no root@TU-IP

# Si usas SSH Key en Windows:
ssh -i C:\Users\TuUsuario\.ssh\id_ed25519 root@TU-IP
```

### "Me dice Connection refused"
- Verifica que el Droplet esté "Running" en DigitalOcean
- Espera 2-3 minutos después de crearlo

---

## 📸 CAPTURAS DE REFERENCIA

### Pantalla de creación del Droplet:
```
┌─────────────────────────────────────────────────────────────────┐
│  Create → Droplets                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Choose Region                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ ☑️ New York     │  │ ○ San Francisco  │                    │
│  │    NYC1         │  │    SFO3          │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│  Choose Image                                                   │
│  ┌──────────────────────────────────────────┐                  │
│  │ ☑️ Ubuntu 24.04 LTS (LTS) x64           │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  Choose Size                                                    │
│  ┌──────────────────────────────────────────┐                  │
│  │ Basic                                     │                  │
│  │ ☑️ $6/mes - 1GB RAM, 1 vCPU, 10GB SSD   │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  Authentication                                                 │
│  │ ○ SSH Key    ☑️ Password                 │                  │
│  │   [Crear contraseña segura]              │                  │
│                                                                 │
│  Hostname                                                       │
│  │ condominio-laguna                        │                  │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Create Droplet  │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

**Cuando tengas tu IP anotada, avísame y continuamos con el dominio y despliegue.**
