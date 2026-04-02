# Guía de Despliegue a Producción: Sistema de Gestión CYJ

Esta guía detalla los pasos exactos para llevar tu proyecto desde tu escritorio a la web usando **GitHub** y **Vercel**. He optimizado el código para que sea compatible con estas plataformas.

## 1. Preparación en GitHub

Para desplegar en Vercel, primero debemos subir el código a un repositorio de GitHub.

1.  **Crea un Repositorio**: Ve a [github.com](https://github.com) y crea un nuevo repositorio llamado `asesorias-integrales-cyj`.
2.  **Sube tu Código**:
    *   Abre una terminal en la carpeta de tu proyecto (`C:\Users\jaime\OneDrive\Escritorio\Proyecto`).
    *   Ejecuta los siguientes comandos:
        ```bash
        git init
        git add .
        git commit -m "Initial commit: Proyecto optimizado para producción"
        git branch -M main
        git remote add origin https://github.com/TU_USUARIO/asesorias-integrales-cyj.git
        git push -u origin main
        ```

## 2. Configuración en Vercel

Vercel detectará automáticamente que es un proyecto de Next.js.

1.  **Conecta tu Cuenta**: Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2.  **Importa el Proyecto**: Haz clic en **"Add New"** -> **"Project"** y selecciona el repositorio que acabas de subir.
3.  **Configura las Variables de Entorno**: Antes de darle a "Deploy", expande la sección **"Environment Variables"** y añade las siguientes (son críticas):
    | Variable | Valor Recomendado | Descripción |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | Tu URL de base de datos (ej. TiDB o Supabase) | Conexión a la DB de producción. |
    | `NEXTAUTH_SECRET` | Genera una cadena aleatoria larga | Clave para encriptar sesiones. |
    | `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | La URL final de tu sitio. |
    | `INIT_ADMIN_TOKEN` | Una clave secreta (ej. `Admin123!_CYJ`) | Protege los endpoints de configuración. |
4.  **Despliega**: Haz clic en **"Deploy"**. Vercel compilará el código y te dará una URL pública.

## 3. Post-Despliegue: Inicialización de Datos

Una vez que el sitio esté en vivo, debes cargar los datos iniciales de forma segura:

1.  **Cargar Catálogos**: Envía una petición POST a `https://tu-proyecto.vercel.app/api/seed-catalogos` incluyendo el token en las cabeceras:
    *   `Authorization: Bearer TU_INIT_ADMIN_TOKEN`
2.  **Crear Administrador**: Haz lo mismo con `/api/auth/init-admin`.

## Resumen de Mejoras Aplicadas para Producción

| Área | Mejora Implementada |
| :--- | :--- |
| **Seguridad** | Endpoints de seed protegidos y logout con invalidación real en DB. |
| **Rendimiento** | Consultas de Dashboard optimizadas con agregaciones SQL nativas. |
| **Móvil** | Gestos de *swipe* para completar tareas y registro de notas de incumplimiento. |
| **Estabilidad** | Prevención de *race conditions* en saldos de caja chica y folios de OT. |

---

**Nota Importante**: Asegúrate de que tu base de datos (TiDB/MySQL) acepte conexiones desde las IPs de Vercel. Si usas TiDB Cloud, esto suele estar permitido por defecto.
