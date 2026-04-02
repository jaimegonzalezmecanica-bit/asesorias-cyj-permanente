# 📁 UBICACIÓN DE ARCHIVOS Y CÓMO ENCONTRARLOS

Esta guía te dice EXACTAMENTE dónde está cada cosa.

---

## 📂 ESTRUCTURA DEL PROYECTO

El proyecto completo está en esta carpeta:
```
/home/z/my-project/
```

---

## 📄 ARCHIVOS IMPORTANTES Y SU UBICACIÓN

### 1. GUIAS DE DESPLIEGUE

| Archivo | Ubicación completa | Para qué sirve |
|---------|-------------------|----------------|
| `GUIA_PRINCIPIANTES.md` | `/home/z/my-project/GUIA_PRINCIPIANTES.md` | **LEER PRIMERO** - Guía paso a paso detallada |
| `GUIA_DESPLIEGUE_VERCEL.md` | `/home/z/my-project/GUIA_DESPLIEGUE_VERCEL.md` | Guía completa con más detalles técnicos |
| `PRODUCCION.md` | `/home/z/my-project/PRODUCCION.md` | Guía rápida resumida |

### 2. CONFIGURACIÓN DEL PROYECTO

| Archivo | Ubicación completa | Para qué sirve |
|---------|-------------------|----------------|
| `package.json` | `/home/z/my-project/package.json` | Lista de dependencias y scripts |
| `next.config.ts` | `/home/z/my-project/next.config.ts` | Configuración de Next.js |
| `vercel.json` | `/home/z/my-project/vercel.json` | Configuración para Vercel |
| `.env.example` | `/home/z/my-project/.env.example` | Ejemplo de variables de entorno |

### 3. BASE DE DATOS

| Archivo | Ubicación completa | Para qué sirve |
|---------|-------------------|----------------|
| `schema.prisma` | `/home/z/my-project/prisma/schema.prisma` | **SQLite** - Para desarrollo local |
| `schema.postgres.prisma` | `/home/z/my-project/prisma/schema.postgres.prisma` | **PostgreSQL** - Para producción en Vercel |
| `custom.db` | `/home/z/my-project/db/custom.db` | Base de datos SQLite actual |

### 4. CÓDIGO FUENTE

| Carpeta | Ubicación | Contiene |
|---------|-----------|----------|
| `src/app/` | `/home/z/my-project/src/app/` | Páginas del sistema |
| `src/components/` | `/home/z/my-project/src/components/` | Componentes visuales |
| `src/lib/` | `/home/z/my-project/src/lib/` | Librerías y utilidades |
| `src/app/api/` | `/home/z/my-project/src/app/api/` | APIs del sistema |

### 5. RESPALDOS

| Archivo | Ubicación | Contiene |
|---------|-----------|----------|
| `backup_cyj_20260322_030408.zip` | `/home/z/my-project/backups/` | Respaldo comprimido |

---

## 🔧 CÓMO DESCARGAR EL PROYECTO COMPLETO

### Opción 1: Descargar como ZIP

Si tienes acceso a este servidor, puedes crear un ZIP:

1. Todos los archivos están en `/home/z/my-project/`
2. Crea un archivo ZIP con todo el contenido
3. Guárdalo en tu computadora

### Opción 2: Usar Git Clone

Si ya creaste el repositorio en GitHub:

```bash
git clone https://github.com/TU-USUARIO/cyj-condominios.git
```

---

## 📋 LISTADO COMPLETO DE ARCHIVOS

### Archivos de configuración (raíz)
```
/home/z/my-project/
├── package.json              ← Dependencias
├── package-lock.json         ← Versiones exactas
├── next.config.ts            ← Config Next.js
├── vercel.json               ← Config Vercel
├── tsconfig.json             ← Config TypeScript
├── tailwind.config.ts        ← Config Tailwind CSS
├── components.json           ← Config shadcn/ui
├── .env.example              ← Variables ejemplo
├── .gitignore                ← Archivos a ignorar en Git
├── README.md                 ← Documentación
├── GUIA_PRINCIPIANTES.md     ← Guía principal
├── GUIA_DESPLIEGUE_VERCEL.md ← Guía detallada
└── PRODUCCION.md             ← Guía rápida
```

