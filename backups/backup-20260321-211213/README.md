# Copia de Seguridad - Asesorías Integrales CyJ

Fecha: 2026-03-21 21:12:40

## Contenido

### Base de Datos
- `db/custom.db` - Base de datos SQLite completa
- Tamaño: 536K

### Schema
- `prisma/schema.prisma` - Esquema de Prisma

## Restauración

1. Detener el servidor de desarrollo
2. Copiar el archivo de base de datos:
   ```bash
   cp db/custom.db /home/z/my-project/db/custom.db
   ```
3. Regenerar el cliente Prisma:
   ```bash
   npx prisma generate
   ```
4. Reiniciar el servidor

## Credenciales de Acceso
- Email: admin@cyjcondominios.cl
- Password: admin123

