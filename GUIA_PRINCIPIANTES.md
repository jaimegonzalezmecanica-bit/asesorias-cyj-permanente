# 🚀 GUÍA ULTRA DETALLADA - DESPLIEGUE EN PRODUCCIÓN GRATIS

## Sistema de Gestión para Condominios - Asesorías Integrales CyJ

---

# 📋 ANTES DE EMPEZAR - QUÉ NECESITAS

## Opción A: Si estás viendo esto en el navegador del sistema

Tienes acceso al código del sistema. Sigue los pasos abajo.

## Opción B: Si tienes el proyecto en tu computadora

Perfecto, sigue los pasos directamente.

---

# 🔑 PASO 1: CREAR CUENTA EN GITHUB (5 minutos)

GitHub es donde guardaremos el código para que Vercel pueda leerlo.

## 1.1 Ir a GitHub

1. Abre tu navegador (Chrome, Firefox, Edge, etc.)
2. En la barra de direcciones escribe: **github.com**
3. Presiona **Enter**

## 1.2 Crear cuenta

1. Busca el botón verde que dice **"Sign up"** (arriba a la derecha)
2. Click en **"Sign up"**
3. Te pedirá:
   - **Email:** Escribe tu correo electrónico (ej: tucorreo@gmail.com)
   - **Password:** Crea una contraseña segura
   - **Username:** Elige un nombre de usuario (ej: tunombre123)
4. Click en **"Create account"**
5. GitHub te enviará un código a tu email
6. Abre tu email, copia el código
7. Pégalo en GitHub
8. Responde las preguntas (puedes seleccionar "Skip" en las que no quieras responder)
9. Click en **"Complete setup"**

## 1.3 Verificar cuenta

1. GitHub te enviará otro email para verificar
2. Abre el email y click en **"Verify email address"**

✅ **¡Ya tienes GitHub!** Ahora tienes una cuenta donde puedes guardar tu código.

---

# 🔑 PASO 2: CREAR CUENTA EN VERCEL (3 minutos)

Vercel es el servicio que alojará tu sistema en internet GRATIS.

## 2.1 Ir a Vercel

1. Abre una nueva pestaña en tu navegador
2. Escribe: **vercel.com**
3. Presiona **Enter**

## 2.2 Crear cuenta con GitHub

1. Busca el botón **"Sign Up"** (arriba a la derecha)
2. Click en **"Sign Up"**
3. Verás varias opciones (Google, GitHub, GitLab, Bitbucket)
4. **Click en "Continue with GitHub"** (es la opción más fácil porque ya creaste GitHub)
5. GitHub te preguntará si autorizas a Vercel
6. Click en **"Authorize Vercel"**
7. Vercel puede preguntarte si quieres unirte a un equipo
8. Selecciona **"Continue with free account"** (cuenta gratis)
9. Puedes saltar las preguntas de configuración

✅ **¡Ya tienes Vercel!** Tu cuenta de Vercel está conectada con GitHub.

---

# 🔑 PASO 3: CREAR BASE DE DATOS GRATIS CON NEON (5 minutos)

Neon nos dará una base de datos PostgreSQL gratis para siempre.

## 3.1 Ir a Neon

1. Abre una nueva pestaña
2. Escribe: **neon.tech**
3. Presiona **Enter**

## 3.2 Crear cuenta

1. Click en **"Sign up"** (arriba a la derecha)
2. Verás varias opciones
3. **Click en "Sign up with GitHub"** (más fácil)
4. Autoriza a Neon para acceder a tu GitHub
5. Acepta los términos de servicio

## 3.3 Crear proyecto de base de datos

1. Después de crear cuenta, Neon te pedirá crear un proyecto
2. Llena los campos:
   - **Project name:** Escribe `cyj-database`
   - **Region:** Selecciona `US East (Ohio)` o `AWS/us-east-2`
   - No cambies las otras opciones
3. Click en **"Create project"**

