# Sistema de Gestión de Condominios - Asesorías Integrales CyJ

## Descripción General
Sistema integral de administración de condominios desarrollado con Next.js 16, TypeScript, Prisma ORM y shadcn/ui.

---

## Requisitos del Sistema

- Node.js 18+ o Bun
- Base de datos SQLite (desarrollo) o PostgreSQL (producción)
- 2GB RAM mínimo

---

## Instalación

```bash
# 1. Descomprimir el archivo
tar -xzvf sistema-cyj-completo.tar.gz

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Configurar base de datos
bunx prisma generate
bunx prisma db push

# 5. Crear usuario administrador
bun scripts/create-admin.mjs

# 6. Iniciar servidor
bun run dev
```

---

## Credenciales por Defecto

- **Email:** admin@cyjcondominios.cl
- **Contraseña:** admin123

---

## Módulos Implementados (36 módulos)

### 1. Dashboard
- Estadísticas generales del condominio
- Órdenes de trabajo recientes
- Estado de unidades
- Gastos del mes
- Centros de costo con presupuesto

### 2. Gestión de Propiedades (Condominio)
- CRUD de propiedades/unidades
- Filtros por tipo, estado
- Vista de detalles

### 3. Residentes
- CRUD de residentes
- Filtros por etapa, letra de unidad, tipo, estado
- Importación desde Excel
- Exportación CSV

### 4. Personal
- Gestión de personal interno
- Datos de contratos, AFP, salud, mutual
- Cálculo de liquidaciones
- Importación desde Excel
- Generación de PDF de liquidación

### 5. Control de Asistencia
- Registro de entrada/salida
- Filtros por fecha, personal
- Reportes de asistencia

### 6. Activos
- Inventario de activos del condominio
- Categorización por tipo
- Control de valor actual

### 7. Proveedores
- Directorio de proveedores
- Datos de contacto
- Estado activo/inactivo

### 8. Órdenes de Trabajo (OT)
- Creación, edición, eliminación de OT
- Asignación de personal, materiales, herramientas, tareas
- Seguimiento de progreso
- Control de tiempo estimado vs real
- Cálculo de costos
- Estados: Pendiente, En Progreso, Completado, Cancelado
- Prioridades: Urgente, Alta, Media, Baja
- Tipos: Correctivo, Preventivo, Mejora, Emergencia
- Aprobación de supervisor
- Generación de PDF
- Exportación CSV

### 9. Gastos y Rendición
- Registro de gastos
- Control de caja chica
- Aprobación de gastos
- Centro de costo asociado

### 10. Centros de Costo
- Presupuesto mensual y anual
- Seguimiento de gastos por centro
- Alertas de presupuesto excedido

### 11. Proyectos
- Gestión de proyectos de mejora
- Presupuesto y avance
- Recursos asignados

### 12. Inspecciones
- Programación de inspecciones
- Registro de fotos (antes, durante, después)
- Estado y seguimiento

### 13. Catálogos
- **Materiales:** Códigos, precios, stock
- **Herramientas:** Estado, ubicación, valor
- **Tareas:** Tiempo estimado, frecuencia

### 14. Inventario
- Control de stock
- Alertas de bajo stock
- Ajustes de inventario

### 15. Herramientas
- Gestión de herramientas propias
- Estado, ubicación, valor de reposición

### 16. Materiales
- Catálogo de materiales
- Precios actualizados

### 17. Tareas
- Tareas predefinidas para OT
- Tiempos estimados

### 18. Reservas
- Reserva de espacios comunes
- Estados: Pendiente, Confirmada, Completada, Cancelada
- Control de pagos

### 19. Gastos Comunes
- Emisión de gastos comunes mensuales
- Detalle por categoría
- Seguimiento de pagos

### 20. Morosidad
- Control de deudores
- Días de mora
- Acciones de cobranza

### 21. Notificaciones
- Envío de notificaciones
- Tipos: Info, Alerta, Urgente, Recordatorio
- Destinatarios: Todos, Residentes, Personal, Administración

### 22. Contabilidad
- Plan de cuentas
- Asientos contables
- Balance débito/crédito

### 23. Cumplimiento Legal
- Control de obligaciones legales
- Vencimientos
- Documentación

### 24. Auditoría
- Auditorías internas
- Hallazgos y acciones correctivas
- Items de verificación

### 25. Rondas y Control
- Puntos de ronda con QR
- Registro de rondas
- Incidencias

