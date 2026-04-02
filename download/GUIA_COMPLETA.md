# 📖 GUÍA PASO A PASO - ASUBIR TU SITIO WEB
# Asesorías Integrales CYJ

---

## 📋 RESUMEN DE LO QUE VAMOS A HACER

1. **Descargar** los archivos de la landing page
2. **Subir** la landing page a tu hosting (cPanel)
3. **Subir** el sistema a Vercel (gratis)
4. **Conectar** todo con tu dominio

---

# ═══════════════════════════════════════════════
# PARTE 1: DESCARGAR LOS ARCHIVOS
# ═══════════════════════════════════════════════

## PASO 1.1: Descargar desde este servidor

Los archivos que necesitas están en esta ubicación:
```
/home/z/my-project/static-landing/
```

### ¿CÓMO DESCARGAR?

### Opción A: Si tienes acceso a este servidor (recomendado)

1. Abre una terminal en tu computador
2. Ejecuta este comando:
   ```bash
   scp -r usuario@ip-del-servidor:/home/z/my-project/static-landing ~/Descargas/
   ```
3. Te pedirá la contraseña del servidor
4. Los archivos se descargarán en tu carpeta Descargas

### Opción B: Usar un cliente FTP/SFTP

1. Descarga **FileZilla** (gratis) de: https://filezilla-project.org/
2. Instálalo en tu computador
3. Abre FileZilla
4. En la barra superior ingresa:
   ```
   Servidor: [IP de este servidor]
   Usuario: [tu usuario]
   Contraseña: [tu contraseña]
   Puerto: 22
   ```
5. Click en "Conexión rápida"
6. Navega a la carpeta `/home/z/my-project/static-landing/`
7. Selecciona todos los archivos (Ctrl+A)
8. Arrastra hacia la izquierda (tu computador) o click derecho → Descargar

### Opción C: Si puedes acceder desde el navegador

1. Si este servidor tiene un panel de control web
2. Busca "File Manager" o "Administrador de Archivos"
3. Navega a `/home/z/my-project/static-landing/`
4. Selecciona todos los archivos
5. Click en "Comprimir" o "Crear ZIP"
6. Descarga el archivo ZIP

---

## PASO 1.2: Verificar que tienes estos archivos

Después de descargar, deberías tener esta estructura:

```
static-landing/
├── index.html           (19 KB - la página web)
├── logo.png             (605 KB - tu logo)
└── images/
    ├── hero.png         (180 KB)
    ├── condominios.png  (253 KB)
    ├── corretaje.png    (109 KB)
    └── areas-verdes.png (206 KB)
```

**Total: aproximadamente 1.3 MB** (muy poco, perfecto para tu hosting)

---

# ═══════════════════════════════════════════════
# PARTE 2: SUBIR A TU HOSTING (cPanel)
# ═══════════════════════════════════════════════

## PASO 2.1: Entrar a tu cPanel

1. Abre tu navegador web (Chrome, Firefox, etc.)
2. Ve a la dirección de tu hosting, por ejemplo:
   - `https://tudominio.cl/cpanel`
   - `https://tudominio.cl:2083`
   - O la URL que te dio tu proveedor de hosting
3. Ingresa tu **usuario** y **contraseña** de cPanel

## PASO 2.2: Abrir el Administrador de Archivos

1. Dentro de cPanel, busca el icono que dice **"Administrador de Archivos"** o **"File Manager"**
   - Suele estar en la sección "Archivos"
   - Tiene un icono de una carpeta amarilla

2. Click en **"Administrador de Archivos"**

## PASO 2.3: Navegar a la carpeta correcta

1. En el panel izquierdo, busca y haz click en:
   - `public_html` (la carpeta principal de tu web)
   - O la carpeta con el nombre de tu dominio

2. Si está vacía, perfecto. Si hay archivos, puedes:
   - Borrarlos (si son de ejemplo)
   - O crear una carpeta nueva para tu sitio

## PASO 2.4: Subir los archivos

### SUBIR index.html y logo.png:

1. Click en el botón **"Cargar"** o **"Upload"** (arriba a la izquierda)
2. Se abrirá una nueva pestaña
3. Click en **"Seleccionar archivo"** o arrastra los archivos:
   - `index.html`
   - `logo.png`
