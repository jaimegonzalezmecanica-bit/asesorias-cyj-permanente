#!/bin/bash
set -e
# ===========================================
# Makefile - Comandos de Despliegue
# Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================
# Colores
RED=\033[0;31m
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
# Banner
show_banner() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════${NC}"
    echo -e "${BLUE}║   Condominio Laguna Norte - Despliegue          ║${NC}"
    echo -e "${BLUE}║   Sistema de Gestión v2                            ║${NC}"
    echo -e "${BLUE}╔════════════════════════════════════════════${NC}"
    echo ""
}
# Verificar dependencias
check_dependencies() {
    local deps=("docker" "docker-compose" "openssl" "curl" "git")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}Error: $dep no está instalado${NC}"
            exit 1
        fi
    done
}
# ===========================================
# Comandos principales
# ===========================================
deploy_docker() {
    echo -e "${YELLOW}Desplegando con Docker...${NC}"
    
    # Construir imágenes
    echo -e "${BLUE}Construyendo imágenes...${NC}"
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Iniciar servicios
    echo -e "${BLUE}Iniciando servicios...${NC}"
    docker compose -f docker-compose.prod.yml up -d
    
    # Esperar a que inicie
    echo -e "${YELLOW}Esperando a que los servicios inicien...${NC}"
    sleep 10
    # Verificar estado
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Servicios iniciados correctamente${NC}"
    else
        echo -e "${RED}Error al iniciar servicios${NC}"
        docker compose -f docker-compose.prod.yml logs
        exit 1
    fi
}
# ===========================================
deploy_pm2() {
    echo -e "${YELLOW}Desplegando con PM2...${NC}"
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}Instalando PM2...${NC}"
        npm install -g pm2
    fi
    
    # Instalar dependencias
    echo -e "${BLUE}Instalando dependencias...${NC}"
    bun install
    
    # Generar Prisma Client
    echo -e "${BLUE}Generando Prisma Client...${NC}"
    bun run db:generate
    # Push de base de datos
    echo -e "${BLUE}Configurando base de datos...${NC}"
    bun run db:push
    # Build de producción
    echo -e "${BLUE}Construyendo aplicación...${NC}"
    bun run build
    # Iniciar con PM2
    echo -e "${BLUE}Iniciando servicios con PM2...${NC}"
    pm2 start ecosystem.config.js
    
    # Guardar configuración
    pm2 save
    echo -e "${GREEN}✅ Aplicación iniciada correctamente${NC}"
}
# ===========================================
# Inicializar aplicación
# ===========================================
initialize_app() {
    echo -e "${YELLOW}Inicializando aplicación...${NC}"
    
    # Crear archivo de bloqueo si existe
    if [ -f "/tmp/init-complete" ]; then
        echo -e "${GREEN}La aplicación ya fue inicializada${NC}"
        return
    fi
    
    # Esperar a que la aplicación esté lista
    echo -e "${YELLOW}Esperando a que la aplicación esté lista...${NC}"
    sleep 30
    # Inicializar admin
    echo -e "${BLUE}Creando usuario administrador...${NC}"
    curl -s -X POST http://localhost:3000/api/auth/init-admin \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@condominio.com","password":"Admin123!","nombre":"Administrador","rol":"admin"}'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Usuario administrador creado${NC}"
    else
        echo -e "${YELLOW}El usuario ya existe o${NC}"
    fi
    
    # Cargar datos de catálogos
    echo -e "${BLUE}Cargando catálogos...${NC}"
    curl -s -X POST http://localhost:3000/api/seed-catalogos > /dev/null
    
    # Cargar datos iniciales
    echo -e "${BLUE}Cargando datos iniciales...${NC}"
    curl -s -X POST http://localhost:3000/api/seed > /dev/null
    
    # Marcar como completado
    touch /tmp/init-complete
    echo -e "${GREEN}✅ Aplicación inicializada correctamente${NC}"
}
# ===========================================
# Menú principal
# ===========================================
main() {
    show_banner
    
    check_dependencies
    
    
    echo ""
    echo -e "${YELLOW}Selecciona método de despliegue:${NC}"
    echo "  1) Docker (Recomendado para producción)"
    echo "  2) PM2 (Servidor dedicado)"
    echo "  3) Inicializar aplicación"
    echo "  4) Salir"
    echo ""
    read -p "Opción [1-4]: " option
    
    case $option in
        1) deploy_docker ;;
        2) deploy_pm2 ;;
        3) initialize_app ;;
        4) echo -e "${GREEN}¡ Despliegue completado!${NC}"
            echo -e "${BLUE}Accede a la aplicación en: http://localhost:3000${NC}
            ;;
        4) echo -e "${GREEN}¡ Hasta pronto!${NC}"
            ;;
        *)
            echo -e "${RED}Opción no válida${NC}"
            exit 1
            ;;
    esac
}
