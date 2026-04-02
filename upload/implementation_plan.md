# Plan de Implementación: SaaS Administración de Condominios

Este documento detalla la arquitectura, tecnologías y pasos para construir la plataforma web de administración de condominios, cubriendo residentes, pagos, órdenes de mantenimiento y dashboard.

## User Review Required
> [!IMPORTANT]
> Requiero tu confirmación sobre las siguientes decisiones técnicas:
> 1. **ORM de Base de Datos:** Propongo utilizar **Prisma** con PostgreSQL, ya que ofrece un excelente tipado (si usamos TypeScript) y facilidad de uso en backend. ¿Estás de acuerdo, o prefieres Sequelize/TypeORM?
> 2. **Framework de Frontend:** Propongo utilizar **Vite + React** con TailwindCSS para crear un diseño moderno, rápido y con estética súper premium (dark mode, glassmorphism, colores vibrantes). ¿Estás de acuerdo con el uso de TailwindCSS, o prefieres Vanilla CSS estricto?
> 3. **Estructura:** Ya existen las carpetas `backend/` y `frontend/`. Mantenemos esta separación, pero ¿tienes algún requerimiento para el boilerplate inicial (ej. NestJS vs Express para backend)? Propongo **Express.js** por simplicidad y rapidez.

## Proposed Changes

### 1. Base de Datos (PostgreSQL)
Se crearán los siguientes modelos principales usando Prisma:
- **Condominium** (Condominios)
- **User** / **Admin** (Usuarios del sistema para acceso al dashboard)
- **Resident** (Residentes asociados a una unidad y condominio)
- **Payment** (Historial de pagos: relación con residente, montos, estado de pago)
- **MaintenanceOrder** (Órdenes de Mantenimiento: relación con condominio, descripción, estado)

### 2. Backend (Node.js/Express)
[NEW] [backend/package.json](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/backend/package.json) - Inicialización de dependencias (Express, Prisma, CORS)
[NEW] [backend/src/index.js](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/backend/src/index.js) - Server setup
[NEW] [backend/prisma/schema.prisma](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/backend/prisma/schema.prisma) - Definición del esquema de DB
[NEW] `backend/src/routes/*.js` - Rutas REST (residents, payments, maintenance, dashboard)
[NEW] `backend/src/controllers/*.js` - Controladores lógicos
[NEW] `backend/src/services/*.js` - Capa de servicios y acceso a datos

