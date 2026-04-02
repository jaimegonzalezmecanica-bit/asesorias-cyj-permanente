#!/bin/bash

# ===========================================
# Script de Despliegue - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Condominio Laguna Norte - Sistema de Gestión v2     ║${NC}"
echo -e "${BLUE}║                  Script de Despliegue                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar si existe .env
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado"
    print_step "Creando .env desde .env.example..."
    cp .env.example .env
    print_warning "Por favor, edita el archivo .env con tus configuraciones"
    print_warning "Luego ejecuta este script nuevamente"
    exit 1
fi

# Detectar método de despliegue
echo -e "${YELLOW}Selecciona el método de despliegue:${NC}"
echo "  1) Docker (Recomendado)"
echo "  2) PM2 (Servidor dedicado)"
echo "  3) Solo Build (para PaaS)"
echo ""
read -p "Opción [1-3]: " option

case $option in
    1)
        print_step "Desplegando con Docker..."
        
        # Verificar Docker
        if ! command -v docker &> /dev/null; then
            print_error "Docker no está instalado"
            exit 1
        fi
        
        # Construir imágenes
        print_step "Construyendo imágenes..."
        docker compose build --no-cache
        
        # Iniciar servicios
        print_step "Iniciando servicios..."
        docker compose up -d
        
        # Esperar a que inicie
        print_step "Esperando a que la aplicación inicie..."
        sleep 10
        
        # Verificar estado
        if docker compose ps | grep -q "Up"; then
            print_success "Aplicación desplegada correctamente"
            print_success "Disponible en: http://localhost:3000"
        else
            print_error "Error al iniciar la aplicación"
            docker compose logs
            exit 1
        fi
        ;;
        
    2)
        print_step "Desplegando con PM2..."
        
        # Verificar PM2
        if ! command -v pm2 &> /dev/null; then
            print_step "Instalando PM2..."
            npm install -g pm2
        fi
        
        # Instalar dependencias
        print_step "Instalando dependencias..."
        bun install
        
        # Generar Prisma
        print_step "Generando cliente Prisma..."
        bun run db:generate
        
        # Push de base de datos
        print_step "Configurando base de datos..."
        bun run db:push
        
        # Build
        print_step "Construyendo aplicación..."
        bun run build
        
        # Crear ecosystem.config.js si no existe
        if [ ! -f ecosystem.config.js ]; then
            print_step "Creando configuración PM2..."
            cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'condominio-app',
      script: 'bun',
      args: '.next/standalone/server.js',
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
      cwd: './mini-services/ot-scheduler',
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
        fi
        
        # Iniciar con PM2
        print_step "Iniciando servicios con PM2..."
        pm2 start ecosystem.config.js
        
        # Guardar configuración
        pm2 save
        
        print_success "Aplicación desplegada correctamente"
        print_success "Disponible en: http://localhost:3000"
        print_step "Para configurar inicio automático, ejecuta:"
        echo "    pm2 startup"
        ;;
        
    3)
        print_step "Construyendo para PaaS..."
        
        # Instalar dependencias
        print_step "Instalando dependencias..."
        bun install
        
        # Generar Prisma
        print_step "Generando cliente Prisma..."
        bun run db:generate
        
        # Build
        print_step "Construyendo aplicación..."
        bun run build
        
        print_success "Build completado"
        print_step "Archivos listos para despliegue en:"
        echo "    - .next/standalone/"
        echo "    - .next/static/"
        echo "    - public/"
        ;;
        
    *)
        print_error "Opción no válida"
        exit 1
        ;;
esac

# Inicializar datos si es necesario
echo ""
read -p "¿Deseas cargar los datos iniciales (catálogos, centros de costo)? [y/N]: " init_data
if [[ $init_data =~ ^[Yy]$ ]]; then
    print_step "Cargando datos iniciales..."
    
    # Seed básico
    curl -X POST http://localhost:3000/api/seed 2>/dev/null && print_success "Datos básicos cargados"
    
    # Seed de catálogos
    curl -X POST http://localhost:3000/api/seed-catalogos 2>/dev/null && print_success "Catálogos cargados"
fi

# Finalización
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ¡Despliegue completado!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📚 Documentación: ./DEPLOYMENT.md"
echo "🔧 Variables de entorno: .env"
echo "📊 Logs: docker compose logs -f (Docker) o pm2 logs (PM2)"
echo ""