4. Espera a que se suban (verás una barra de progreso)
5. Cuando termine, cierra esa pestaña y regresa al File Manager

### SUBIR la carpeta images:

**Opción 1: Crear la carpeta y subir archivos uno por uno**

1. Click en **"+ Carpeta"** o **"New Folder"**
2. Escribe el nombre: `images`
3. Click en "Crear nueva carpeta"
4. Entra a la carpeta `images` (doble click)
5. Click en **"Cargar"**
6. Sube los 4 archivos:
   - `hero.png`
   - `condominios.png`
   - `corretaje.png`
   - `areas-verdes.png`

**Opción 2: Comprimir y subir todo junto**

1. En tu computador, comprime todo en un ZIP
2. Sube el ZIP al File Manager
3. Click derecho en el ZIP → "Extraer" o "Uncompress"

## PASO 2.5: Verificar la estructura final

Deberías ver esto en tu File Manager:

```
public_html/
├── index.html
├── logo.png
└── images/
    ├── hero.png
    ├── condominios.png
    ├── corretaje.png
    └── areas-verdes.png
```

## PASO 2.6: ¡Probar tu sitio!

1. Abre una nueva pestaña en tu navegador
2. Escribe tu dominio: `http://tudominio.cl`
3. **Deberías ver tu landing page de Asesorías Integrales CYJ**

---

# ═══════════════════════════════════════════════
# PARTE 3: SUBIR EL SISTEMA A VERCEL (GRATIS)
# ═══════════════════════════════════════════════

El sistema de gestión (el panel de administración) necesita un servidor que soporte Node.js. Como tu hosting compartido NO lo soporta, usaremos **Vercel** que es GRATIS.

## PASO 3.1: Crear cuenta en GitHub

1. Ve a: https://github.com
2. Click en **"Sign up"** (registrarse)
3. Ingresa tu email, crea una contraseña y nombre de usuario
4. Verifica tu email
5. ¡Listo, tienes cuenta de GitHub!

## PASO 3.2: Crear un repositorio

1. En GitHub, click en el botón **"+"** (arriba a la derecha)
2. Click en **"New repository"**
3. En "Repository name" escribe: `asesorias-cyj`
4. Selecciona **"Private"** (para que solo tú lo veas)
5. Click en **"Create repository"**

## PASO 3.3: Subir el código a GitHub

### Primero, descarga TODO el proyecto del servidor:

Necesitas descargar toda la carpeta `/home/z/my-project/` (no solo static-landing)

Usa FileZilla o scp como te expliqué antes, pero esta vez descarga:
```
/home/z/my-project/
```

### Luego, sube a GitHub:

**Opción A: Usando GitHub Desktop (más fácil)**

1. Descarga GitHub Desktop: https://desktop.github.com/
2. Instálalo y inicia sesión con tu cuenta de GitHub
3. Abre GitHub Desktop
4. Click en **"File"** → **"Add local repository"**
5. Selecciona la carpeta del proyecto que descargaste
6. Click en **"Publish repository"**
7. Asegúrate que el nombre sea `asesorias-cyj`
8. Click en **"Publish repository"**

**Opción B: Usando Git en terminal**

