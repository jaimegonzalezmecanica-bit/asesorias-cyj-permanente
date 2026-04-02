# 🚀 Guía de Despliegue a Producción

## Condominio Laguna Norte – Sistema de Gestión v2

---

## 📋 Contenido

1. [Requisitos Previos](#requisitos-previos)
2. [Opción 1: Docker (Recomendado)](#opción-1-docker-recomendado)
3. [Opción 2: VPS/Servidor Dedicado](#opción-2-vpsservidor-dedicado)
4. [Opción 3: PaaS (Vercel, Railway, etc.)](#opción-3-paas-vercel-railway-etc)
5. [Variables de Entorno](#variables-de-entorno)
6. [Configuración de Base de Datos](#configuración-de-base-de-datos)
7. [Seguridad](#seguridad)
8. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
9. [Backup y Restauración](#backup-y-restauración)

---

## Requisitos Previos

### Software Necesario
- **Node.js** 18+ o **Bun** 1.0+
- **Docker** y **Docker Compose** (para despliegue con contenedores)
- **Git** para control de versiones

### Recursos de Servidor Recomendados
| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 núcleo | 2 núcleos |
| RAM | 1 GB | 2 GB |
| Disco | 10 GB | 20 GB SSD |

---

## Opción 1: Docker (Recomendado)

### Paso 1: Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y
```

### Paso 2: Clonar y configurar

```bash
# Clonar repositorio
git clone <tu-repositorio> condominio-app
cd condominio-app

# Crear archivo de variables de entorno
cp .env.example .env

# Editar variables de entorno
nano .env
```

### Paso 3: Configurar variables de entorno

Crear archivo `.env`:

```env
# Aplicación
NODE_ENV=production
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=genera-un-secret-seguro-aqui

# Base de datos (SQLite)
DATABASE_URL=file:/app/data/condominio.db

# Opcional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

### Paso 4: Construir y ejecutar

```bash
# Construir imágenes
docker compose build

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Verificar estado
docker compose ps
```

### Paso 5: Inicializar base de datos

```bash
# Ejecutar migraciones
docker compose exec app bun run db:push

# Cargar datos iniciales (opcional)
curl -X POST http://localhost:3000/api/seed
curl -X POST http://localhost:3000/api/seed-catalogos
```

### Comandos útiles de Docker

```bash
# Detener servicios
docker compose down

# Reiniciar servicios
docker compose restart

# Ver logs en tiempo real
docker compose logs -f app

# Actualizar aplicación
git pull
docker compose build --no-cache
docker compose up -d

# Acceder al contenedor
docker compose exec app sh
```

---

## Opción 2: VPS/Servidor Dedicado

### Paso 1: Instalar Bun

```bash
# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Recargar shell
source ~/.bashrc
```

### Paso 2: Clonar y configurar

```bash
# Clonar
git clone <tu-repositorio> condominio-app
cd condominio-app

# Instalar dependencias
bun install

# Generar cliente Prisma
bun run db:generate

# Crear base de datos
bun run db:push
```

### Paso 3: Construir y ejecutar

```bash
# Construir aplicación
bun run build

# Ejecutar en producción
bun run start
```

### Paso 4: Configurar PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# Crear ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'condominio-app',
      script: 'bun',
      args: '.next/standalone/server.js',
      cwd: '/home/usuario/condominio-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'ot-scheduler',
      script: 'bun',
      args: 'run index.ts',
      cwd: '/home/usuario/condominio-app/mini-services/ot-scheduler',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3010
      }
    }
  ]
}
EOF

# Iniciar servicios
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### Paso 5: Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/condominio
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

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

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/condominio /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Paso 6: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo systemctl enable certbot.timer
```

---

## Opción 3: PaaS (Vercel, Railway, etc.)

### Vercel (Frontend + Serverless)

⚠️ **Limitación**: SQLite no funciona en Vercel (serverless). Necesitas migrar a:
- PostgreSQL (Neon, Supabase, Railway)
- MySQL (PlanetScale)

### Railway (Compatible con SQLite en volúmenes)

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Agregar volumen para SQLite
railway volume add

# Desplegar
railway up
```

### Render.com

1. Crear cuenta en render.com
2. Conectar repositorio de GitHub
3. Crear "Web Service"
4. Configurar:
   - Build Command: `bun install && bun run build`
   - Start Command: `bun run start`
5. Agregar disco persistente para SQLite

---

## Variables de Entorno

### Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a BD | `file:/app/data/condominio.db` |
| `NEXTAUTH_URL` | URL de la aplicación | `https://app.tudominio.com` |
| `NEXTAUTH_SECRET` | Secreto para sesiones | String aleatorio de 32+ caracteres |

### Opcionales

| Variable | Descripción |
|----------|-------------|
| `SMTP_HOST` | Servidor de correo |
| `SMTP_PORT` | Puerto SMTP |
| `SMTP_USER` | Usuario de correo |
| `SMTP_PASS` | Contraseña de correo |

### Generar NEXTAUTH_SECRET

```bash
# Con OpenSSL
openssl rand -base64 32

# Con Bun
bun -e "console.log(crypto.randomUUID())"
```

---

## Configuración de Base de Datos

### Migración a PostgreSQL (Recomendado para producción)

1. **Actualizar schema.prisma**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Variables de entorno**:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/condominio"
```

3. **Migrar datos**:

```bash
# Generar migración
bun run db:migrate

# O usar herramienta de migración
npx prisma migrate deploy
```

---

## Seguridad

### Checklist de Seguridad

- [ ] Cambiar contraseñas por defecto
- [ ] Configurar HTTPS (SSL/TLS)
- [ ] Configurar firewall (solo puertos 80, 443, 22)
- [ ] Deshabilitar acceso root por SSH
- [ ] Configurar rate limiting
- [ ] Sanitizar inputs de usuario
- [ ] Configurar CORS apropiadamente

### Configurar Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Verificar estado
sudo ufw status
```

---

## Monitoreo y Mantenimiento

### Logs

```bash
# Ver logs de la aplicación
pm2 logs condominio-app

# Ver logs del scheduler
pm2 logs ot-scheduler

# Logs de Docker
docker compose logs -f
```

### Monitoreo con PM2

```bash
# Ver estado
pm2 status

# Monitoreo en tiempo real
pm2 monit

# Métricas web (opcional)
pm2 install pm2-server-monit
```

### Actualización de la Aplicación

```bash
# Con Docker
git pull
docker compose build --no-cache
docker compose up -d

# Con PM2
git pull
bun install
bun run build
pm2 restart all
```

---

## Backup y Restauración

### Backup de SQLite

```bash
# Backup manual
cp db/custom.db backups/condominio_$(date +%Y%m%d_%H%M%S).db

# Script de backup automático
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp db/custom.db $BACKUP_DIR/condominio_$DATE.db
# Mantener solo los últimos 30 días
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
EOF

chmod +x backup.sh
```

### Programar Backup con Cron

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/usuario/condominio-app/backup.sh
```

### Restaurar Backup

```bash
# Detener aplicación
docker compose down
# o
pm2 stop all

# Restaurar base de datos
cp backups/condominio_20240115_020000.db db/custom.db

# Reiniciar
docker compose up -d
# o
pm2 start all
```

---

## 🆘 Solución de Problemas

### La aplicación no inicia

```bash
# Verificar logs
docker compose logs app
# o
pm2 logs condominio-app

# Verificar puerto
lsof -i :3000

# Verificar base de datos
bun run db:push
```

### Error de base de datos

```bash
# Regenerar cliente Prisma
bun run db:generate

# Verificar integridad
sqlite3 db/custom.db "PRAGMA integrity_check;"
```

### Problemas de permisos

```bash
# Corregir permisos
chown -R $USER:$USER .
chmod -R 755 .
chmod 644 db/custom.db
```

---

## 📞 Soporte

Para problemas técnicos, consultar:
- Documentación de Next.js: https://nextjs.org/docs
- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de Docker: https://docs.docker.com

---

**Última actualización**: Enero 2025
