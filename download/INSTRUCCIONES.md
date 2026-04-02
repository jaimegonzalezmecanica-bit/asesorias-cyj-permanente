# 📥 DESCARGA Y SUBIDA - PASO A PASO SIMPLE

---

## 🗂️ ARCHIVOS QUE NECESITAS DESCARGAR

Hay **2 archivos ZIP** listos para descargar:

| Archivo | Para qué sirve | Tamaño |
|---------|----------------|--------|
| `static-landing.zip` | Tu landing page (para tu hosting) | 1.3 MB |
| `proyecto-completo.zip` | El sistema completo (para Vercel) | 1.7 MB |

---

## ═════════════════════════════════════════════════════
# PARTE A: LANDING PAGE (la página principal)
# ═════════════════════════════════════════════════════

## PASO 1: DESCARGAR EL ARCHIVO

### Si puedes acceder a los archivos del servidor:

1. Busca el archivo: `static-landing.zip`
2. Está en la carpeta: `/home/z/my-project/download/`
3. Descárgalo a tu computador

### Si usas FTP/FileZilla:

```
Servidor: [IP de este servidor]
Puerto: 22
Usuario: [tu usuario]
Contraseña: [tu contraseña]
```

Luego navega a `/home/z/my-project/download/` y descarga `static-landing.zip`

---

## PASO 2: DESCOMPRIMIR EN TU COMPUTADOR

1. Ubica el archivo `static-landing.zip` que descargaste
2. Click derecho → "Extraer aquí" o "Descomprimir"
3. Se creará una carpeta llamada `static-landing`

Dentro encontrarás:
```
static-landing/
├── index.html      ← La página web
├── logo.png        ← Tu logo
└── images/         ← Carpeta con imágenes
    ├── hero.png
    ├── condominios.png
    ├── corretaje.png
    └── areas-verdes.png
```

---

## PASO 3: SUBIR A TU HOSTING (cPanel)

### 3.1 Entrar a cPanel

1. Abre Chrome/Firefox
2. Ve a: `https://tudominio.cl/cpanel`
   (o la URL que te dio tu proveedor de hosting)
3. Ingresa usuario y contraseña

### 3.2 Abrir Administrador de Archivos

1. Busca el icono 📁 **"Administrador de Archivos"** o **"File Manager"**
2. Click en él

### 3.3 Ir a la carpeta correcta

1. En el panel izquierdo, busca **`public_html`**
2. Click en `public_html`
3. Esta es la carpeta raíz de tu sitio web

### 3.4 Subir los archivos

1. Click en el botón **"Cargar"** o **"Upload"** (arriba)
2. Se abre una nueva ventana
3. Arrastra TODOS los archivos de la carpeta `static-landing`:
   - `index.html`
   - `logo.png`
   - Carpeta `images` completa
4. Espera a que terminen de subir
5. Cierra la ventana de carga
6. Regresa al Administrador de Archivos

### 3.5 Verificar estructura

Debes ver esto:
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

### 3.6 ¡PROBAR!

1. Abre una pestaña nueva en el navegador
2. Escribe: `http://tudominio.cl`
3. **¡Deberías ver tu página de Asesorías Integrales CYJ!**

---

## ═════════════════════════════════════════════════════
# PARTE B: SISTEMA DE GESTIÓN (panel de administración)
# ═════════════════════════════════════════════════════

## PASO 4: SUBIR A GITHUB

### 4.1 Crear cuenta en GitHub (si no tienes)

1. Ve a: https://github.com
2. Click en **"Sign up"**
3. Llena: email, contraseña, nombre de usuario
4. Verifica tu email
5. ¡Listo!

### 4.2 Crear repositorio nuevo

1. En GitHub, click en el botón **"+"** (esquina superior derecha)
2. Click en **"New repository"**
3. En "Repository name" escribe: `asesorias-cyj`
4. Click en **"Create repository"**

### 4.3 Subir los archivos

**Opción FÁCIL: Usar GitHub Desktop**

1. Descarga: https://desktop.github.com/
2. Instala y abre
3. Inicia sesión con tu cuenta de GitHub
4. Click en **"File"** → **"Add Local Repository"**
5. Primero descomprime `proyecto-completo.zip` en tu computador
6. Selecciona la carpeta descomprimida
7. Click en **"Publish repository"**
8. Asegúrate que el nombre sea `asesorias-cyj`
9. Click en **"Publish repository"**

---

## PASO 5: SUBIR A VERCEL (GRATIS)

### 5.1 Crear cuenta en Vercel

1. Ve a: https://vercel.com
2. Click en **"Sign up"**
3. Elige **"Continue with GitHub"**
4. Autoriza a Vercel

### 5.2 Importar tu proyecto

1. En Vercel, click en **"Add New..."** → **"Project"**
2. Verás tu repositorio `asesorias-cyj`
3. Click en **"Import"**
4. Deja todo como está (detectará Next.js automáticamente)
5. Click en **"Deploy"**

### 5.3 Esperar

- Tardará 2-3 minutos
- Verás una animación de carga
- Cuando termine dirá **"Congratulations!"**

### 5.4 Ver tu sistema

1. Click en el link que aparece (algo como `asesorias-cyj.vercel.app`)
2. **¡Deberías ver el sistema de administración!**
3. El usuario por defecto es: `admin@condominio.com`
4. La contraseña es: `Admin123!`

---

## PASO 6: CONECTAR TU DOMINIO (opcional pero recomendado)

### 6.1 Agregar dominio en Vercel

1. En Vercel, ve a tu proyecto
2. Click en **"Settings"**
3. Click en **"Domains"**
4. Escribe: `sistema.tudominio.cl`
5. Click en **"Add"**

### 6.2 Configurar DNS en tu hosting

1. Ve a tu **cPanel**
2. Busca **"Editor de Zona DNS"**
3. Agrega un registro:
   ```
   Tipo: CNAME
   Nombre: sistema
   Apunta a: cname.vercel-dns.com
   ```

### 6.3 Actualizar link en tu landing page

1. Ve a cPanel → Administrador de Archivos
2. Edita el archivo `index.html`
3. Busca: `href="sistema/"`
4. Cambia por: `href="https://sistema.tudominio.cl"`
5. Guarda

---

## ✅ RESUMEN FINAL

| Qué | Dónde | URL |
|-----|-------|-----|
| Landing Page | Tu hosting | `tudominio.cl` |
| Sistema | Vercel (GRATIS) | `sistema.tudominio.cl` |

### Costos adicionales: $0

---

## ❓ SI TIENES PROBLEMAS

### "No puedo entrar a cPanel"
→ Llama a tu proveedor de hosting y pide la URL correcta

### "La página se ve mal o sin imágenes"
→ Verifica que la carpeta `images` se subió completa

### "Vercel me da error"
→ Copia el error y me lo envías, te ayudo a solucionarlo

### "El sistema no funciona"
→ Asegúrate de haber subido TODOS los archivos del proyecto completo

---

## 📞 ARCHIVOS LISTOS PARA DESCARGAR

Los archivos están en esta carpeta del servidor:

```
/home/z/my-project/download/
├── static-landing.zip     ← Descarga este primero
├── proyecto-completo.zip  ← Luego este
└── GUIA_COMPLETA.md       ← Guía detallada
```

**¡Descárgalos y sigue los pasos de esta guía!**
