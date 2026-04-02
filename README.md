# Condominio Laguna Norte – Sistema de Gestión v2

Sistema integral de gestión para condominios desarrollado con Next.js 16, Prisma ORM y SQLite.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-blue)

---

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push

# Iniciar servidor de desarrollo
bun run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

```bash
# Opción 1: Script automatizado
chmod +x deploy.sh
./deploy.sh

# Opción 2: Docker
docker compose up -d

# Opción 3: Build manual
bun run build
bun run start
```

---

## 📋 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| 📊 **Dashboard** | Panel principal con métricas y KPIs |
| 👥 **Residentes** | Gestión de residentes y propiedades |
| 🔧 **Órdenes de Trabajo** | Creación y seguimiento de OTs |
| 📦 **Catálogos** | Tareas, materiales y herramientas |
| 💰 **Centros de Costo** | Control presupuestario por área |
| 👷 **Personal** | Gestión de empleados y contratistas |
| 🏢 **Proveedores** | Directorio de proveedores |
| 📝 **Inspecciones** | Registro de inspecciones |
| 📈 **Proyectos** | Gestión de proyectos |
| 💸 **Gastos** | Control de gastos |
| 🏠 **Activos** | Inventario de activos |
| 📑 **Reportes** | Generación de reportes PDF |

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Base de Datos**: SQLite con Prisma ORM
- **Estado**: Zustand + TanStack Query
- **PDF**: jsPDF + jsPDF-AutoTable

---

## 📁 Estructura del Proyecto

```
condominio-app/
├── src/
│   ├── app/                 # App Router (Next.js 16)
│   │   ├── api/            # API Routes
│   │   ├── page.tsx        # Página principal
│   │   └── layout.tsx      # Layout raíz
│   ├── components/         # Componentes React
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...Module.tsx  # Módulos de negocio
│   ├── lib/               # Utilidades y configuración
│   └── hooks/             # Custom hooks
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── db/
│   └── custom.db          # Base de datos SQLite
├── mini-services/         # Microservicios
│   └── ot-scheduler/      # Scheduler de OTs recurrentes
├── public/                # Archivos estáticos
├── Dockerfile             # Imagen Docker
├── docker-compose.yml     # Orquestación
├── deploy.sh              # Script de despliegue
├── DEPLOYMENT.md          # Guía de despliegue
└── .env.example           # Variables de entorno
```

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
NODE_ENV=production
DATABASE_URL=file:./db/custom.db
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=genera-un-secret-seguro
```

### Base de Datos

```bash
# Crear/esquema
bun run db:push

# Cargar datos iniciales
curl -X POST http://localhost:3000/api/seed
curl -X POST http://localhost:3000/api/seed-catalogos
```

---

## 🔄 Tareas Recurrentes

El sistema incluye un scheduler automático que genera OTs basándose en las frecuencias configuradas:

- **Diaria**: Cada día
- **Semanal**: Cada 7 días
- **Mensual**: Cada 30 días
- **Trimestral**: Cada 90 días
- **Semestral**: Cada 180 días
- **Anual**: Cada 365 días

El scheduler se ejecuta automáticamente en el mini-servicio `ot-scheduler`.

---

## 📚 Documentación

- [Guía de Despliegue](./DEPLOYMENT.md) - Instrucciones detalladas para producción
- [Variables de Entorno](./.env.example) - Configuración del sistema

---

## 🔒 Seguridad

- Autenticación con NextAuth.js
- Sanitización de inputs
- Protección CSRF
- Variables de entorno para datos sensibles

---

## 📞 Soporte

Para problemas técnicos, revisa:
1. Logs: `docker compose logs -f` o `pm2 logs`
2. Base de datos: `bun run db:push`
3. Documentación: `./DEPLOYMENT.md`

---

## 📄 Licencia

Privado - Condominio Laguna Norte

---

**Desarrollado con ❤️ para Condominio Laguna Norte**