## 3.4 COPIAR LA URL DE LA BASE DE DATOS (¡MUY IMPORTANTE!)

1. Neon te mostrará una pantalla con información de tu base de datos
2. Busca la sección **"Connection Details"**
3. Verás algo como:
   - **Connection string** con una URL larga
   - Hay un botón para seleccionar **"Pooled connection"** o **"Direct connection"**
4. **Selecciona "Pooled connection"** (importante para Vercel)
5. La URL se ve así:
   ```
   postgresql://default:AbCdEf123456@ep-xxx-yyy.us-east-2.aws.neon.tech/verceldb?sslmode=require
   ```
6. Click en el botón **"Copy"** (icono de copiar)
7. **ABRE EL BLOC DE NOTAS** (Notepad en Windows, TextEdit en Mac)
8. **PEGA la URL** en el bloc de notas
9. **GUARDA ESTE ARCHIVO** como `datos-base-de-datos.txt` en tu escritorio

✅ **¡Ya tienes tu base de datos!** No pierdas esa URL.

---

# 📦 PASO 4: DESCARGAR Y SUBIR EL CÓDIGO A GITHUB (10 minutos)

## 4.1 Si tienes acceso al código en este momento

El código está en `/home/z/my-project/`. Necesitamos subirlo a GitHub.

## 4.2 Crear repositorio en GitHub

1. Ve a **github.com** (ya deberías estar logueado)
2. Click en el **icono "+"** (arriba a la derecha)
3. Selecciona **"New repository"**
4. Llena los campos:
   - **Repository name:** Escribe `cyj-condominios`
   - **Description:** Escribe `Sistema de gestión para condominios`
   - **Selecciona "Private"** (para que solo tú lo veas)
   - **NO selecciones** "Add a README file"
   - **NO selecciones** ninguna opción de gitignore o license
5. Click en **"Create repository"**

## 4.3 Obtener el código

**OPCIÓN A: Si estás en el sistema ahora mismo**

El código completo está en `/home/z/my-project/`. 

**OPCIÓN B: Si necesitas descargar el proyecto**

Debes descargar todo el proyecto como un archivo ZIP.

## 4.4 Subir archivos a GitHub (Forma Fácil)

### Método 1: Usando GitHub Desktop (RECOMENDADO para principiantes)

1. Descarga **GitHub Desktop** de: https://desktop.github.com
2. Instálalo en tu computadora
3. Abre GitHub Desktop
4. Inicia sesión con tu cuenta de GitHub (File > Options > Accounts)
5. Click en **"File"** > **"Add local folder"**
6. Selecciona la carpeta del proyecto
7. Click en **"Publish branch"** (arriba a la derecha)
8. Repository name: `cyj-condominios`
9. Click en **"Publish repository"**

### Método 2: Subir archivos directamente en la web

1. En la página de tu repositorio en GitHub
2. Click en **"uploading an existing file"**
3. Arrastra todos los archivos del proyecto
4. Click en **"Commit changes"**

---

# 🚀 PASO 5: CONECTAR VERCEL CON GITHUB (5 minutos)

## 5.1 Ir a Vercel

1. Ve a **vercel.com**
2. Deberías estar logueado (si no, inicia sesión con GitHub)
3. Click en **"Add New..."** (botón negro arriba a la derecha)
4. Selecciona **"Project"**

## 5.2 Importar repositorio

1. Verás una lista de tus repositorios de GitHub
2. Busca `cyj-condominios`
3. Click en **"Import"** (botón azul)

## 5.3 Configurar el proyecto

Verás una pantalla de configuración. **NO HAGAS CLICK EN "Deploy" AÚN**.

Primero debemos configurar las variables de entorno.

---

# ⚙️ PASO 6: CONFIGURAR VARIABLES DE ENTORNO (CRÍTICO)

Este paso es **MUY IMPORTANTE**. Sin estas variables, el sistema NO funcionará.

