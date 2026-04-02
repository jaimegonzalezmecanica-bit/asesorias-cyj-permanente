#!/bin/bash

# Script de Restauración - Sistema CyJ Condominios
# Uso: ./restore_backup.sh [nombre_carpeta_backup]

BACKUP_NAME=${1:-"backup_20260322_030408"}
BACKUP_DIR="/home/z/my-project/backups/$BACKUP_NAME"
PROJECT_DIR="/home/z/my-project"

echo "=================================="
echo "  RESTAURACIÓN DEL SISTEMA CYJ"
echo "=================================="
echo ""

# Verificar que existe el backup
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: No se encuentra el respaldo en $BACKUP_DIR"
    echo ""
    echo "Respaldos disponibles:"
    ls -la /home/z/my-project/backups/
    exit 1
fi

echo "📁 Respaldo a restaurar: $BACKUP_NAME"
echo ""

# Confirmar restauración
read -p "⚠️  Esto sobrescribirá la base de datos actual. ¿Continuar? (s/n): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "❌ Restauración cancelada."
    exit 0
fi

echo ""
echo "🔄 Restaurando..."

# Crear backup de la base de datos actual antes de sobrescribir
CURRENT_BACKUP="$PROJECT_DIR/backups/pre_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP"
cp "$PROJECT_DIR/db/custom.db" "$CURRENT_BACKUP/" 2>/dev/null
echo "✅ Backup de seguridad actual guardado en: $CURRENT_BACKUP"

# Restaurar base de datos
if [ -f "$BACKUP_DIR/db/custom.db" ]; then
    cp "$BACKUP_DIR/db/custom.db" "$PROJECT_DIR/db/"
    echo "✅ Base de datos restaurada"
else
    echo "⚠️  No se encontró la base de datos en el respaldo"
fi

# Restaurar schema de Prisma
if [ -f "$BACKUP_DIR/prisma/schema.prisma" ]; then
    cp "$BACKUP_DIR/prisma/schema.prisma" "$PROJECT_DIR/prisma/"
    echo "✅ Schema Prisma restaurado"
fi

# Restaurar archivos de configuración
for file in package.json tsconfig.json next.config.ts tailwind.config.ts components.json; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        cp "$BACKUP_DIR/$file" "$PROJECT_DIR/"
        echo "✅ $file restaurado"
    fi
done

# Restaurar librerías
if [ -d "$BACKUP_DIR/src/lib" ]; then
    cp -r "$BACKUP_DIR/src/lib/"* "$PROJECT_DIR/src/lib/"
    echo "✅ Librerías restauradas"
fi

echo ""
echo "=================================="
echo "✅ RESTAURACIÓN COMPLETADA"
echo "=================================="
echo ""
echo "Nota: Ejecuta 'bun install' si hubo cambios en package.json"
echo "Nota: Ejecuta 'bun run db:push' si hubo cambios en el schema"
