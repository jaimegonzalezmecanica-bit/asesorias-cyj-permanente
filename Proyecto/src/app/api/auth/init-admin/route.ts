/**
 * API para crear el usuario administrador inicial
 * Servicios Integrales - Sistema de Gestión v2
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@condominio.com' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'El usuario administrador ya existe',
        user: {
          email: existingAdmin.email,
          nombre: existingAdmin.nombre,
          rol: existingAdmin.rol
        }
      })
    }
    
    // Crear usuario administrador
    const hashedPassword = await hashPassword('Admin123!')
    
    const admin = await db.user.create({
      data: {
        email: 'admin@condominio.com',
        nombre: 'Administrador',
        apellido: 'Sistema',
        password: hashedPassword,
        rol: 'admin',
        activo: true,
        emailVerificado: new Date(),
      }
    })
    
    return NextResponse.json({ 
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol
      }
    })
    
  } catch (error) {
    console.error('Error creando admin:', error)
    return NextResponse.json({ 
      error: 'Error al crear usuario administrador',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
