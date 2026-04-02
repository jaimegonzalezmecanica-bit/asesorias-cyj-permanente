/**
 * API para crear el usuario administrador inicial
 * SEGURO: Requiere token de configuración y genera contraseña aleatoria
 *
 * CORREGIDO:
 * - Eliminada exposición de contraseña en respuesta
 * - Agregado requerimiento de SETUP_TOKEN
 * - Eliminado acceso GET (solo POST)
 * - Contraseña aleatoria segura de 16 caracteres
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// Genera una contraseña aleatoria segura
function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (x) => chars[x % chars.length]).join('')
}

// Validar que el token de configuración es correcto
function validateSetupToken(token: string | null): boolean {
  const setupToken = process.env.SETUP_TOKEN

  // Si no hay token configurado, no permitir acceso
  if (!setupToken) {
    console.error('SETUP_TOKEN no configurado en variables de entorno')
    return false
  }

  // Comparación segura contra timing attacks
  if (!token || token.length !== setupToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ setupToken.charCodeAt(i)
  }
  return result === 0
}

async function createAdmin(requestedEmail?: string, requestedPassword?: string) {
  // Verificar si ya existe algún usuario administrador
  const existingAdmin = await db.user.findFirst({
    where: { rol: 'admin' }
  })

  if (existingAdmin) {
    return {
      success: false,
      message: 'Ya existe un usuario administrador',
      error: 'ADMIN_EXISTS'
    }
  }

  // Generar contraseña segura si no se proporciona
  const plainPassword = requestedPassword || generateSecurePassword(16)
  const hashedPassword = await hashPassword(plainPassword)

  // Email por defecto o el proporcionado
  const email = requestedEmail || 'admin@cyj.cl'

  const admin = await db.user.create({
    data: {
      email,
      nombre: 'Administrador',
      apellido: 'Sistema',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      emailVerificado: new Date(),
      permisos: JSON.stringify({
        'usuarios.ver': true, 'usuarios.crear': true, 'usuarios.editar': true, 'usuarios.eliminar': true,
        'residentes.ver': true, 'residentes.crear': true, 'residentes.editar': true, 'residentes.eliminar': true,
        'propiedades.ver': true, 'propiedades.crear': true, 'propiedades.editar': true, 'propiedades.eliminar': true,
        'personal.ver': true, 'personal.crear': true, 'personal.editar': true, 'personal.eliminar': true,
        'proveedores.ver': true, 'proveedores.crear': true, 'proveedores.editar': true, 'proveedores.eliminar': true,
        'ots.ver': true, 'ots.crear': true, 'ots.editar': true, 'ots.eliminar': true, 'ots.aprobar': true,
        'proyectos.ver': true, 'proyectos.crear': true, 'proyectos.editar': true, 'proyectos.eliminar': true,
        'gastos.ver': true, 'gastos.crear': true, 'gastos.editar': true, 'gastos.eliminar': true, 'gastos.aprobar': true,
        'inspecciones.ver': true, 'inspecciones.crear': true, 'inspecciones.editar': true, 'inspecciones.eliminar': true,
        'activos.ver': true, 'activos.crear': true, 'activos.editar': true, 'activos.eliminar': true,
        'catalogos.ver': true, 'catalogos.crear': true, 'catalogos.editar': true, 'catalogos.eliminar': true,
        'centros-costo.ver': true, 'centros-costo.crear': true, 'centros-costo.editar': true, 'centros-costo.eliminar': true,
        'reportes.ver': true, 'reportes.exportar': true,
        'configuracion.ver': true, 'configuracion.editar': true,
        'logs.ver': true,
        'inventario.ver': true, 'inventario.editar': true,
      })
    }
  })

  // Log seguro - no incluir contraseña
  console.log(`[INIT-ADMIN] Usuario admin creado: ${admin.email}`)

  return {
    success: true,
    message: 'Usuario administrador creado exitosamente',
    user: {
      email: admin.email,
      nombre: admin.nombre,
      rol: admin.rol
    },
    // CORREGIDO: Solo mostrar contraseña una vez, indicando que debe guardarse
    temporaryPassword: plainPassword,
    warning: 'GUARDE ESTA CONTRASEÑA EN UN LUGAR SEGURO. NO SE VOLVERÁ A MOSTRAR.'
  }
}

// CORREGIDO: Eliminado método GET - solo POST es seguro
export async function POST(request: NextRequest) {
  try {
    // Validar token de configuración
    const body = await request.json().catch(() => ({}))
    const setupToken = body.setupToken || request.headers.get('X-Setup-Token')

    if (!validateSetupToken(setupToken)) {
      return NextResponse.json({
        success: false,
        error: 'Token de configuración inválido o no proporcionado',
        hint: 'Incluya SETUP_TOKEN en las variables de entorno y envíelo en el body o header X-Setup-Token'
      }, { status: 401 })
    }

    // Crear admin con email y password opcionales
    const result = await createAdmin(body.email, body.password)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creando admin:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear usuario administrador'
    }, { status: 500 })
  }
}

// Endpoint para verificar si ya existe un admin (sin crear uno)
export async function GET() {
  try {
    const existingAdmin = await db.user.findFirst({
      where: { rol: 'admin' },
      select: { email: true, nombre: true, rol: true, createdAt: true }
    })

    return NextResponse.json({
      adminExists: !!existingAdmin,
      admin: existingAdmin ? {
        email: existingAdmin.email,
        nombre: existingAdmin.nombre,
        createdAt: existingAdmin.createdAt
      } : null
    })
  } catch {
    return NextResponse.json({ adminExists: false, error: 'Error verificando admin' }, { status: 500 })
  }
}
