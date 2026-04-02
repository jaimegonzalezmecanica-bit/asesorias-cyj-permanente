# Guía de Despliegue Permanente: Sistema de Gestión CYJ

Esta guía te llevará paso a paso para desplegar tu proyecto de forma permanente en **Vercel**, utilizando **GitHub** como tu repositorio de código. Esto te proporcionará una URL profesional y un flujo de trabajo de despliegue continuo (CI/CD) para futuras actualizaciones.

## 1. Preparación del Repositorio en GitHub

El primer paso es asegurarte de que tu código esté en un repositorio de GitHub. Si ya lo tienes, puedes saltar al paso 1.3.

### 1.1. Crear un Nuevo Repositorio en GitHub

1.  Ve a [github.com](https://github.com) e inicia sesión en tu cuenta.
2.  Haz clic en el botón **"New"** (Nuevo) para crear un nuevo repositorio.
3.  Dale un nombre significativo, por ejemplo, `asesorias-integrales-cyj-produccion`.
4.  Asegúrate de que sea **Público** o **Privado** según tus preferencias (Privado es recomendado para proyectos empresariales).
5.  **NO** marques la opción para inicializar el repositorio con un `README`, `.gitignore` o licencia en este momento, ya que tu proyecto local ya tiene estos archivos.
6.  Haz clic en **"Create repository"** (Crear repositorio).

### 1.2. Subir tu Código Local a GitHub

Ahora, conecta tu proyecto local con el repositorio remoto que acabas de crear:

1.  Abre una terminal (o `Git Bash` si estás en Windows) en la carpeta raíz de tu proyecto local (`C:\Users\jaime\OneDrive\Escritorio\Proyecto`).
2.  Inicializa un repositorio Git local (si no lo has hecho ya):
    ```bash
    git init
    ```
3.  Añade todos tus archivos al área de preparación:
    ```bash
    git add .
    ```
4.  Confirma tus cambios con un mensaje descriptivo:
    ```bash
    git commit -m "Initial commit: Proyecto optimizado y listo para produccion"
    ```
5.  Renombra la rama principal a `main` (convención moderna):
    ```bash
    git branch -M main
    ```
6.  Conecta tu repositorio local con el remoto de GitHub. **Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub y `asesorias-integrales-cyj-produccion` con el nombre de tu repositorio**:
    ```bash
    git remote add origin https://github.com/TU_USUARIO/asesorias-integrales-cyj-produccion.git
    ```
7.  Sube tus archivos a GitHub:
    ```bash
    git push -u origin main
    ```
    *   Es posible que se te pida iniciar sesión en GitHub a través de tu navegador o con un Personal Access Token.

### 1.3. Verificar el Repositorio

Una vez completado el `git push`, visita la URL de tu repositorio en GitHub (ej. `https://github.com/TU_USUARIO/asesorias-integrales-cyj-produccion`). Deberías ver todos tus archivos de proyecto cargados.

## 2. Despliegue Permanente en Vercel

Ahora que tu código está en GitHub, puedes conectarlo con Vercel para el despliegue continuo.

### 2.1. Importar el Proyecto en Vercel

1.  Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub (si aún no lo has hecho).
2.  En tu Dashboard de Vercel, haz clic en **"Add New..."** (Añadir Nuevo) y luego en **"Project"** (Proyecto).
3.  Vercel te mostrará una lista de tus repositorios de GitHub. Selecciona el repositorio `asesorias-integrales-cyj-produccion` que acabas de crear.
4.  Haz clic en **"Import"** (Importar).

### 2.2. Configuración del Proyecto en Vercel

Vercel detectará automáticamente que es un proyecto de Next.js. Antes de desplegar, es **CRÍTICO** configurar las variables de entorno para producción.

1.  En la pantalla de configuración del proyecto, expande la sección **"Environment Variables"** (Variables de Entorno).
2.  Añade las siguientes variables. Asegúrate de que los valores sean los correctos para tu entorno de producción:

    | Variable | Descripción | Valor de Ejemplo (¡Reemplaza con tus valores reales!) |
    | :------- | :---------- | :---------------------------------------------------- |
    | `DATABASE_URL` | **URL de conexión a tu base de datos de producción.** Esta debe ser una base de datos externa (ej. TiDB Cloud, Supabase, PlanetScale, Neon, etc.), no la SQLite local que usamos para la demo. | `mysql://user:password@host:port/database` |
    | `NEXTAUTH_SECRET` | **Clave secreta para encriptar las sesiones de usuario.** Genera una cadena aleatoria larga y compleja. Puedes usar un generador de contraseñas seguras. | `super_secreto_y_largo_mas_de_32_caracteres_aleatorios` |
    | `NEXTAUTH_URL` | **La URL pública de tu sitio web.** Vercel te proporcionará una URL por defecto (ej. `https://tu-proyecto.vercel.app`). | `https://asesorias-cyj.vercel.app` (o tu dominio personalizado) |
    | `INIT_ADMIN_TOKEN` | **Token de seguridad para proteger los endpoints de inicialización.** Elige una clave secreta fuerte. | `MiTokenSecretoParaAdmin123!` |

    *   **Importante**: Para `DATABASE_URL`, asegúrate de que tu proveedor de base de datos permita conexiones desde las IPs de Vercel. Si usas servicios como TiDB Cloud, esto suele estar configurado por defecto.

### 2.3. Desplegar el Proyecto

1.  Una vez que hayas configurado todas las variables de entorno, haz clic en el botón **"Deploy"** (Desplegar).
2.  Vercel comenzará el proceso de construcción y despliegue de tu aplicación. Esto puede tardar unos minutos.
3.  Cuando el despliegue sea exitoso, Vercel te proporcionará la URL de tu sitio web en producción.

## 3. Post-Despliegue: Inicialización de Datos en Producción

Una vez que tu sitio esté en vivo, es crucial inicializar los datos necesarios de forma segura. **No uses estos endpoints en un entorno de producción sin entender completamente su función.**

1.  **Cargar Catálogos Iniciales**: Para cargar los datos maestros (materiales, herramientas, tareas, centros de costo), envía una petición `POST` a la API de tu sitio web. Puedes usar herramientas como `curl`, Postman o Insomnia.
    *   **URL**: `https://TU_DOMINIO.vercel.app/api/seed-catalogos`
    *   **Método**: `POST`
    *   **Headers**: `Content-Type: application/json`
    *   **Body (JSON)**: `{"token":"TU_INIT_ADMIN_TOKEN"}` (Usa el mismo token que configuraste en Vercel).

2.  **Crear Usuario Administrador Inicial**: Para crear el primer usuario administrador del sistema:
    *   **URL**: `https://TU_DOMINIO.vercel.app/api/auth/init-admin`
    *   **Método**: `POST`
    *   **Headers**: `Content-Type: application/json`
    *   **Body (JSON)**: `{"token":"TU_INIT_ADMIN_TOKEN"}`
    *   **Credenciales del Admin Creado**: `admin@cyj.cl` / `admin123` (Estas son las credenciales por defecto que se crean. **Cámbialas inmediatamente después de iniciar sesión por primera vez**).

## 4. Mantenimiento y Actualizaciones Futuras

Una de las ventajas de Vercel con GitHub es el despliegue continuo:

-   Cada vez que hagas un `git push` a la rama `main` de tu repositorio de GitHub, Vercel detectará los cambios y automáticamente iniciará un nuevo despliegue de tu aplicación.
-   Puedes monitorear el estado de tus despliegues en el Dashboard de Vercel.
-   Para revertir a una versión anterior, Vercel te permite hacer *rollbacks* con un solo clic.

--- 

¡Felicidades! Tu Sistema de Gestión CYJ ahora está desplegado de forma permanente y listo para ser utilizado en producción. Recuerda mantener tus variables de entorno seguras y actualizar tu código regularmente. 