### 26. Reportes
- Generación de reportes
- Exportación PDF/Excel

### 27. Usuarios
- Gestión de usuarios del sistema
- Roles: admin, supervisor, auditor, usuario, personal
- Permisos granulares (53 permisos)
- Activación/desactivación

### 28. Portal Residentes
- Vista para residentes
- Consulta de gastos comunes
- Reservas

### 29. Comité
- Gestión del comité de administración
- Sesiones y acuerdos

### 30. Aprobaciones
- Seguimiento de aprobaciones pendientes
- Historial de aprobaciones

### 31. Aprobaciones OT
- Aprobación específica de órdenes de trabajo

### 32. Backups
- Configuración de respaldos
- Restauración

### 33. Notificaciones Módulo
- Centro de notificaciones

### 34. Auditor Module
- Registro de acciones del sistema
- Logs de acceso

### 35. Tiempo de Confirmación
- Métricas de tiempo de respuesta

### 36. Cumplimiento
- Indicadores de cumplimiento

---

## API Routes (123 endpoints)

### Autenticación
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

### CRUD Entidades
- /api/usuarios
- /api/residentes
- /api/personal
- /api/propiedades
- /api/activos
- /api/proveedores
- /api/ordenes-trabajo
- /api/gastos
- /api/centros-costo
- /api/proyectos
- /api/inspecciones
- /api/reservas
- /api/gastos-comunes
- /api/morosidad
- /api/notificaciones
- /api/contabilidad
- /api/cumplimiento
- /api/auditoria
- /api/rondas
- /api/asistencia
- /api/catalogos/*

### PDF Generation
- /api/pdf/orden-trabajo/[id]
- /api/pdf/liquidacion/[id]
- /api/pdf/carta-cobranza/[id]
- /api/pdf/estado-cuenta/[id]

### Importación/Exportación
- /api/import/residentes
- /api/import/personal
- /api/residentes/bulk
- /api/personal/bulk

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/                 # API Routes (123 archivos)
│   ├── sistema/             # Página principal del sistema
│   ├── login/               # Página de login
│   ├── descargar/           # Descargas
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Layout principal
│   └── globals.css          # Estilos globales
├── components/
│   ├── ui/                  # Componentes shadcn/ui (52 componentes)
│   ├── Dashboard.tsx        # Dashboard principal
│   ├── Sidebar.tsx          # Navegación lateral
│   ├── MainContent.tsx      # Contenido principal
│   ├── [modulo]Module.tsx   # 36 módulos
│   └── shared/              # Componentes compartidos
├── hooks/
│   ├── use-session.ts       # Hook de sesión
│   └── use-mobile.ts        # Detección móvil
├── lib/
│   ├── auth.ts              # Autenticación
│   ├── db.ts                # Cliente Prisma
│   ├── store.ts             # Estado global (Zustand)
│   ├── api-utils.ts         # Utilidades API
│   └── utils.ts             # Utilidades generales
└── types/
    └── index.ts             # Tipos TypeScript
```

---

## Tecnologías Utilizadas

- **Framework:** Next.js 16 con App Router
- **Lenguaje:** TypeScript 5
- **ORM:** Prisma
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **UI:** shadcn/ui + Tailwind CSS 4
- **Estado:** Zustand
- **Iconos:** Lucide React
- **Gráficos:** Recharts
- **Exportación:** xlsx, jspdf

---

## Roles y Permisos

### Admin
- Acceso total a todos los módulos
- Gestión de usuarios y configuración

### Supervisor
- Aprobación de OT y gastos
- Supervisión de personal
- Reportes

### Auditor
- Solo lectura
- Acceso a logs y auditoría
- Reportes

### Usuario
- Operaciones básicas
- Crear OT
- Ver información

### Personal
- Solo ver OT asignadas
- Actualizar progreso
- Registrar asistencia

---

## Mantenimiento

### Respaldo de Base de Datos
```bash
# SQLite
cp db/custom.db db/backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump condominio > backup.sql
```

### Actualización de Dependencias
```bash
bun update
```

### Verificación de Integridad
```bash
bun run lint
bunx prisma validate
```

---

## Soporte

**Asesorías Integrales CyJ**
- Teléfono: +56 964 650 643
- Email: asesoriasintegralescyj@gmail.com
- Dirección: Av. La Montaña Norte 3650, Lampa

---

## Licencia

Todos los derechos reservados © 2024-2026 Asesorías Integrales CyJ
