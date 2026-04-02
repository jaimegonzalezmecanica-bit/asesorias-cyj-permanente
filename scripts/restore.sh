#!/bin/bash

# ===========================================
# Script de Restauración - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
DATA_DIR="${DATA_DIR:-/app/data}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Restauración - Condominio Laguna Norte${NC}"
echo -e "${GREEN}========================================${NC}"

# Listar backups disponibles
echo -e "${YELLOW}Backups disponibles:${NC}"
echo ""

backups=($(ls -t "$BACKUP_DIR"/condominio_backup_*.tar.gz 2>/dev/null))
if [ ${#backups[@]} -eq 0 ]; then
    echo -e "${RED}No hay backups disponibles${NC}"
    exit 1
fi

# Mostrar backups con índice
for i in "${!backups[@]}"; do
    backup="${backups[$i]}"
    size=$(du -h "$backup" | cut -f1)
    date=$(stat -c %y "$backup" | cut -d'.' -f1)
    echo -e "  [$i] $(basename $backup) (${size}) - ${date}"
done

echo ""
read -p "Selecciona el backup a restaurar [0-$((${#backups[@]}-1))]: " selection

if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -ge ${#backups[@]} ]; then
    echo -e "${RED}Selección inválida${NC}"
    exit 1
fi

BACKUP_FILE="${backups[$selection]}"
echo ""
echo -e "${YELLOW}Se restaurará: $(basename $BACKUP_FILE)${NC}"
echo -e "${RED}ADVERTENCIA: Esto sobrescribirá la base de datos actual${NC}"
read -p "¿Continuar? [y/N]: " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

# ===========================================
# Detener Servicios
# ===========================================
echo -e "${YELLOW}Deteniendo servicios...${NC}"
docker compose -f docker-compose.prod.yml stop app 2>/dev/null || true
pm2 stop condominio-app 2>/dev/null || true

# ===========================================
# Backup de Base Actual
# ===========================================
CURRENT_BACKUP="$DATA_DIR/condominio_pre_restore_$(date +%Y%m%d_%H%M%S).db"
if [ -f "$DATA_DIR/condominio.db" ]; then
    cp "$DATA_DIR/condominio.db" "$CURRENT_BACKUP"
    echo -e "${GREEN}✓ Backup actual guardado: $CURRENT_BACKUP${NC}"
fi

# ===========================================
# Restaurar
# ===========================================
echo -e "${YELLOW}Restaurando base de datos...${NC}"

TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

if [ -f "$TEMP_DIR/condominio.db" ]; then
    cp "$TEMP_DIR/condominio.db" "$DATA_DIR/condominio.db"
    echo -e "${GREEN}✓ Base de datos restaurada${NC}"
else
    echo -e "${RED}✗ Error: No se encontró la base de datos en el backup${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

rm -rf "$TEMP_DIR"

# ===========================================
# Restaurar Archivos (si existen)
# ===========================================
UPLOAD_BACKUP="${BACKUP_FILE%.tar.gz}_uploads.tar.gz"
if [ -f "$UPLOAD_BACKUP" ]; then
    echo -e "${YELLOW}Restaurando archivos...${NC}"
    tar -xzf "$UPLOAD_BACKUP" -C /app
    echo -e "${GREEN}✓ Archivos restaurados${NC}"
fi

# ===========================================
# Reiniciar Servicios
# ===========================================
echo -e "${YELLOW}Reiniciando servicios...${NC}"
docker compose -f docker-compose.prod.yml start app 2>/dev/null || true
pm2 start condominio-app 2>/dev/null || true

# ===========================================
# Verificar
# ===========================================
echo -e "${YELLOW}Verificando...${NC}"
sleep 5

if curl -sf http://localhost:3000/api/auth/session > /dev/null; then
    echo -e "${GREEN}✓ Aplicación funcionando correctamente${NC}"
else
    echo -e "${RED}✗ Error: La aplicación no responde${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       Restauración Completada         ${NC}"
echo -e "${GREEN}========================================${NC}"
