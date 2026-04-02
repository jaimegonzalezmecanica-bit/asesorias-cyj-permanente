# Sistema de Gestión - Asesorías Integrales CYJ

**Versión:** 1.0.0  
**Estado:** Producción  
**Última actualización:** Marzo 2026

---

## 📋 Descripción del Proyecto

Sistema integral de gestión para condominios y asesorías desarrollado con tecnologías modernas. Incluye módulos para:

- ✅ Gestión de residentes y propiedades
- ✅ Órdenes de trabajo y proyectos
- ✅ Control de gastos y morosidad
- ✅ Gestión de vehículos y activos
- ✅ Rondas de vigilancia con QR
- ✅ Portal de residentes
- ✅ Reportes y exportación de datos
- ✅ Auditoría y cumplimiento normativo

---

## 🚀 Características Principales

### Módulos Implementados (21 Requisitos)

1. **Dashboard** - Resumen de cumplimiento y estado general
2. **Proyectos** - Gestión de materiales, tareas y herramientas
3. **Vehículos** - Registro y control de vehículos con documentación
4. **Rondas QR** - Generación dinámica de códigos QR para vigilancia
5. **Órdenes de Trabajo** - Creación y seguimiento de OT
6. **Gastos** - Registro y control de gastos con comprobantes
7. **Reservas** - Gestión de espacios comunes
8. **Personal** - Registro de personal con fotos
9. **Activos** - Inventario de activos del condominio
10. **Residentes** - Gestión de residentes y propiedades
11. **Usuarios** - Control de usuarios y permisos
12. **Morosidad** - Gestión de deudas y cartas de cobranza
13. **Asistencia** - Control de asistencia
14. **Comité** - Gestión de miembros del comité
15. **Cumplimiento** - Seguimiento de normativas
16. **Auditoría** - Auditoría interna
17. **Backups** - Gestión de respaldos
18. **Condominio** - Configuración multi-condominio
19. **Contabilidad** - Módulo de contabilidad
20. **Inspecciones** - Gestión de inspecciones
21. **Importación Masiva** - Importación de datos desde Excel/CSV

### Características Técnicas

- 🔐 Autenticación segura con NextAuth.js
- 📊 Exportación de datos a Excel/PDF
- 📱 Interfaz responsiva (web y móvil)
- 🗄️ Base de datos PostgreSQL con Prisma ORM
- 🎨 Diseño moderno con Tailwind CSS y shadcn/ui
- 📈 Gráficos y visualizaciones con Recharts
- 🔄 Importación masiva de datos
- 💾 Gestión de archivos y documentos
- 🌍 Soporte multi-idioma (Next-intl)
- 📧 Notificaciones y alertas

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos
- **React Hook Form** - Formularios

### Backend
- **Next.js API Routes** - Endpoints API
- **NextAuth.js** - Autenticación
- **Prisma ORM** - Acceso a datos
- **PostgreSQL** - Base de datos

### DevOps
- **Vercel** - Hosting y despliegue
- **Neon.tech** - Base de datos PostgreSQL
- **GitHub** - Control de versiones
- **GitHub Actions** - CI/CD

---

## 📦 Instalación y Configuración

### Requisitos Previos

- Node.js 18+ 
- npm o pnpm
- Git
- PostgreSQL (o Neon.tech para producción)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/sistema-gestion-cyj.git
cd sistema-gestion-cyj

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Generar Prisma Client
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Iniciar servidor de desarrollo
npm run dev
```

Accede a `http://localhost:3000`

---

## 🚀 Despliegue en Producción

### Opción 1: Vercel (Recomendado)

```bash
# 1. Subir código a GitHub
git push origin main

# 2. Conectar repositorio en Vercel
# https://vercel.com/new

# 3. Configurar variables de entorno en Vercel
# DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Vercel desplegará automáticamente
```

Ver: [GUIA_PRODUCCION_COMPLETA.md](./GUIA_PRODUCCION_COMPLETA.md)

### Opción 2: Docker

```bash
# Construir imagen
docker build -t sistema-gestion-cyj .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  sistema-gestion-cyj
```

---

## 📊 Estructura del Proyecto

```
sistema-gestion-cyj/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página inicio
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Dashboard
│   │   ├── proyectos/         # Módulo Proyectos
│   │   ├── vehiculos/         # Módulo Vehículos
│   │   ├── morosidad/         # Módulo Morosidad
│   │   ├── shared/            # Componentes compartidos
│   │   └── ui/                # Componentes UI (shadcn)
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilidades
│   └── proxy.ts               # Proxy configuration
├── prisma/
│   └── schema.prisma          # Schema de base de datos
├── public/                    # Archivos estáticos
├── .env.local                 # Variables de entorno (local)
├── .env.production            # Variables de entorno (producción)
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
├── tailwind.config.ts         # Configuración Tailwind
└── vercel.json                # Configuración Vercel
```

---

## 🔐 Variables de Entorno

```env
# Base de Datos
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
DIRECT_URL=postgresql://user:password@host/db?sslmode=require

# Autenticación
NEXTAUTH_SECRET=tu-clave-secreta-segura
NEXTAUTH_URL=https://tu-dominio.vercel.app

# Aplicación
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tu-dominio.vercel.app
```

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Build
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Base de Datos
npm run db:generate     # Generar Prisma Client
npm run db:push         # Sincronizar schema con BD
npm run db:migrate      # Ejecutar migraciones
npm run db:reset        # Resetear base de datos

# Linting
npm run lint            # Ejecutar ESLint
```

---

## 🔄 Flujo de Trabajo

### Desarrollo

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Realizar cambios
3. Commit: `git commit -m "Descripción clara"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request en GitHub

### CI/CD

1. GitHub Actions ejecuta tests y build
2. Si pasa, se aprueba el PR
3. Al mergear a `main`, se despliega automáticamente a Vercel
4. Vercel ejecuta migraciones de BD
5. Aplicación disponible en producción

---

## 🐛 Solución de Problemas

### Error: "DATABASE_URL is not set"
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# En Vercel, ir a Settings > Environment Variables
```

### Error: "Build failed"
```bash
# Ejecutar localmente
npm install
npm run build

# Revisar logs de Vercel
```

### Error: "Connection refused"
```bash
# Verificar que PostgreSQL está activo
# Verificar credenciales de conexión
# Usar DIRECT_URL para migraciones
```

---

## 📚 Documentación Adicional

- [Guía de Producción Completa](./GUIA_PRODUCCION_COMPLETA.md)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de NextAuth.js](https://next-auth.js.org)

---

## 👥 Equipo

- **Desarrollador Principal**: Manus AI
- **Fecha de Inicio**: Marzo 2024
- **Última Actualización**: Marzo 2026

---

## 📄 Licencia

Proyecto privado para Asesorías Integrales CYJ. Todos los derechos reservados.

---

## 📞 Soporte

Para reportar bugs o solicitar features, crear un issue en GitHub.

---

**¡Gracias por usar Sistema de Gestión CYJ!** 🎉