## 6.1 Buscar "Environment Variables"

En la pantalla de configuración de Vercel:

1. Busca la sección **"Environment Variables"** (puede estar colapsada)
2. Click en ella para expandirla
3. Verás campos para agregar variables

## 6.2 Agregar la primera variable: DATABASE_URL

1. En el campo **"Key"** escribe: `DATABASE_URL`
2. En el campo **"Value"** pega la URL de Neon que guardaste en el bloc de notas
   - Se ve así: `postgresql://default:xxxxx@ep-xxx.neon.tech/verceldb?sslmode=require`
3. Click en **"Add"**

## 6.3 Agregar la segunda variable: NEXTAUTH_SECRET

1. En **"Key"** escribe: `NEXTAUTH_SECRET`
2. En **"Value"** necesitas generar un texto aleatorio largo

**Para generar el secreto:**

- **Opción A:** Usa este valor generado (cámbialo después):
  ```
  cyj-condominios-secreto-seguro-2026-produccion-xyz123456789
  ```

- **Opción B:** Genera uno propio:
  - Abre una terminal (símbolo del sistema en Windows)
  - Escribe: `openssl rand -base64 32`
  - Copia el resultado

3. Pega el secreto en **"Value"**
4. Click en **"Add"**

## 6.4 Agregar la tercera variable: NEXTAUTH_URL

1. En **"Key"** escribe: `NEXTAUTH_URL`
2. En **"Value"** escribe la URL que tendrá tu proyecto
   - Por ahora, usa esta plantilla: `https://cyj-condominios.vercel.app`
   - **Nota:** Si tu repositorio tiene otro nombre, usa ese nombre
   - El formato siempre es: `https://NOMBRE-DE-TU-PROYECTO.vercel.app`
3. Click en **"Add"**

## 6.5 Verificar variables

Debes ver 3 variables listadas:

| Key | Value |
|-----|-------|
| DATABASE_URL | postgresql://... |
| NEXTAUTH_SECRET | cyj-condominios-... |
| NEXTAUTH_URL | https://cyj-condominios... |

---

# ✅ PASO 7: DESPLEGAR (2 minutos)

## 7.1 Click en Deploy

1. Desplázate hacia arriba en la página de configuración
2. Click en el botón azul grande **"Deploy"**

## 7.2 Esperar

1. Verás una animación de construcción
2. Tardará entre **2 a 5 minutos**
3. Verás diferentes etapas:
   - "Installing dependencies..."
   - "Building..."
   - "Collecting build outputs..."
   - "Deploying..."

## 7.3 ¡Felicidades!

1. Cuando termine, verás un mensaje **"Congratulations!"**
2. Verás confeti en la pantalla
3. Click en **"Continue to Dashboard"**

---

# 🎉 PASO 8: VERIFICAR Y ACCEDER (3 minutos)

## 8.1 Obtener la URL de tu sitio

1. En el Dashboard de Vercel, verás tu proyecto
2. Arriba verás una URL como: `https://cyj-condominios-xyz123.vercel.app`
3. Click en esa URL para abrir tu sitio

## 8.2 Inicializar la base de datos

**¡IMPORTANTE!** Primero debes inicializar la base de datos:

1. En tu navegador, agrega `/api/init-db` al final de tu URL
2. La URL completa será algo como:
   ```
   https://cyj-condominios-xyz123.vercel.app/api/init-db
   ```
3. Presiona **Enter**
4. Verás un mensaje JSON como:
   ```json
   {
     "success": true,
     "message": "Base de datos inicializada correctamente",
     "credentials": {
       "email": "admin@cyjcondominios.cl",
       "password": "admin123"
     }
   }
   ```

## 8.3 Iniciar sesión

1. Ve a tu URL principal: `https://cyj-condominios-xyz123.vercel.app`
2. Verás la página de login
3. Escribe:
   - **Email:** `admin@cyjcondominios.cl`
   - **Password:** `admin123`
