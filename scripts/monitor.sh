#!/bin/bash
set -e
# ===========================================
# Script de Monitoreo - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================
# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
# Configuración
APP_URL="${APP_URL:-http://localhost:3000}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"  # segundos
LOG_FILE="./logs/monitor.log"
# ===========================================
# Funciones de logging
# ===========================================
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
}
error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] ERROR: $1" >&2
    exit 1
}
# ===========================================
# Verificar estado de la aplicación
# ===========================================
check_app_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/auth/session" 2>/dev/null)
    local status=$?
    
    if [ $status -eq 200 ]; then
        return 0
    else
        return 1
    fi
}
# ===========================================
# Verificar base de datos
# ===========================================
check_database() {
    local response=$(curl -s -o /dev/null "$APP_URL/api/dashboard" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        return 0
    else
        return 1
    fi
}
# ===========================================
# Verificar OT Scheduler
# ===========================================
check_scheduler() {
    # Check if scheduler port is responding
    if command -v nc -z localhost 3010 &> /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}
# ===========================================
# Obtener estadísticas
# ===========================================
get_stats() {
    # Memoria
    local mem_info=$(free -m | grep Mem | awk '{print $3}')
    local mem_used=$(echo "$mem_info" | awk '{print $3}')
    local mem_total=$(echo "$mem_info" | awk '{print $2}')
    
    # Disco
    local disk_info=$(df -h . 2>/dev/null | tail -1)
    local disk_used=$(echo "$disk_info" | awk '{print $3}')
    
    # CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+4}' | head -1)
    
    echo "📊 System Stats:"
    echo "   Memory: ${mem_used}MB / ${mem_total}MB"
    echo "   Disk: ${disk_used}GB used"
    echo "   CPU: ${cpu_usage}%"
}
# ===========================================
# Enviar alerta de problemas
# ===========================================
send_alert() {
    local message=$1
    local severity=${2:-warning}
    
    # Slack
    if [ "$SLACK_WEBHOOK_URL" != "" ]; then
        curl -X POST -H 'Content-Type: application/json' \
            -d "{\"text\":\"[$severity] ${message}\", \"attachments\":[{\"color\": \"$severity\" == \"critical\" ? \"danger" : "warning\", \"text\": \"$message\"}]}"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null
    fi
    
    # Telegram
    if [ "$TELEGRAM_BOT_TOKEN" != "" ] && [ "$TELEGRAM_CHAT_ID" != "" ]; then
        curl -X POST \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -H 'Content-Type: application/json' \
            -d "{\"chat_id\": \"$TELEGRAM_CHAT_ID\", \"text\": \"[$severity] ${message}\"}" \
            2>/dev/null
    fi
}
# ===========================================
# Main
# ===========================================
main() {
    # Crear directorio de logs
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════${NC}"
    echo -e "${BLUE}║   Condominio Laguna Norte - Monitoreo           ║${NC}"
    echo -e "${BLUE}╔════════════════════════════════════════════${NC}"
    echo ""
    
    # Contadores
    local consecutive_failures=0
    local last_check_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        
        # Verificar si es tiempo para check
        if [ $((current_time - last_check_time)) -ge $CHECK_INTERVAL ]; then
            log "Running health checks..."
            
            local app_healthy=$(check_app_health)
            local db_healthy=$(check_database)
            local scheduler_healthy=$(check_scheduler)
            
            if [ $app_healthy -eq 0 ] && [ $db_healthy -eq 0 ]; then
                log "✅ All services healthy"
                consecutive_failures=0
            else
                consecutive_failures=$((consecutive_failures + 1))
                log "⚠ Some services unhealthy (failures: $consecutive_failures)"
                
                # Enviar alerta si hay problemas cr persistentes
                if [ $consecutive_failures -ge 3 ]; then
                    send_alert "Multiple services are down!" "critical"
                fi
            fi
            
            # Mostrar estadísticas
            get_stats
            
            last_check_time=$current_time
        fi
        
        sleep $CHECK_INTERVAL
    done
}
