#!/bin/bash

# ===========================================
# Script de Backup - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
DATA_DIR="${DATA_DIR:-/app/data}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="condominio_backup_${TIMESTAMP}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Backup - Condominio Laguna Norte    ${NC}"
echo -e "${GREEN}========================================${NC}"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# ===========================================
# Backup de Base de Datos SQLite
# ===========================================
echo -e "${YELLOW}Creando backup de base de datos...${NC}"

if [ -f "$DATA_DIR/condominio.db" ]; then
    # Crear directorio temporal
    TEMP_DIR=$(mktemp -d)
    
    # Copiar base de datos
    cp "$DATA_DIR/condominio.db" "$TEMP_DIR/"
    
    # Verificar integridad
    sqlite3 "$TEMP_DIR/condominio.db" "PRAGMA integrity_check;" > /dev/null
    
    # Comprimir
    cd "$TEMP_DIR"
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" condominio.db
    
    # Limpiar
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✓ Base de datos respaldada: ${BACKUP_NAME}.tar.gz${NC}"
else
    echo -e "${RED}✗ No se encontró la base de datos${NC}"
    exit 1
fi

# ===========================================
# Backup de Archivos Subidos
# ===========================================
if [ -d "/app/uploads" ]; then
    echo -e "${YELLOW}Creando backup de archivos...${NC}"
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C /app uploads 2>/dev/null || true
    echo -e "${GREEN}✓ Archivos respaldados${NC}"
fi

# ===========================================
# Backup de Configuración
# ===========================================
if [ -f "/app/.env.production" ]; then
    echo -e "${YELLOW}Creando backup de configuración...${NC}"
    cp "/app/.env.production" "$BACKUP_DIR/${BACKUP_NAME}.env.production"
    echo -e "${GREEN}✓ Configuración respaldada${NC}"
fi

# ===========================================
# Limpieza de Backups Antiguos
# ===========================================
echo -e "${YELLOW}Limpiando backups antiguos (> $RETENTION_DAYS días)...${NC}"

find "$BACKUP_DIR" -name "condominio_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "condominio_backup_*_uploads.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "condominio_backup_*.env.production" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Contar backups restantes
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "condominio_backup_*.tar.gz" | wc -l)
echo -e "${GREEN}✓ Backups disponibles: $BACKUP_COUNT${NC}"

# ===========================================
# Subir a Almacenamiento Externo (opcional)
# ===========================================
if [ -n "$AWS_S3_BUCKET" ]; then
    echo -e "${YELLOW}Subiendo backup a S3...${NC}"
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://$AWS_S3_BUCKET/backups/" --quiet
    echo -e "${GREEN}✓ Backup subido a S3${NC}"
fi

# ===========================================
# Resumen
# ===========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       Backup Completado               ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Archivo: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "Tamaño: $(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
echo -e "Fecha: $(date)"
echo ""

# Crear archivo de log
echo "$(date): Backup completado - ${BACKUP_NAME}.tar.gz" >> "$BACKUP_DIR/backup.log"