### Carpeta prisma (base de datos)
```
/home/z/my-project/prisma/
├── schema.prisma             ← SQLite (desarrollo)
└── schema.postgres.prisma    ← PostgreSQL (producción)
```

### Carpeta src/app (páginas)
```
/home/z/my-project/src/app/
├── layout.tsx                ← Layout principal
├── page.tsx                  ← Página principal (login/dashboard)
├── globals.css               ← Estilos globales
├── login/page.tsx            ← Página de login
├── sistema/page.tsx          ← Página del sistema
├── portal/page.tsx           ← Portal de residentes
├── descargas/page.tsx        ← Descargas
└── api/                      ← APIs (backend)
    ├── auth/                 ← Autenticación
    ├── dashboard/            ← Dashboard
    ├── init-db/              ← Inicializar BD
    ├── usuarios/             ← Usuarios
    ├── personal/             ← Personal
    ├── residentes/           ← Residentes
    ├── ordenes-trabajo/      ← Órdenes de trabajo
    ├── gastos/               ← Gastos
    ├── reservas/             ← Reservas
    ├── comite/               ← Comité
    └── [más APIs...]
```

### Carpeta src/components (componentes)
```
/home/z/my-project/src/components/
├── Dashboard.tsx             ← Dashboard principal
├── MainContent.tsx           ← Contenido principal
├── Sidebar.tsx               ← Menú lateral
├── personal/                 ← Módulo Personal
├── residentes/               ← Módulo Residentes
├── ordenes-trabajo/          ← Módulo OT
├── gastos/                   ← Módulo Gastos
├── reservas/                 ← Módulo Reservas
├── comite/                   ← Módulo Comité
└── ui/                       ← Componentes shadcn/ui
```

### Carpeta src/lib (utilidades)
```
/home/z/my-project/src/lib/
├── db.ts                     ← Conexión base de datos
├── auth.ts                   ← Autenticación
├── store.ts                  ← Estado global
├── utils.ts                  ← Funciones útiles (formatCLP, etc.)
├── permissions.ts            ← Permisos del sistema
└── permisos.ts               ← Configuración de permisos
```

---

## 🚀 PASOS RESUMIDOS PARA PRODUCCIÓN

### 1. LEER LA GUÍA
```
Abrir: /home/z/my-project/GUIA_PRINCIPIANTES.md
```

### 2. CREAR CUENTAS
- GitHub → github.com/signup
- Vercel → vercel.com/signup
- Neon → neon.tech/signup

### 3. SUBIR A GITHUB
- Crear repositorio llamado `cyj-condominios`
- Subir todos los archivos de `/home/z/my-project/`

### 4. CONFIGURAR EN VERCEL
- Importar repositorio
- Agregar variables:
  - `DATABASE_URL` = URL de Neon
  - `NEXTAUTH_SECRET` = texto aleatorio
  - `NEXTAUTH_URL` = https://cyj-condominios.vercel.app

### 5. DESPLEGAR
- Click en "Deploy"
- Esperar 3-5 minutos

### 6. INICIALIZAR
- Visitar: https://tu-url.vercel.app/api/init-db

### 7. USAR
- Login: admin@cyjcondominios.cl
- Password: admin123

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Dónde está el código del login?**
R: `/home/z/my-project/src/app/login/page.tsx`

**P: ¿Dónde está el código del dashboard?**
R: `/home/z/my-project/src/components/Dashboard.tsx`

**P: ¿Dónde está la configuración de la base de datos?**
R: `/home/z/my-project/prisma/schema.prisma`

**P: ¿Dónde están los módulos del sistema?**
R: `/home/z/my-project/src/components/` (carpeta para cada módulo)

**P: ¿Cómo cambio el formato de moneda?**
R: `/home/z/my-project/src/lib/utils.ts` - función `formatCLP()`

---

*Esta guía te ayuda a encontrar cualquier archivo del proyecto.*