4. Click en **"Iniciar Sesión"**

## 8.4 ¡ESTÁS DENTRO!

Ahora verás el dashboard del sistema de condominios.

⚠️ **IMPORTANTE: Cambia la contraseña inmediatamente**

1. Click en tu nombre de usuario (arriba a la derecha)
2. Busca la opción para cambiar contraseña
3. Crea una contraseña nueva y segura

---

# 📱 PASO 9: ACCEDER DESDE OTROS DISPOSITIVOS

## Desde tu celular:

1. Abre el navegador de tu celular
2. Escribe la URL de tu sistema: `https://cyj-condominios-xxx.vercel.app`
3. Inicia sesión con tus credenciales
4. ¡El sistema funciona perfecto en móviles!

## Desde otra computadora:

1. Simplemente abre el navegador
2. Escribe la misma URL
3. Inicia sesión

---

# 🔄 PASO 10: CÓMO ACTUALIZAR EL SISTEMA

Si haces cambios en el código:

## Usando GitHub Desktop:

1. Abre GitHub Desktop
2. Verás los archivos modificados listados
3. Escribe un mensaje en "Summary" (ej: "Nuevas funciones")
4. Click en **"Commit to main"**
5. Click en **"Push origin"**
6. Vercel detectará el cambio automáticamente y actualizará tu sitio

---

# ❓ PROBLEMAS COMUNES

## "La página no carga"

1. Espera 1-2 minutos después del deploy
2. Refresca la página (F5)
3. Verifica que la URL sea correcta

## "Error de base de datos"

1. Ve a Neon.tech y verifica que la base de datos esté activa
2. Verifica que DATABASE_URL esté correcta en Vercel
3. Asegúrate de haber visitado `/api/init-db`

## "No puedo iniciar sesión"

1. Verifica que hayas visitado `/api/init-db` primero
2. Usa exactamente: `admin@cyjcondominios.cl`
3. Contraseña: `admin123`

## "Error en el build"

1. Ve a Vercel Dashboard
2. Click en tu proyecto
3. Click en la pestaña **"Deployments"**
4. Click en el deployment fallido
5. Lee los logs para ver el error

---

# 💰 RESUMEN DE COSTOS

| Servicio | Plan | Costo Mensual |
|----------|------|---------------|
| GitHub | Free | $0 |
| Vercel | Hobby | $0 |
| Neon Database | Free | $0 |
| **TOTAL** | | **$0** |

---

# 📝 INFORMACIÓN IMPORTANTE PARA GUARDAR

Escribe esto en tu bloc de notas:

```
=== SISTEMA CYJ CONDOMINIOS - INFORMACIÓN ===

URL del sistema: https://________________.vercel.app

CREDENCIALES:
- Email: admin@cyjcondominios.cl
- Password: admin123

CUENTAS CREADAS:
- GitHub: github.com/TU-USUARIO
- Vercel: vercel.com (conectado con GitHub)
- Neon: neon.tech (conectado con GitHub)

URL DE BASE DE DATOS:
postgresql://_________________________

FECHA DE DESPLIEGUE: ___/___/2026
```

---

# ✅ CHECKLIST FINAL

Marca cada casilla cuando lo completes:

- [ ] Cuenta de GitHub creada
- [ ] Cuenta de Vercel creada y conectada con GitHub
- [ ] Base de datos Neon creada
- [ ] URL de base de datos copiada y guardada
- [ ] Repositorio creado en GitHub
- [ ] Código subido a GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Proyecto desplegado exitosamente
- [ ] Base de datos inicializada (/api/init-db)
- [ ] Login funcionando
- [ ] Contraseña cambiada

---

**¡Felicidades! Tu sistema está funcionando en internet GRATIS.**

---

*Guía actualizada: Marzo 2026*
*Sistema de Gestión Integral para Condominios*
*Asesorías Integrales CyJ*
