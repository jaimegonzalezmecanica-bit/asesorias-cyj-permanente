# 🚀 Guía de Despliegue en Vercel

## Sistema de Gestión de Condominios - Asesorías Integrales CyJ

### 📋 Requisitos Previos

1. **Cuenta en Vercel** (gratis): https://vercel.com
2. **Cuenta en Neon.tech** (base de datos PostgreSQL gratis): https://neon.tech
3. **GitHub Desktop** instalado
4. **Cuenta en GitHub** (gratis): https://github.com

---

## 🔧 Paso 1: Crear Base de Datos en Neon.tech

1. Ve a https://neon.tech y crea una cuenta gratuita
2. Crea un nuevo proyecto llamado "condominios-cyj"
3. Copia la **connection string** que te dan (ejemplo):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. También copia el **Direct URL** (sin pooler) si te lo dan

---

## 📁 Paso 2: Subir a GitHub

### Opción A: Usando GitHub Desktop (Recomendado)

1. Abre **GitHub Desktop**
2. Ve a **File → Add Local Repository**
3. Selecciona la carpeta del proyecto
4. Haz clic en **Create a Repository**
5. Nombra el repositorio: `sistema-condominios-cyj`
6. Haz clic en **Create Repository**
7. Luego haz clic en **Publish repository**
8. Deja la opción "Keep this code private" **DESMARCADA** (para repositorio público gratis)

### Opción B: Usando terminal

```bash
cd /home/z/my-project
git init
git add .
git commit -m "Sistema de Gestión de Condominios - Asesorías CyJ"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sistema-condominios-cyj.git
git push -u origin main
```

---

## 🌐 Paso 3: Desplegar en Vercel

1. Ve a https://vercel.com e inicia sesión con GitHub
2. Haz clic en **"Add New..." → "Project"**
3. Selecciona tu repositorio `sistema-condominios-cyj`
4. En **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (tu conexión de Neon.tech) |
| `DIRECT_URL` | `postgresql://...` (sin pooler, si aplica) |
| `NEXTAUTH_SECRET` | `cyj-condominios-2024-secret-key-super-seguro` |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` |

5. Haz clic en **Deploy**
6. Espera 2-3 minutos a que termine el despliegue

---

## 📊 Paso 4: Configurar Base de Datos

### Antes de desplegar, reemplaza el schema:

1. En tu proyecto local, reemplaza:
   - `prisma/schema.prisma` → usa el contenido de `prisma/schema.postgresql.prisma`

2. O simplemente cambia estas líneas en `schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

3. Sube los cambios a GitHub:
   ```bash
   git add .
   git commit -m "Configurar PostgreSQL para producción"
   git push
   ```

4. Vercel detectará el cambio y redesplegará automáticamente

---

## 👤 Paso 5: Crear Usuario Administrador

Una vez desplegado, crea el usuario admin con la API:

1. Ve a tu sitio: `https://tu-proyecto.vercel.app`
2. Accede a: `https://tu-proyecto.vercel.app/api/auth/init-admin`
3. Se creará el usuario administrador:

**Credenciales por defecto:**
- Email: `admin@cyjcondominios.cl`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión

---

## 🔐 Variables de Entorno Completas

```env
# Base de datos PostgreSQL (Neon.tech)
DATABASE_URL="postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="cyj-condominios-2024-secret-key-super-seguro-muy-largo"
NEXTAUTH_URL="https://tu-proyecto.vercel.app"

# Opcional para desarrollo local
NODE_ENV="production"
```

---

## 📝 Notas Importantes

### Modelo de Datos
El archivo `prisma/schema.postgresql.prisma` está configurado para PostgreSQL.
El archivo `prisma/schema.prisma` usa SQLite para desarrollo local.

### Migraciones
Vercel ejecutará automáticamente `prisma db push` al desplegar.

### Logo
El logo ya está en `/public/logo.jpg`. Asegúrate de incluirlo en el repositorio.

---

## 🛠️ Solución de Problemas

### Error: "la URL debe comenzar con el protocolo `file:`"
- **Causa**: El schema.prisma tiene `provider = "sqlite"` en lugar de `"postgresql"`
- **Solución**: Cambiar a PostgreSQL y agregar `directUrl`

### Error: "P1001: Can't reach database server"
- **Causa**: DATABASE_URL incorrecta o base de datos no accesible
- **Solución**: Verificar la connection string de Neon.tech

### Error: "Authentication failed"
- **Causa**: Usuario admin no creado
- **Solución**: Acceder a `/api/auth/init-admin`

---

## 📞 Soporte

Para asistencia técnica:
- **Email**: asesoriasintegralescyj@gmail.com
- **Teléfono**: +56 964 650 643 | +56 974 408 794
- **Dirección**: Av. La Montaña Norte 3650, Lampa, Chile

---

**Sistema desarrollado para Asesorías Integrales CyJ - Administración de Condominios**
