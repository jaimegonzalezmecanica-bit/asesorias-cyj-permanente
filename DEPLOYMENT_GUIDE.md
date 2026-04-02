# 🚀 Guía de Despliegue - Asesorías Integrales CYJ

## 📋 Requisitos Previos

- Dominio contratado (ej: `asesoriascyj.cl`)
- Hosting con soporte para Node.js o Docker
- Acceso SSH al servidor (recomendado)
- Base de datos SQLite incluida (o MySQL/PostgreSQL si prefieres)

---

## 🎯 Opciones de Despliegue

### Opción 1: VPS/Servidor Dedicado (RECOMENDADO)
**Proveedores:** DigitalOcean, Linode, Vultr, AWS EC2, Hetzner

#### Paso 1: Preparar el Servidor

```bash
# Conectar al servidor via SSH
ssh root@tu-servidor-ip

# Instalar Node.js 20+ y Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Instalar Docker (opcional pero recomendado)
curl -fsSL https://get.docker.com | sh

# Instalar Nginx (proxy inverso)
apt update
apt install nginx certbot python3-certbot-nginx -y
```

#### Paso 2: Subir el Código

```bash
# En tu máquina local, crear archivo .env.production
# Ver sección "Variables de Entorno" más abajo

# Opción A: Clonar desde Git
git clone https://github.com/tu-usuario/asesorias-cyj.git /var/www/asesorias-cyj

# Opción B: Subir archivos via SCP
scp -r /home/z/my-project/* root@tu-servidor-ip:/var/www/asesorias-cyj
```

#### Paso 3: Configurar la Aplicación

```bash
cd /var/www/asesorias-cyj

# Instalar dependencias
bun install

# Generar cliente Prisma
bun run db:generate

# Inicializar base de datos
bun run db:push

# Construir la aplicación
bun run build

# Probar que funciona
bun run start
```

#### Paso 4: Configurar PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'asesorias-cyj',
    script: 'server.js',
    cwd: '/var/www/asesorias-cyj',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciar con el sistema
pm2 startup
```

#### Paso 5: Configurar Nginx

```bash
# Crear configuración de Nginx
cat > /etc/nginx/sites-available/asesorias-cyj << 'EOF'
server {
    listen 80;
    server_name asesoriascyj.cl www.asesoriascyj.cl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Habilitar sitio
ln -s /etc/nginx/sites-available/asesorias-cyj /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

#### Paso 6: Certificado SSL (HTTPS)

```bash
# Obtener certificado SSL gratuito con Let's Encrypt
certbot --nginx -d asesoriascyj.cl -d www.asesoriascyj.cl

# Renovación automática
certbot renew --dry-run
```

---

### Opción 2: Docker (RECOMENDADO para producción)

#### Paso 1: Construir Imagen

```bash
# En el servidor
cd /var/www/asesorias-cyj

# Construir imagen
docker build -t asesorias-cyj:latest .

# O usar docker-compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: asesorias-cyj:latest
    container_name: asesorias-cyj
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/db/database.db
    volumes:
      - ./db:/app/db
      - ./public/uploads:/app/public/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Iniciar
docker-compose up -d
```

---

### Opción 3: Hosting Compartido (cPanel)

Si tu hosting tiene cPanel con soporte Node.js:

1. Accede a cPanel
2. Busca "Setup Node.js App"
3. Crea una nueva aplicación:
   - Node.js version: 20+
   - Application mode: Production
   - Application root: `/home/tuusuario/asesorias-cyj`
   - Application URL: `asesoriascyj.cl`
   - Application startup file: `server.js`

4. Sube los archivos via FTP o File Manager
5. En la terminal de cPanel:
   ```bash
   cd ~/asesorias-cyj
   npm install
   npm run build
   ```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` o `.env.production`:

```env
# Base de datos
DATABASE_URL="file:./db/database.db"

# NextAuth (CAMBIAR EN PRODUCCIÓN)
NEXTAUTH_SECRET="genera-una-clave-secreta-muy-larga-y-segura-aqui"
NEXTAUTH_URL="https://asesoriascyj.cl"

# Configuración
NODE_ENV="production"
PORT=3000

# Email (opcional - para notificaciones)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-app"
```

### Generar NEXTAUTH_SECRET:

```bash
# En Linux/Mac
openssl rand -base64 32

# O en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📁 Estructura de Directorios en Producción

```
/var/www/asesorias-cyj/
├── .next/                 # Build de Next.js
├── db/
│   └── database.db        # Base de datos SQLite
├── public/
│   ├── logo.png
│   ├── images/
│   └── uploads/           # Archivos subidos por usuarios
├── prisma/
│   └── schema.prisma
├── src/
├── package.json
├── ecosystem.config.js    # Config PM2
├── docker-compose.yml     # Si usas Docker
└── .env                   # Variables de entorno
```

---

## 🔄 Actualizaciones

### Método 1: Git + PM2

```bash
cd /var/www/asesorias-cyj
git pull origin main
bun install
bun run db:generate
bun run db:push
bun run build
pm2 restart asesorias-cyj
```

### Método 2: Docker

```bash
cd /var/www/asesorias-cyj
git pull origin main
docker-compose down
docker build -t asesorias-cyj:latest .
docker-compose up -d
```

---

## 🔧 Mantenimiento

### Backup de Base de Datos

```bash
# Crear backup
cp /var/www/asesorias-cyj/db/database.db /backup/database-$(date +%Y%m%d).db

# Script automático (crontab)
crontab -e
# Agregar: 0 2 * * * cp /var/www/asesorias-cyj/db/database.db /backup/database-$(date +\%Y\%m\%d).db
```

### Ver Logs

```bash
# Con PM2
pm2 logs asesorias-cyj

# Con Docker
docker logs asesorias-cyj

# Nginx
tail -f /var/log/nginx/error.log
```

---

## 🌐 Configuración DNS

En tu proveedor de dominio:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | IP de tu servidor |
| A | www | IP de tu servidor |
| CNAME | sistema | asesoriascyj.cl |

---

## ✅ Checklist Pre-Lanzamiento

- [ ] Dominio apuntando al servidor
- [ ] SSL instalado y funcionando
- [ ] Variables de entorno configuradas
- [ ] NEXTAUTH_SECRET generado y configurado
- [ ] Base de datos inicializada
- [ ] Usuario administrador creado
- [ ] Backup automático configurado
- [ ] Logs funcionando
- [ ] PM2/Docker reiniciando automáticamente

---

## 🆘 Soporte

Si tienes problemas, verifica:
1. Los logs: `pm2 logs` o `docker logs`
2. El estado de Nginx: `systemctl status nginx`
3. El estado de la app: `pm2 status`
4. Conexión a la base de datos
