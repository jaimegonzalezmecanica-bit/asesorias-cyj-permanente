# 🚀 GUÍA DE DESPLIEGUE EN PRODUCCIÓN - GRATIS

## Sistema de Gestión Integral para Condominios - CyJ

---

## 📋 RESUMEN

Esta guía te llevará paso a paso para desplegar el sistema en **Vercel** de forma **100% GRATUITA**.

**Tiempo estimado:** 30-45 minutos

**Requisitos:**
- Cuenta de GitHub (gratis)
- Cuenta de Vercel (gratis)
- Email para verificaciones

---

## 🎯 PASO 1: CREAR CUENTA EN GITHUB (Si no tienes)

1. Ve a https://github.com
2. Click en **"Sign up"** (esquina superior derecha)
3. Ingresa tu email, crea contraseña y nombre de usuario
4. Verifica tu email
5. ✅ **¡Listo! Ya tienes GitHub gratis**

---

## 🎯 PASO 2: CREAR CUENTA EN VERCEL

1. Ve a https://vercel.com
2. Click en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel para acceder a tu GitHub
5. ✅ **¡Listo! Ya tienes Vercel conectado con GitHub**

---

## 🎯 PASO 3: SUBIR EL PROYECTO A GITHUB

### Opción A: Si tienes el proyecto localmente

1. **Crear un nuevo repositorio en GitHub:**
   - Ve a https://github.com/new
   - Nombre: `cyj-condominios`
   - Descripción: `Sistema de Gestión para Condominios`
   - Selecciona **Private** (para que solo tú lo veas)
   - Click en **"Create repository"**

2. **Subir el código:**
   ```bash
   # En tu terminal, dentro del proyecto
   git init
   git add .
   git commit -m "Sistema CyJ Condominios - Versión inicial"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/cyj-condominios.git
   git push -u origin main
   ```

### Opción B: Descargar proyecto y subir

1. Descarga el proyecto completo (ZIP)
2. Descomprime en tu computadora
3. Sigue los pasos de la Opción A

---

## 🎯 PASO 4: CREAR BASE DE DATOS GRATUITA (Neon PostgreSQL)

**Neon ofrece PostgreSQL gratis para siempre:**

1. Ve a https://neon.tech
2. Click en **"Sign up"**
3. Regístrate con GitHub (más fácil)
4. Click en **"Create a project"**
5. Configura:
   - **Project name:** `cyj-database`
   - **Database name:** `cyj_condominios`
   - **Region:** `US East (Ohio)` o la más cercana
6. Click en **"Create project"**

7. **¡IMPORTANTE!** Copia la cadena de conexión:
   - Busca **"Connection string"** 
   - Selecciona **"Pooled connection"**
   - Copia la URL (se ve así):
   ```
   postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/cyj_condominios?sslmode=require
   ```
   
8. ✅ **Guarda esta URL, la necesitarás en el Paso 5**

---

## 🎯 PASO 5: DESPLEGAR EN VERCEL

### 5.1 Crear el proyecto en Vercel

1. Ve a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio `cyj-condominios`
4. Click en **"Import"**

### 5.2 Configurar variables de entorno

**ANTES de hacer deploy, configura las variables:**

1. En la pantalla de configuración, busca **"Environment Variables"**
2. Agrega las siguientes variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La URL de Neon que copiaste en el Paso 4 |
| `NEXTAUTH_SECRET` | Un secreto aleatorio (generar abajo) |
| `NEXTAUTH_URL` | `https://TU-PROYECTO.vercel.app` (tu dominio) |

**Para generar NEXTAUTH_SECRET:**
```bash
# En tu terminal, ejecuta:
openssl rand -base64 32
```
O usa este valor de ejemplo (cámbialo en producción):
```
TuSecretoSuperSeguro1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

### 5.3 Configurar Build Settings

En **"Build and Output Settings":**
- **Framework Preset:** Next.js
- **Build Command:** `prisma generate && next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 5.4 Desplegar

1. Click en **"Deploy"**
2. Espera 2-5 minutos mientras se construye
3. ✅ **¡Cuando veas "Congratulations!", tu sitio está listo!**

---

## 🎯 PASO 6: INICIALIZAR LA BASE DE DATOS

### 6.1 Ejecutar migraciones

Vercel ejecutará automáticamente `prisma generate` durante el build, pero necesitas crear las tablas:

