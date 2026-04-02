# Despliegue Paso a Paso - Sistema de Gestión CYJ

**Fecha:** Marzo 2026  
**Versión:** 1.0  
**Objetivo:** Desplegar la aplicación en producción con Neon.tech y Vercel

---

## 🎯 Resumen del Proceso

Este documento proporciona instrucciones detalladas para desplegar el Sistema de Gestión CYJ en producción. El proceso incluye:

1. Crear base de datos en Neon.tech
2. Subir código a GitHub
3. Conectar a Vercel
4. Configurar variables de entorno
5. Realizar despliegue
6. Verificar funcionamiento

**Tiempo estimado:** 30-45 minutos

---

## 📋 Requisitos

- ✅ Cuenta en GitHub (https://github.com)
- ✅ Cuenta en Neon.tech (https://neon.tech)
- ✅ Cuenta en Vercel (https://vercel.com)
- ✅ Código del proyecto listo para desplegar
- ✅ Git instalado en tu máquina

---

## PASO 1: Preparar Neon.tech (Base de Datos)

### 1.1 Crear Proyecto en Neon.tech

```
1. Accede a https://neon.tech
2. Haz clic en "Sign Up" o inicia sesión
3. Completa el registro con tu email
4. Verifica tu email
5. Haz clic en "Create a new project"
```

### 1.2 Configurar Proyecto PostgreSQL

```
En la página de creación:
- Region: us-east-1 (o la más cercana a tu ubicación)
- PostgreSQL Version: 15 (o superior)
- Database Name: neondb (por defecto)
- Haz clic en "Create project"
```

### 1.3 Obtener Credenciales

```
1. En el dashboard, ve a "Connection String"
2. Selecciona el rol "neondb_owner"
3. Copia la URL completa (incluye el password)
4. Ejemplo:
   postgresql://neondb_owner:password@host/neondb?sslmode=require
```

### 1.4 Obtener Direct URL

```
1. En "Connection String", busca "Direct URL"
2. Copia esta URL también
3. La necesitarás para migraciones
```

**✅ Paso 1 completado: Tienes DATABASE_URL y DIRECT_URL**

---

## PASO 2: Preparar GitHub (Control de Versiones)

### 2.1 Crear Repositorio en GitHub

```
1. Accede a https://github.com
2. Inicia sesión con tu cuenta
3. Haz clic en "+" (arriba a la derecha)
4. Selecciona "New repository"
```

### 2.2 Configurar Repositorio

```
En el formulario:
- Repository name: sistema-gestion-cyj
- Description: Sistema de Gestión para Asesorías Integrales CYJ
- Visibility: Private (recomendado)
- NO inicializar con README
- Haz clic en "Create repository"
```

### 2.3 Subir Código a GitHub

**En tu máquina local:**

```bash
# Navega al directorio del proyecto
cd /ruta/del/proyecto

# Inicializar git (si no está ya inicializado)
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "Initial commit: Sistema de Gestión CYJ"

# Agregar remoto (reemplaza USERNAME con tu usuario de GitHub)
git remote add origin https://github.com/USERNAME/sistema-gestion-cyj.git

# Cambiar rama a main (si es necesario)
git branch -M main

# Subir código
git push -u origin main
```

### 2.4 Verificar en GitHub

```
1. Accede a https://github.com/USERNAME/sistema-gestion-cyj
2. Verifica que todos los archivos estén presentes
3. Verifica que .env.local NO está en el repositorio
```

**✅ Paso 2 completado: Código en GitHub**

---

## PASO 3: Configurar Vercel (Hosting)

### 3.1 Conectar Repositorio a Vercel

```
1. Accede a https://vercel.com
2. Inicia sesión (puedes usar tu cuenta de GitHub)
3. Haz clic en "Add New..." → "Project"
4. Haz clic en "Import Git Repository"
5. Busca "sistema-gestion-cyj"
6. Selecciona tu repositorio
7. Haz clic en "Import"
```

### 3.2 Configurar Variables de Entorno

**En la página de configuración del proyecto:**

```
1. Ve a "Environment Variables"
2. Agrega las siguientes variables:

   Variable: DATABASE_URL
   Value: postgresql://neondb_owner:password@host/neondb?sslmode=require
   
   Variable: DIRECT_URL
   Value: postgresql://neondb_owner:password@host/neondb?sslmode=require
   
   Variable: NEXTAUTH_SECRET
   Value: (Genera con: openssl rand -base64 32)
   
   Variable: NEXTAUTH_URL
   Value: https://sistema-gestion-cyj.vercel.app
   
   Variable: NODE_ENV
   Value: production
```

### 3.3 Generar NEXTAUTH_SECRET

**En tu terminal local:**

```bash
# En macOS o Linux
openssl rand -base64 32

# Resultado ejemplo:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=

# Copia este valor y pégalo en NEXTAUTH_SECRET en Vercel
```

### 3.4 Configurar Build Settings

**En "Build & Development Settings":**

```
- Framework Preset: Next.js
- Build Command: npm run build
- Output Directory: .next
- Install Command: npm install
```

**✅ Paso 3 completado: Vercel configurado**

---

## PASO 4: Realizar Despliegue

### 4.1 Iniciar Despliegue

```
1. En Vercel, haz clic en "Deploy"
2. Vercel comenzará a construir la aplicación
3. Esto tomará 5-10 minutos
4. Verás el progreso en tiempo real
```

### 4.2 Monitorear Despliegue

```
En los logs, deberías ver:
✓ Cloning repository
✓ Installing dependencies
✓ Generating Prisma Client
✓ Building application
✓ Deployment successful
```

### 4.3 Obtener URL de Producción

```
Una vez completado:
1. Vercel te mostrará la URL
2. Ejemplo: https://sistema-gestion-cyj.vercel.app
3. Haz clic en la URL para acceder a la aplicación
```

**✅ Paso 4 completado: Aplicación desplegada**

---

## PASO 5: Verificación Post-Despliegue

### 5.1 Verificar Acceso

```
1. Accede a https://sistema-gestion-cyj.vercel.app
2. Deberías ver la página de inicio
3. Intenta navegar por la aplicación
```

### 5.2 Verificar Base de Datos

```
1. En Vercel, ve a "Deployments"
2. Selecciona el último despliegue
3. Ve a "Functions" y revisa los logs
4. Deberías ver: "Database migration completed"
```

### 5.3 Crear Usuario Administrativo

```
1. En la aplicación, ve a "Usuarios"
2. Crea un nuevo usuario con rol "Administrador"
3. Email: admin@ejemplo.com
4. Contraseña: (segura)
5. Guarda las credenciales en un lugar seguro
```

### 5.4 Verificar Módulos

```
Verifica que todos los módulos funcionan:
- Dashboard: ✓
- Proyectos: ✓
- Vehículos: ✓
- Morosidad: ✓
- Órdenes de Trabajo: ✓
- Gastos: ✓
- Reservas: ✓
- Personal: ✓
- Residentes: ✓
```

**✅ Paso 5 completado: Verificación exitosa**

---

## PASO 6: Configuración Post-Despliegue

### 6.1 Configurar Dominio Personalizado (Opcional)

```
1. En Vercel, ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS
4. Espera a que se propague (5-30 minutos)
```

### 6.2 Configurar Backups Automáticos

```
En Neon.tech:
1. Ve a "Backups"
2. Configura backups automáticos diarios
3. Guarda los backups en un lugar seguro
```

### 6.3 Configurar Alertas

```
En Vercel:
1. Ve a "Settings" → "Alerts"
2. Configura alertas para:
   - Build failures
   - Deployment errors
   - Performance issues
```

**✅ Paso 6 completado: Configuración avanzada**

---

## 🔄 Actualizar Código en Producción

### Proceso Simple

```bash
# 1. Hacer cambios locales
# 2. Commit
git add .
git commit -m "Descripción del cambio"

# 3. Push a GitHub
git push origin main

# 4. Vercel detectará automáticamente los cambios
# 5. Redesplegará la aplicación
# 6. Tu aplicación se actualizará en producción
```

---

## 🐛 Solución de Problemas Comunes

### Error: "DATABASE_URL is not set"

```
Solución:
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que DATABASE_URL está configurada
3. Verifica que el valor es correcto
4. Haz clic en "Redeploy" en Vercel
```

### Error: "Build failed"

```
Solución:
1. Ve a Vercel → Deployments
2. Haz clic en el despliegue fallido
3. Revisa los logs para ver el error específico
4. Corrige el error localmente
5. Haz push a GitHub
6. Vercel redesplegará automáticamente
```

### Error: "Connection refused"

```
Solución:
1. Verifica que Neon.tech está activo
2. Verifica que DATABASE_URL es correcta
3. Intenta usar DIRECT_URL en lugar de DATABASE_URL
4. Verifica que el firewall permite conexiones
```

### Error: "NEXTAUTH_SECRET not configured"

```
Solución:
1. Genera un nuevo secret: openssl rand -base64 32
2. Ve a Vercel → Settings → Environment Variables
3. Agrega NEXTAUTH_SECRET
4. Redeploy la aplicación
```

---

## ✅ Checklist Final

- [ ] Neon.tech: Proyecto creado y credenciales obtenidas
- [ ] GitHub: Repositorio creado y código subido
- [ ] Vercel: Proyecto creado y variables de entorno configuradas
- [ ] Despliegue: Completado exitosamente
- [ ] Verificación: Aplicación accesible y funcionando
- [ ] Usuario Admin: Creado y credenciales guardadas
- [ ] Dominio: Configurado (opcional)
- [ ] Backups: Configurados
- [ ] Alertas: Configuradas

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel
2. Revisa la documentación de Neon.tech
3. Revisa la documentación de Vercel
4. Crea un issue en GitHub

---

## 🎉 ¡Felicidades!

Tu aplicación está ahora en producción y accesible en:

**https://sistema-gestion-cyj.vercel.app**

Próximos pasos:
- Configurar dominio personalizado
- Configurar backups automáticos
- Configurar monitoreo y alertas
- Documentar procesos de administración
- Capacitar a usuarios

---

**Última actualización:** Marzo 2026
