#!/bin/bash

# ===========================================
# Script de Verificación Pre-Deploy
# Condominio Laguna Norte - Sistema de Gestión v2
# ===========================================
# Ejecuta este script antes de hacer push para verificar
# que todo esté listo para producción

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

errors=0
warnings=0

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       VERIFICACIÓN PRE-DEPLOY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ===========================================
# 1. Verificar archivos esenciales
# ===========================================
echo -e "${BLUE}▶ Verificando archivos esenciales...${NC}"

essential_files=(
    "Dockerfile"
    "docker-compose.prod.yml"
    "Caddyfile"
    ".env.production.example"
    "prisma/schema.prisma"
    "package.json"
)

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file ${RED}(FALTA)${NC}"
        ((errors++))
    fi
done

# ===========================================
# 2. Verificar scripts
# ===========================================
echo ""
echo -e "${BLUE}▶ Verificando scripts de deploy...${NC}"

script_files=(
    "scripts/backup.sh"
    "scripts/init-production.sh"
    "deploy.sh"
    ".github/workflows/deploy.yml"
)

for file in "${script_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file ${RED}(FALTA)${NC}"
        ((errors++))
    fi
done

# ===========================================
# 3. Verificar que el código compila
# ===========================================
echo ""
echo -e "${BLUE}▶ Verificando build de producción...${NC}"

if bun run lint > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Lint pasa correctamente"
else
    echo -e "  ${RED}✗${NC} Errores de lint ${RED}(ejecuta: bun run lint)${NC}"
    ((errors++))
fi

if bun run build > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Build de producción exitoso"
else
    echo -e "  ${RED}✗${NC} Build falla ${RED}(revisa los errores)${NC}"
    ((errors++))
fi

# ===========================================
# 4. Verificar estructura de directorios
# ===========================================
echo ""
echo -e "${BLUE}▶ Verificando estructura...${NC}"

required_dirs=(
    "src/app"
    "src/components"
    "src/lib"
    "prisma"
    "public"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "  ${GREEN}✓${NC} $dir/"
    else
        echo -e "  ${RED}✗${NC} $dir/ ${RED}(FALTA)${NC}"
        ((errors++))
    fi
done

# ===========================================
# 5. Verificar Secrets de GitHub (checklist)
# ===========================================
echo ""
echo -e "${BLUE}▶ Checklist de Secrets en GitHub:${NC}"
echo -e "  ${YELLOW}Asegúrate de configurar estos secrets en GitHub:${NC}"
echo ""
echo -e "  ${BLUE}Secrets OBLIGATORIOS:${NC}"
echo "    • DOCKER_USERNAME"
echo "    • DOCKER_PASSWORD"
echo "    • SERVER_HOST"
echo "    • SERVER_USER"
echo "    • SSH_PRIVATE_KEY"
echo "    • DEPLOY_PATH"
echo "    • NEXTAUTH_URL"
echo "    • NEXTAUTH_SECRET"
echo "    • ENCRYPTION_KEY"
echo ""
echo -e "  ${BLUE}Secrets OPCIONALES:${NC}"
echo "    • SLACK_WEBHOOK_URL"
echo "    • SERVER_PORT (default: 22)"
echo ""

# ===========================================
# 6. Verificar cambios no commiteados
# ===========================================
echo ""
echo -e "${BLUE}▶ Verificando estado de Git...${NC}"

if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Sin cambios pendientes"
else
    echo -e "  ${YELLOW}⚠${NC} Tienes cambios sin commit"
    echo -e "  ${YELLOW}  Ejecuta: git status${NC}"
    ((warnings++))
fi

# ===========================================
# Resumen
# ===========================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    RESUMEN${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ TODO OK - Listo para deploy!${NC}"
    echo ""
    echo -e "Para deployar, ejecuta:"
    echo -e "  ${BLUE}git add . && git commit -m 'Ready for deploy' && git push${NC}"
    echo ""
    echo -e "O manualmente en el servidor:"
    echo -e "  ${BLUE}./deploy.sh${NC}"
else
    echo -e "${RED}❌ ERRORES ENCONTRADOS: $errors${NC}"
    echo -e "${YELLOW}   Corrige los errores antes de deployar${NC}"
fi

if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ADVERTENCIAS: $warnings${NC}"
fi

echo ""
exit $errors
