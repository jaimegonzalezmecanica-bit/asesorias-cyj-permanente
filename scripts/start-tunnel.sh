#!/bin/bash

# ===========================================
# Script para crear túnel con Cloudflare
# Condominio Laguna Norte
# ===========================================

echo "🚀 Iniciando túnel Cloudflare..."
echo ""
echo "Esto creará una URL pública para tu aplicación local."
echo "La URL funcionará desde cualquier dispositivo (celular, tablet, etc)"
echo ""

# Verificar si cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "📦 cloudflared no está instalado."
    echo ""
    echo "Instala con uno de estos comandos:"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install cloudflared"
    echo ""
    echo "  Linux:"
    echo "    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared"
    echo "    chmod +x cloudflared"
    echo "    sudo mv cloudflared /usr/local/bin/"
    echo ""
    echo "  Windows (PowerShell como Admin):"
    echo "    winget install Cloudflare.cloudflared"
    echo ""
    exit 1
fi

echo "✅ cloudflared instalado"
echo ""
echo "🌐 Creando túnel hacia http://localhost:3000..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  IMPORTANTE: Copia la URL que aparecerá abajo"
echo "  Se verá algo como: https://xxx-yyy-zzz.trycloudflare.com"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Crear túnel
cloudflared tunnel --url http://localhost:3000
