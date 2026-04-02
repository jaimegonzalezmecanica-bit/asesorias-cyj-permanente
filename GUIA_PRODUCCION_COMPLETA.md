# Guía Completa de Despliegue en Producción
## Sistema de Gestión - Asesorías Integrales CYJ

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Neon.tech](#configuración-de-neontech)
3. [Configuración de GitHub](#configuración-de-github)
4. [Despliegue en Vercel](#despliegue-en-vercel)
5. [Verificación Post-Despliegue](#verificación-post-despliegue)
6. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en [GitHub](https://github.com)
- ✅ Cuenta en [Neon.tech](https://neon.tech)
- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Git instalado en tu máquina local
- ✅ Node.js 18+ instalado
- ✅ npm o pnpm instalado

---

## Configuración de Neon.tech

### Paso 1: Crear Proyecto en Neon.tech

1. Accede a [neon.tech](https://neon.tech) e inicia sesión
2. Haz clic en **"Create a new project"**
3. Selecciona:
   - **Region**: Elige la más cercana a tu ubicación (ej: us-east-1 para América)
   - **PostgreSQL Version**: 15 o superior
   - **Database Name**: `neondb` (por defecto)
4. Haz clic en **"Create project"**

### Paso 2: Obtener Credenciales de Conexión

1. En el dashboard de Neon, ve a **"Connection String"**
2. Selecciona el rol **"neondb_owner"**
3. Copia la cadena de conexión completa (incluye el password)
4. También copia la **"Direct URL"** (para migraciones)

**Formato esperado:**
```
postgresql://neondb_owner:password@host/neondb?sslmode=require
```

### Paso 3: Guardar Credenciales

Guarda estas credenciales en un lugar seguro. Las usaremos en Vercel.

---

## Configuración de GitHub

### Paso 1: Crear Repositorio

1. Accede a [github.com](https://github.com)
2. Haz clic en **"New repository"**
3. Configura:
   - **Repository name**: `sistema-gestion-cyj`
   - **Description**: "Sistema de Gestión para Asesorías Integrales CYJ"
   - **Visibility**: Private (recomendado para datos sensibles)
   - **Initialize**: Sin README (lo agregaremos después)
4. Haz clic en **"Create repository"**

### Paso 2: Subir Código a GitHub

En tu máquina local, en el directorio del proyecto:

```bash
# Inicializar repositorio git (si no está ya inicializado)
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "Initial commit: Sistema de Gestión CYJ"

# Agregar remoto
git remote add origin https://github.com/TU_USUARIO/sistema-gestion-cyj.git

# Cambiar rama a main (si es necesario)
git branch -M main

# Subir código
git push -u origin main
```

### Paso 3: Verificar en GitHub

Accede a tu repositorio en GitHub y verifica que todos los archivos estén presentes.

---

## Despliegue en Vercel

### Paso 1: Conectar Repositorio

1. Accede a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Import Git Repository"**
4. Busca y selecciona `sistema-gestion-cyj`
5. Haz clic en **"Import"**

### Paso 2: Configurar Variables de Entorno

En la página de configuración del proyecto, ve a **"Environment Variables"** y agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de Neon.tech (con password) |
| `DIRECT_URL` | Tu Direct URL de Neon.tech |
| `NEXTAUTH_SECRET` | Genera con: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` |
| `NODE_ENV` | `production` |

**Ejemplo de NEXTAUTH_SECRET:**
```bash
# En terminal, ejecuta:
openssl rand -base64 32
# Resultado: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

### Paso 3: Configurar Build Settings

En **"Build & Development Settings"**:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Paso 4: Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que se complete el despliegue (5-10 minutos)
3. Una vez completado, verás la URL de tu aplicación

---

## Verificación Post-Despliegue

### Paso 1: Verificar Acceso

1. Accede a tu URL de Vercel
2. Deberías ver la página de inicio del sistema
3. Intenta iniciar sesión con credenciales de prueba

### Paso 2: Verificar Base de Datos

En Vercel, ve a **"Deployments"** → **"Functions"** y verifica que no haya errores en los logs.

### Paso 3: Verificar Migraciones

Las migraciones de Prisma se ejecutan automáticamente durante el build. Verifica en los logs de Vercel:

```
✓ Prisma schema loaded
✓ Database migration completed
```

### Paso 4: Crear Usuario Administrativo

Una vez desplegado, accede a la aplicación y crea el primer usuario administrativo.

---

## Solución de Problemas

### Error: "DATABASE_URL is not set"

**Solución:**
- Verifica que `DATABASE_URL` está configurada en Vercel
- Asegúrate de que la URL es correcta (incluye el password)
- Redeploy después de agregar la variable

### Error: "Connection refused"

**Solución:**
- Verifica que la URL de Neon.tech es correcta
- Asegúrate de que Neon.tech está activo
- Intenta usar la DIRECT_URL en lugar de DATABASE_URL

### Error: "Migration failed"

**Solución:**
- Verifica que el esquema de Prisma es válido
- Ejecuta localmente: `npm run db:push`
- Revisa los logs en Vercel para más detalles

### Error: "Build failed"

**Solución:**
- Verifica que todas las dependencias están instaladas
- Ejecuta localmente: `npm install && npm run build`
- Revisa los logs de Vercel para identificar el error específico

### Error: "NEXTAUTH_SECRET not configured"

**Solución:**
- Genera un nuevo secret: `openssl rand -base64 32`
- Configura en Vercel: `NEXTAUTH_SECRET`
- Redeploy la aplicación

---

## Mantenimiento Continuo

### Actualizar Código

Para actualizar el código en producción:

```bash
# Hacer cambios locales
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel detectará automáticamente los cambios y redesplegará la aplicación.

### Respaldar Base de Datos

Neon.tech proporciona backups automáticos. Para descargar un backup:

1. Accede a Neon.tech dashboard
2. Ve a **"Backups"**
3. Descarga el backup deseado

### Monitorear Aplicación

En Vercel, puedes monitorear:

- **Deployments**: Historial de despliegues
- **Functions**: Logs de funciones serverless
- **Analytics**: Uso de recursos
- **Monitoring**: Errores y alertas

---

## Próximos Pasos

1. ✅ Configurar dominio personalizado en Vercel
2. ✅ Configurar SSL/TLS (automático en Vercel)
3. ✅ Configurar backups automáticos
4. ✅ Configurar alertas de errores
5. ✅ Documentar procesos de administración

---

## Contacto y Soporte

Para soporte técnico:
- Documentación de Vercel: https://vercel.com/docs
- Documentación de Neon.tech: https://neon.tech/docs
- Documentación de Next.js: https://nextjs.org/docs
- Documentación de Prisma: https://www.prisma.io/docs

---

**Última actualización:** Marzo 2026
**Versión:** 1.0
