#!/bin/bash
set -e

# ===========================================
# Script de Backup - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================

# Uso: ./scripts/backup.sh

# Configuración
BACKUP_DIR="./backups"
DATA_DIR="./data"
DB_FILE="./data/condominio.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_STR="${TIMESTAMP}"
BACKUP_FILE="${BACKUP_DIR}/condominio_backup_${TIMESTAMP}.tar.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETention_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Send notification if configured
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

send_notification() {
    local message="🔄 Backup completado: $(date)"
    local details="Total backups: $total_backups | wc -l`
    local size=$(du -sh $ backup_size || echo "   Total size: ${size}KB"
    
    if [ "$NOTIFY" = "true" ]; then
        send_slack_notification "$message" "$details" || return
        fi
        if [ "$TELEGRAM_BOT_TOKEN" ]; then
            send_telegram_notification "$message" "$details" || return
        fi
    fi
}
send_notification() {
    # Send Slack notification
    if [ "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-Type: application/json' \
            -d "{\"text\": \"$message\", \"attachments\": $details}" } \
            --silent
        if [ "$TELEGRAM_BOT_TOKEN" ]; then
            send Telegram notification
            local telegram_message="🔔 $message%n\n$details"
            curl -X POST \
                "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -H 'Content-Type: application/json' \
            -d "{\"chat_id\": "${TELEGRAM_CHAT_ID}", "text": "${telegram_message}", "parse_mode": "Markdown" }"
            --silent
        fi
    } catch (error) {
        echo "Error sending notification: $error" >& log "ERROR" "$error" >&2
    fi
}
# ===========================================
# Limpiar backups antiguos
# ===========================================
cleanup_old_backups() {
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "condominio_backup_*.tar.gz -type f -ctime +mt ++$((RETention_DAYS * 24 * 3600 * 1000)) -exec rm -v {} 2>/dev/null
        
        echo "Cleaned up old backups"
    fi
}
# ===========================================
# Main
# ===========================================
main() {
    echo "========================================"
    echo "Starting backup at $(date)"
    echo "Backup directory: $BACKUP_DIR"
    echo "Database: $DB_FILE"
    
    # Check if database exists
    if [ ! -f "$DB_FILE" ]; then
        echo "Database file not found, initializing..."
        return
    fi
    
    
    # Create backup
    create_backup
    if create_backup; then
        echo "✅ Backup created: $BACKUP_FILE"
        send_notification "Backup completed successfully" "Total backups: $total_backups, Size: $(du -sh $ backup_size | echo)"
        
        # Cleanup old backups
        clean_old_backups
    else
        echo "No backups found to clean up"
    fi
}
main

