# 🚀 DESPLIEGUE RÁPIDO EN VERCEL

## Guía de 5 minutos

### 1️⃣ Crear cuentas gratuitas
- GitHub: https://github.com (si no tienes)
- Vercel: https://vercel.com (usar GitHub)
- Neon DB: https://neon.tech (usar GitHub)

### 2️⃣ Crear base de datos
1. En Neon, crear nuevo proyecto
2. Copiar la **Connection String** (Pooled)

### 3️⃣ Subir a GitHub
```bash
git init
git add .
git commit -m "Sistema CyJ Condominios"
git remote add origin https://github.com/TU-USUARIO/cyj-condominios.git
git push -u origin main
```

### 4️⃣ Desplegar en Vercel
1. Importar repositorio desde Vercel
2. Configurar variables de entorno:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de Neon |
| `NEXTAUTH_SECRET` | Ejecutar: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` |

3. Click en **Deploy**

### 5️⃣ Inicializar base de datos
Visitar: `https://tu-proyecto.vercel.app/api/init-db`

### 6️⃣ ¡Listo!
- **Login:** admin@cyjcondominios.cl
- **Password:** admin123
- ⚠️ **Cambiar contraseña inmediatamente**

---

## 📁 Estructura de archivos importantes

```
├── prisma/
│   ├── schema.prisma          # Schema SQLite (desarrollo)
│   └── schema.postgres.prisma # Schema PostgreSQL (producción)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── init-db/       # API para inicializar DB
│   │   └── ...
│   └── lib/
│       └── utils.ts           # Funciones CLP, horas, etc.
├── vercel.json                # Configuración Vercel
├── next.config.ts             # Configuración Next.js
└── .env.example               # Variables de entorno ejemplo
```

---

## 🔄 Para cambiar a PostgreSQL en producción

1. Reemplazar el contenido de `prisma/schema.prisma` con `prisma/schema.postgres.prisma`
2. Configurar `DATABASE_URL` con la URL de Neon
3. Redesplegar

---

## 💡 Tips

- **Base de datos gratis:** Neon ofrece 0.5GB gratis
- **Hosting gratis:** Vercel es gratis para proyectos personales
- **Dominio personalizado:** Configurar en Vercel → Settings → Domains
- **Backups:** Descargar base de datos periódicamente desde Neon

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Asegúrate que la base de datos esté activa

---

*Sistema de Gestión Integral para Condominios - Asesorías Integrales CyJ*