### 3. Frontend (React/Vite)
[NEW] [frontend/package.json](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/package.json) - Inicialización Vite + dependencias de UI (Tailwind, Lucide-React, React-Router-DOM)
[NEW] [frontend/src/App.jsx](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/src/App.jsx) - Configuración de React Router
[NEW] [frontend/src/pages/Dashboard.jsx](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/src/pages/Dashboard.jsx) - Métricas clave y resumen general
[NEW] [frontend/src/pages/Residents.jsx](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/src/pages/Residents.jsx) - Listado y gestión CRUD de residentes
[NEW] [frontend/src/pages/Payments.jsx](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/src/pages/Payments.jsx) - Control de ingresos
[NEW] [frontend/src/pages/Maintenance.jsx](file:///c:/Users/jaime/Desktop/ADMINISTRACION%202026/MATERIAL%20LAGUNA/ai-software-factory/frontend/src/pages/Maintenance.jsx) - Control de solicitudes de soporte/mantenimiento
[NEW] `frontend/src/components/*` - Componentes atómicos (Botones, Tablas, Layouts)

## Verification Plan

### Automated Tests
- Testear endpoints críticos del backend (crear residente, consultar pagos) utilizando Jest.
- Ejecutar mediante `npm run test` dentro de `backend/`.

### Manual Verification
1. Ingresar a la URL del frontend localmente.
2. Comprobar que el diseño visual cumpla con las mejores prácticas y sea responsivo.
3. Crear un **Residente** en el módulo correspondiente.
4. Asignarle un **Pago** y ver que su estado cambie a "Pagado".
5. Crear una **Orden de Mantenimiento** y cambiar su estado.
6. Regresar al **Dashboard** y validar que las gráficas/números reflejen estas 3 acciones correctamente.

---

## Fase 2: Expansión a ERP de Condominios

Debido a los requerimientos, el sistema evolucionará a un **ERP completo** con Control de Acceso basado en Roles (RBAC).

### A. Autenticación y Autorización
- **Usuarios y Roles (Admin vs Supervisor):** Implementación de JWT. El `Administrador` tiene control total. El `Supervisor` solo podrá visualizar y crear Órdenes de Trabajo, crear Rendiciones de Gastos (para aprobación) y realizar tareas operativas limitadas según el menú.
- **Módulo Usuarios:** Gestión de cuentas, reseteo de contraseñas y asignación de roles.

### B. Módulos Operativos
- **Menú Lateral / Sidebar:** Actualizado para contener: Dashboard, Órdenes de Trabajo, Activos, Usuarios, Personal, Proveedores, Alertas, Planificación, Inspecciones, Proyectos, Costos, Tareas y Herramientas, Informes, Reservas, Rendición Gastos.
- **Gestión de Activos:** Registro de equipos y bienes detallando Categoría, Estado, Ubicación, Nº Serie, Fechas, Costos, Asignación y Descripción.
- **Inspecciones:** Formulario dinámico con Tipo, Tema, Lugar, Empleado y sección para "+ Observación" y "+ Recomendación" (listas dinámicas). Firmas.
- **Proveedores:** CRUD con datos de contacto, RUT/TaxID, categoría de servicio.
- **Personal (RRHH):** Gestión de empleados (Conserjes, Guardias, Aseo). Incluye generación de **Liquidaciones de Sueldo** exportables de forma individual o masiva (.PDF).

### C. Sistema de Mantenimiento Avanzado
- **Catálogos Maestros (Costos y Recursos):**
  - **Centro de Costos:** Categorización financiera (Ej. Herramientas, Activos, Limpieza, Mantención).
  - **Catálogos de Trabajo:** Listados maestros de **Tareas, Materiales y Herramientas** (con costo unitario) para uso en las OT.
- **Órdenes de Trabajo (OT) Exhaustivas:**
  - Diseño estilo "Excel" (según diseño referencial).
  - Al designar personal, materiales o proveedor, la OT consumirá de los catálogos maestros creados previamente para *cuantificar cantidades y costos*.
  - **Registro Fotográfico:** Carga de imágenes para "Antes", "Durante" y "Después".
  - Fila de Lista de Tareas con checkboxes ("Cumple" / "No Cumple").
- **Proyectos / Planificación de OT:** Módulo para agrupar tareas mayores ("Nuevo Proyecto"). Incluye datos básicos, presupuesto utilizado/programado, barra de avance (%), y pestañas: Herramientas, Materiales, Mano de Obra, Checklist, Documentos.

### D. Sistema Financiero Secundario
- **Rendición de Gastos:**
  - Control de saldo de Caja Chica.
  - El **Supervisor** registra el gasto (Nº Boleta, Monto, Centro de Costo, Archivo adjunto).
  - El gasto se crea en estado `Pendiente`.
  - El **Administrador** revisa y cambia el estado a `Aprobado` (o también puede crearlos directamente autorizados).

### E. Importaciones, Exportaciones y Acciones Transversales
- **Importación Masiva (Excel/CSV):** 
  - Subida de archivos para poblar la base de datos de manera masiva en los módulos de **Residentes** y **Personal**.
- **Acciones Universales en Tablas:**
  - Todas las tablas de datos (data-tables) tendrán iconos universales de Acción: `Visualizar`, `Editar`, `Eliminar`, `Imprimir`, `PDF`, `Excel`.
  
---

## Stack Tecnológico para Fase 2
- **Manejo de Roles:** Middleware tipo `requireRole('ADMIN')` en Express.
- **Exportaciones PDF/Excel:** Uso de `jspdf`, `jspdf-autotable` para PDFs (Liquidaciones y Tablas) y `xlsx` / `file-saver` para exportar a Excel.
- **Importaciones Excel:** Uso de `xlsx` (SheetJS) para parsear el archivo subido en el frontend y enviarlo como array de objetos al backend.
- **Subida de Archivos (Fotos y Boletas):** Uso de `multer` en el backend para guardar archivos localmente (o configuración S3 a futuro), y previsualizaciones base64 o URL.
