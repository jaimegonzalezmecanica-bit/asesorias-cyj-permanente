# 📦 Guía de Subida a tu Hosting

## 🎯 Estructura Recomendada

```
tudominio.cl/
├── index.html          ← Landing page estática (para tu hosting)
├── logo.png
├── images/
│   ├── hero.png
│   ├── condominios.png
│   ├── corretaje.png
│   └── areas-verdes.png
└── sistema/            ← Sistema (Vercel o subdominio)
```

---

## 📤 PASO 1: Subir la Landing Page a tu Hosting

### Opción A: Via cPanel (File Manager)

1. Ingresa a tu **cPanel**
2. Abre **File Manager**
3. Ve a la carpeta `public_html` (o la carpeta de tu dominio)
4. Sube estos archivos desde `/static-landing/`:
   - `index.html`
   - `logo.png`
   - Carpeta `images/` con todas las imágenes

### Opción B: Via FTP

```
Servidor: ftp.tudominio.cl
Usuario: tu_usuario_cpanel
Contraseña: tu_contraseña_cpanel
Puerto: 21
```

Sube la carpeta `static-landing/` completa a `public_html/`

---

## 🚀 PASO 2: Subir el Sistema a Vercel (GRATIS)

### ¿Por qué Vercel?
- ✅ **Gratis** para siempre
- ✅ **SSL automático** (HTTPS)
- ✅ **Sin límites de transferencia**
- ✅ **CDN global** (rápido en todo el mundo)
- ✅ **Dominio personalizado**

### Pasos:

1. **Crear cuenta en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Regístrate con GitHub, GitLab o email

2. **Subir código a GitHub**
   ```bash
   # En tu computador
   cd /home/z/my-project
   git init
   git add .
   git commit -m "Sistema Asesorías Integrales CYJ"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/asesorias-cyj.git
   git push -u origin main
   ```

3. **Importar en Vercel**
   - En Vercel, haz clic en **"Add New Project"**
   - Selecciona tu repositorio de GitHub
   - Configura:
     - Framework: **Next.js**
     - Build Command: `bun run build`
     - Output Directory: `.next`
   - Haz clic en **"Deploy"**

4. **Configurar Variables de Entorno**
   En Vercel → Settings → Environment Variables:
   ```
   DATABASE_URL = file:./db/database.db
   NEXTAUTH_SECRET = [genera con: openssl rand -base64 32]
   NEXTAUTH_URL = https://sistema.tudominio.cl
   NODE_ENV = production
   ```

5. **Conectar Dominio**
   - En Vercel → Settings → Domains
   - Agrega: `sistema.tudominio.cl`
   - Copia los registros DNS que te indica Vercel

---

## 🌐 PASO 3: Configurar DNS en tu Hosting

En tu panel de dominio (cPanel o donde compraste el dominio):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | IP de tu hosting |
| CNAME | www | tudominio.cl |
| CNAME | sistema | cname.vercel-dns.com |

---

## 📝 PASO 4: Modificar link en Landing Page

En el `index.html` de tu hosting, asegúrate de que el botón apunte al sistema:

```html
<!-- Cambia "sistema/" por tu URL de Vercel -->
<a href="https://sistema.tudominio.cl" class="btn">
    Acceder al Sistema →
</a>
```

---

## ⚠️ IMPORTANTE: Base de Datos

Para Vercel, la base de datos SQLite no funcionará porque Vercel es "serverless". Tienes 2 opciones:

### Opción A: Usar Vercel KV (Redis) - GRATIS
Vercel ofrece una base de datos gratis para proyectos pequeños.

### Opción B: Usar MySQL de tu Hosting

1. En cPanel, crea una base de datos MySQL
2. Actualiza `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
3. En Vercel, configura:
   ```
   DATABASE_URL = mysql://usuario:password@localhost:3306/nombre_db
   ```

---

## 📁 Archivos Listos para Subir

Ya preparé todo en la carpeta `/static-landing/`:

```
/static-landing/
├── index.html          ← Página principal (HTML estático)
├── logo.png            ← Tu logo
└── images/
    ├── hero.png
    ├── condominios.png
    ├── corretaje.png
    └── areas-verdes.png
```

**Solo necesitas subir esta carpeta a tu hosting.**

---

## ✅ Checklist Final

- [ ] Subir `static-landing/` a `public_html/` de tu hosting
- [ ] Crear cuenta en Vercel
- [ ] Subir código a GitHub
- [ ] Importar proyecto en Vercel
- [ ] Configurar variables de entorno
- [ ] Configurar subdominio `sistema.tudominio.cl`
- [ ] Probar que todo funcione

---

## 💰 Costos Estimados

| Servicio | Costo |
|----------|-------|
| Vercel (Hobby) | **Gratis** |
| Hosting actual | Ya lo tienes |
| Dominio | Ya lo tienes |
| **TOTAL** | **$0/mes** |