```bash
# Abre terminal en la carpeta del proyecto
cd /ruta/donde/descargaste/my-project

# Iniciar git
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Sistema Asesorías Integrales CYJ"

# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/asesorias-cyj.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

## PASO 3.4: Crear cuenta en Vercel

1. Ve a: https://vercel.com
2. Click en **"Sign up"**
3. Elige **"Continue with GitHub"**
4. Autoriza a Vercel para acceder a tu GitHub
5. ¡Listo!

## PASO 3.5: Importar el proyecto en Vercel

1. En Vercel, click en **"Add New..."** → **"Project"**
2. Verás tu repositorio `asesorias-cyj`
3. Click en **"Import"**
4. Configura:
   - **Framework Preset:** Next.js (debería detectarlo automáticamente)
   - **Root Directory:** `./` (dejar como está)
   - **Build Command:** `bun run build`
   - **Output Directory:** `.next` (dejar como está)
5. Click en **"Deploy"**
6. Espera 2-3 minutos mientras se construye

## PASO 3.6: Verificar que funciona

1. Cuando termine, verás un mensaje "Congratulations!"
2. Click en el link que te da (algo como `asesorias-cyj.vercel.app`)
3. Deberías ver tu sistema de administración

## PASO 3.7: Configurar variables de entorno

1. En Vercel, ve a tu proyecto
2. Click en **"Settings"** (arriba)
3. Click en **"Environment Variables"** (izquierda)
4. Agrega estas variables:

```
Nombre: NEXTAUTH_SECRET
Valor: [genera una clave aleatoria larga]
```

Para generar la clave, puedes usar este sitio:
https://generate-random.org/encryption-key-generator

O ejecutar en terminal:
```bash
openssl rand -base64 32
```

5. Click en **"Save"**
6. Ve a **"Deployments"** y click en los 3 puntos (...) → **"Redeploy"**

---

# ═══════════════════════════════════════════════
# PARTE 4: CONECTAR TU DOMINIO
# ═══════════════════════════════════════════════

Ahora vamos a hacer que el sistema funcione en `sistema.tudominio.cl`

## PASO 4.1: Agregar dominio en Vercel

1. En Vercel, ve a tu proyecto
2. Click en **"Settings"**
3. Click en **"Domains"**
4. Escribe: `sistema.tudominio.cl` (cambia "tudominio.cl" por tu dominio real)
5. Click en **"Add"**
6. Te mostrará unos registros DNS que debes agregar

## PASO 4.2: Configurar DNS en tu hosting

1. Ve a tu **cPanel**
2. Busca **"Editor de Zona DNS"** o **"Zone Editor"**
3. Click en tu dominio
4. Click en **"Agregar registro"** o **"Add Record"**
5. Agrega este registro:

```
Tipo: CNAME
Nombre: sistema
Apunta a: cname.vercel-dns.com
TTL: 3600 (o automático)
```

6. Click en **"Guardar"** o **"Add Record"**

## PASO 4.3: Esperar propagación

- Los cambios DNS pueden tardar entre 15 minutos y 48 horas
- Normalmente funciona en 1-2 horas
- Puedes verificar en: https://dnschecker.org

## PASO 4.4: Actualizar el link en tu landing page

1. Ve a cPanel → File Manager
2. Abre el archivo `index.html`
3. Busca donde dice `href="sistema/"`
4. Cámbialo por `href="https://sistema.tudominio.cl"`
5. Guarda los cambios

---

# ═══════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════

## Lo que lograste:

```
tudominio.cl              → Landing page (tu hosting)
sistema.tudominio.cl      → Sistema de gestión (Vercel GRATIS)
```

## Costos:

| Servicio | Costo mensual |
|----------|---------------|
| Hosting actual | Lo que ya pagas |
| Vercel | $0 (GRATIS) |
| GitHub | $0 (GRATIS) |
| **TOTAL EXTRA** | **$0** |

## Archivos que necesitas descargar:

De este servidor, descarga:

1. **Para la landing page (tu hosting):**
   ```
   /home/z/my-project/static-landing/    (toda la carpeta)
   ```

2. **Para el sistema (Vercel):**
   ```
   /home/z/my-project/                   (toda la carpeta del proyecto)
   ```

---

# ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo subir todo a mi hosting actual?**
R: NO, porque tu hosting no soporta Node.js/Next.js. Por eso usamos Vercel (gratis).

**P: ¿Es seguro Vercel?**
R: Sí, es una empresa muy confiable, usada por empresas como Netflix, Hulu, etc.

**P: ¿Qué pasa si mi hosting no tiene cPanel?**
R: Tu hosting debe tener algún panel similar. Busca "File Manager" o "Administrador de archivos".

**P: ¿Necesito saber programación?**
R: No, solo seguir estos pasos. Si tienes problemas, contáctame.

**P: ¿La base de datos funciona en Vercel?**
R: SQLite no funciona en Vercel. Pero para empezar, puedes usar la versión de prueba. Para producción, necesitarías configurar MySQL (tu hosting tiene 10 bases de datos disponibles) o usar un servicio como PlanetScale (gratis hasta cierto límite).
