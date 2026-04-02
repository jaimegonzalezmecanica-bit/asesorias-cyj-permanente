# ===========================================
# Dockerfile - Condominio Laguna Norte
# Sistema de Gestión v2
# ===========================================

# Stage 1: Instalar dependencias
FROM oven/bun:1 AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Instalar dependencias
RUN bun install --frozen-lockfile

# ===========================================
# Stage 2: Build de la aplicación
FROM oven/bun:1 AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma
RUN bun run db:generate

# Variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Construir la aplicación
RUN bun run build

# ===========================================
# Stage 3: Imagen de producción
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db

# Copiar mini-servicios
COPY --from=builder /app/mini-services ./mini-services

# Ajustar permisos
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["bun", "server.js"]
