import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Crear usuario con las credenciales mostradas en la página de login
    const email = 'admin@cyjcondominios.cl'
    const password = 'admin123'
    const hashedPassword = await hashPassword(password)

    // Eliminar usuarios existentes con ese email
    await db.user.deleteMany({
      where: { email }
    })

    // Crear usuario admin
    const user = await db.user.create({
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
          'personal.ver': true, 'personal.crear': true, 'personal.editar': true, 'personal.eliminar': true,
          'ots.ver': true, 'ots.crear': true, 'ots.editar': true, 'ots.eliminar': true, 'ots.aprobar': true,
          'reportes.ver': true, 'reportes.exportar': true,
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      credentials: {
        email: user.email,
        password: password
      }
    })
  } catch (error) {
    console.error('Error resetting admin:', error)
    return NextResponse.json({
      error: 'Error al restablecer credenciales',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