**Opción A: Desde Vercel CLI (recomendado)**

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Conecta tu proyecto:
   ```bash
   vercel link
   ```

3. Descarga las variables de entorno:
   ```bash
   vercel env pull .env.local
   ```

4. Ejecuta la migración:
   ```bash
   npx prisma db push
   ```

**Opción B: Desde Neon Console**

1. Ve a tu proyecto en Neon
2. Click en **"SQL Editor"**
3. Ejecuta el siguiente script:
   - Abre el archivo `prisma/migrations/init.sql` (necesitas generarlo primero)
   - O usa Prisma desde tu computadora local con la URL de producción

**Opción C: Crear API de inicialización (más fácil)**

Crea un archivo `src/app/api/init-db/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Crear usuario admin inicial
    const bcrypt = await import('bcrypt')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const user = await db.user.upsert({
      where: { email: 'admin@cyjcondominios.cl' },
      update: {},
      create: {
        email: 'admin@cyjcondominios.cl',
        nombre: 'Administrador',
        password: hashedPassword,
        rol: 'admin',
        activo: true,
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada',
      adminCreated: user.email 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
```

Luego visita: `https://TU-PROYECTO.vercel.app/api/init-db`

---

## 🎯 PASO 7: VERIFICAR EL DESPLIEGUE

1. **Accede a tu sitio:**
   - `https://TU-PROYECTO.vercel.app`

2. **Inicia sesión con las credenciales:**
   - Email: `admin@cyjcondominios.cl`
   - Password: `admin123`
   
3. **Cambia la contraseña inmediatamente**

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Dominio Personalizado (Opcional)

1. Ve a tu proyecto en Vercel
2. Click en **"Settings"** → **"Domains"**
3. Agrega tu dominio (ej: `condominios.tuempresa.cl`)
4. Configura los DNS según las instrucciones

### Variables de Entorno Adicionales

Para agregar más variables después del despliegue:

1. Ve a **"Settings"** → **"Environment Variables"**
2. Agrega las variables necesarias
3. **Redespliega** el proyecto para que surtan efecto

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate que Neon no esté en "sleep" (la versión gratis se duerme)
- Revisa que SSL esté habilitado (`?sslmode=require`)

### Error: "NextAuth configuration error"
- Verifica `NEXTAUTH_URL` tenga el dominio correcto
- Verifica `NEXTAUTH_SECRET` esté configurado

### Error: "Build failed"
- Revisa los logs en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Ejecuta `npm run build` localmente para verificar

### La página carga pero no hay datos
- Ejecuta la inicialización de la base de datos (Paso 6)
- Verifica que las tablas se crearon correctamente

---

## 💰 COSTOS ESTIMADOS

| Servicio | Plan | Costo |
|----------|------|-------|
| GitHub | Free | $0/mes |
| Vercel | Hobby | $0/mes |
| Neon Database | Free Tier | $0/mes |
| **TOTAL** | | **$0/mes** |

### Límites del plan gratuito:
- **Vercel:** 100GB bandwidth/mes, 6000 minutos de build/mes
- **Neon:** 0.5GB almacenamiento, 100 horas activas/mes

---

## 📱 ACCESO DESDE MÓVIL

El sistema es responsive y funciona perfectamente en:
- ✅ Smartphones (iOS/Android)
- ✅ Tablets
- ✅ Computadoras de escritorio

---

## 🔐 SEGURIDAD

1. **Cambia la contraseña admin** después del primer login
2. **Habilita HTTPS** (automático en Vercel)
3. **Configura backups** periódicos de la base de datos
4. **No compartas** las variables de entorno

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Revisa la consola del navegador (F12)
3. Verifica las variables de entorno

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta de GitHub creada
- [ ] Cuenta de Vercel creada y conectada
- [ ] Repositorio subido a GitHub
- [ ] Base de datos Neon creada
- [ ] Proyecto desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Base de datos inicializada
- [ ] Login funcionando
- [ ] Contraseña admin cambiada

---

**¡Felicidades! Tu sistema está listo para usar en producción.**

---

## 🔄 ACTUALIZACIONES

Para actualizar el sistema:

1. Haz cambios en tu código local
2. Sube a GitHub:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
3. Vercel detectará el cambio y redesplegará automáticamente

---

*Guía actualizada: Marzo 2026*
*Sistema de Gestión Integral para Condominios - Asesorías Integrales CyJ*
