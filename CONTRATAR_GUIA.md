# 🛒 GUÍA DE COMPRA - Infraestructura para Condominio Laguna Norte

Esta guía te ayudará a contratar todo lo necesario para que tu aplicación funcione desde cualquier dispositivo (celular, computador, tablet) con cualquier conexión (WiFi, datos móviles).

---

## 📊 RESUMEN DE COSTOS

| Item | Proveedor Recomendado | Costo Mensual | Costo Anual |
|------|----------------------|---------------|-------------|
| VPS (Servidor) | DigitalOcean | $4 USD | $48 USD |
| Dominio .cl | NIC.cl | - | ~$15.000 CLP |
| **TOTAL** | | **$4 USD/mes** | **~$65.000 CLP/año** |

---

## PASO 1: CONTRATAR VPS (Servidor Virtual)

### Opción A: DigitalOcean (RECOMENDADO - Más fácil)

**URL:** https://www.digitalocean.com/

1. **Crear cuenta:**
   - Ve a https://www.digitalocean.com/
   - Clic en "Sign Up"
   - Puedes usar Google o GitHub para registrarte más rápido

2. **Agregar método de pago:**
   - Ve a Settings → Billing
   - Agrega tarjeta de crédito/débito
   - Mínimo $5 USD de recarga inicial

3. **Crear el servidor (Droplet):**
   - Clic en "Create" → "Droplets"
   - Configuración:
     ```
     Region: New York o San Francisco (más cerca de Chile)
     Image: Ubuntu 24.04 LTS (x64)
     Size: Basic → $4/mes (suficiente para empezar)
     Authentication: SSH Key (más seguro) o Password
     
     ⚠️ IMPORTANTE: Si eliges SSH Key, guarda el archivo .pem
     ```

4. **Guardar la IP del servidor:**
   - Al terminar, te mostrará algo como: `164.90.123.45`
   - **ANOTA ESTA IP** (la necesitarás después)

### Opción B: Hetzner (MÁS BARATO)

**URL:** https://www.hetzner.com/

1. Crear cuenta en https://www.hetzner.com/
2. Ir a "Cloud" → "Add Server"
3. Configuración:
   ```
   Location: Falkenstein (Alemania) o Ashburn (USA)
   Type: CX22 - $4.15 EUR/mes
   Image: Ubuntu 24.04
   ```
4. Crear y anotar la IP

### Opción C: Linode (Alternativa)

**URL:** https://www.linode.com/

- Similar a DigitalOcean
- Plan Nanode: $5 USD/mes

---

## PASO 2: CONTRATAR DOMINIO

### Para dominio .cl (Chile)

**URL:** https://www.nic.cl/

1. Ve a https://www.nic.cl/
2. Busca tu dominio disponible:
   ```
   Ejemplos:
   - lagunanorte.cl
   - condominiolaguna.cl
   - admin-lagunanorte.cl
   ```
3. Si está disponible, agrégalo al carrito
4. Crea cuenta y paga (~$15.000 CLP/año)
5. **Anota el dominio elegido**

### Para dominio .com (Internacional)

**URL:** https://www.namecheap.com/

1. Busca dominio disponible
2. Cuesta ~$10 USD/año
3. Más opciones: `lagunanorte.com`, `condominio-app.com`

---

## PASO 3: CONFIGURAR DNS (Conectar Dominio con Servidor)

### Si compraste en NIC.cl:

1. Entra a tu cuenta en https://clientes.nic.cl/
2. Ve a "Mis Dominios" → Tu dominio → "Modificar"
3. En "Servidores de Nombre" (DNS), selecciona "Usar los servidores de NIC Chile"
4. Agregar registros DNS:

```
Tipo: A
Nombre: @ (o dejar vacío)
Valor: [IP DE TU VPS]
Ejemplo: 164.90.123.45

Tipo: A  
Nombre: app
Valor: [IP DE TU VPS]
Ejemplo: 164.90.123.45
```

Esto hará que:
- `tudominio.cl` apunte a tu servidor
- `app.tudominio.cl` apunte a tu servidor

### Si compraste en Namecheap:

1. Entra a tu cuenta
2. Domain List → Tu dominio → Manage
3. Avanced DNS → Add New Record:
```
Type: A Record
Host: @
Value: [IP DE TU VPS]
TTL: Automatic

Type: A Record
Host: app
Value: [IP DE TU VPS]
TTL: Automatic
```

⏱️ **Esperar 1-24 horas** para que los cambios se propaguen.

---

## PASO 4: VERIFICAR QUE TODO ESTÁ LISTO

Antes de desplegar la app, verifica:

### 4.1 Probar conexión al VPS

```bash
# En tu computador, conecta al servidor:
ssh root@[IP-DE-TU-VPS]

# Ejemplo:
ssh root@164.90.123.45

# Si usaste SSH Key:
ssh -i ruta/a/tu/llave.pem root@164.90.123.45
```

### 4.2 Verificar DNS propagado

```bash
# En tu computador:
ping tudominio.cl

# Debe responder con la IP de tu VPS
```

O visita: https://dnschecker.org/ y escribe tu dominio

---

## ✅ CHECKLIST ANTES DE CONTINUAR

- [ ] Tengo la IP de mi VPS: `_______________`
- [ ] Tengo acceso SSH al VPS (puedo conectarme)
- [ ] Tengo mi dominio: `_______________`
- [ ] El dominio apunta a mi VPS (DNS configurado)
- [ ] El ping a mi dominio responde con la IP del VPS

---

## 📱 QUÉ OBTENDRÁS AL TERMINAR

Una vez completados estos pasos y desplegada la app:

| Desde | URL | Funciona? |
|-------|-----|-----------|
| Oficina (WiFi) | https://app.tudominio.cl | ✅ |
| Casa (WiFi) | https://app.tudominio.cl | ✅ |
| Celular (datos móviles) | https://app.tudominio.cl | ✅ |
| Tablet (cualquier WiFi) | https://app.tudominio.cl | ✅ |
| Notebook en terreno | https://app.tudominio.cl | ✅ |

---

## 🆘 PROBLEMAS COMUNES

### "No puedo pagar con mi tarjeta"
- Usa PayPal si está disponible
- Algunas tarjetas chilenas son rechazadas, intenta con otra
- Prueba Hetzner que acepta más métodos de pago

### "El dominio que quiero está ocupado"
- Prueba variantes: `admin-laguna.cl`, `sistema-laguna.cl`
- Considera `.com` o `.net`

### "No puedo conectarme por SSH"
- Verifica que el firewall del VPS permita puerto 22
- Si usas SSH Key, verifica permisos: `chmod 600 tu-llave.pem`

---

## 💰 ESTIMACIÓN FINAL

| Concepto | Costo |
|----------|-------|
| VPS (12 meses) | $48 USD ≈ $45.000 CLP |
| Dominio .cl (1 año) | $15.000 CLP |
| **TOTAL PRIMER AÑO** | **~$60.000 CLP** |

---

**¿Listo para continuar? Cuando tengas tu VPS y dominio, avísame y te guío en el despliegue.**
