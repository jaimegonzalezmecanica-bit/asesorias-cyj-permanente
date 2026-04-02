/**
 * API para crear usuarios de prueba por tipo de personal
 * Condominio Laguna Norte - Sistema de Gestión v2
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    const usuariosCreados = []
    
    // Crear Admin
    const adminExistente = await db.user.findUnique({
      where: { email: 'admin@condominio.com' }
    })
    
    if (!adminExistente) {
      const hashedPassword = await hashPassword('Admin123!')
      const admin = await db.user.create({
        data: {
          email: 'admin@condominio.com',
          nombre: 'Administrador',
          apellido: 'Sistema',
          password: hashedPassword,
          rol: 'admin',
          activo: true,
        }
      })
      usuariosCreados.push({ email: admin.email, rol: admin.rol })
    }
    
    // Crear Supervisor
    const supervisorExistente = await db.user.findUnique({
      where: { email: 'supervisor@condominio.com' }
    })
    
    if (!supervisorExistente) {
      // Crear personal supervisor
      const personalSupervisor = await db.personal.create({
        data: {
          nombre: 'Carlos Supervisor',
          cargo: 'Supervisor',
          contrato: 'Indefinido',
          email: 'supervisor@condominio.com',
          telefono: '+56 9 5555 6666',
          estado: 'Activo',
          sueldoBase: 1000000,
          movilizacion: 60000,
          colacion: 35000,
        }
      })
      
      const hashedPassword = await hashPassword('Supervisor123!')
      const supervisor = await db.user.create({
        data: {
          email: 'supervisor@condominio.com',
          nombre: 'Carlos',
          apellido: 'Supervisor',
          password: hashedPassword,
          rol: 'supervisor',
          personalId: personalSupervisor.id,
          activo: true,
        }
      })
      usuariosCreados.push({ email: supervisor.email, rol: supervisor.rol })
    }
    
    // Crear Mantención
    const mantencionExistente = await db.user.findUnique({
      where: { email: 'mantencion@condominio.com' }
    })
    
    if (!mantencionExistente) {
      // Crear personal mantención
      const personalMantencion = await db.personal.create({
        data: {
          nombre: 'Juan Mantención',
          cargo: 'Mantención',
          contrato: 'Indefinido',
          email: 'mantencion@condominio.com',
          telefono: '+56 9 1111 2222',
          estado: 'Activo',
          sueldoBase: 800000,
          movilizacion: 50000,
          colacion: 30000,
        }
      })
      
      const hashedPassword = await hashPassword('Mantencion123!')
      const mantencion = await db.user.create({
        data: {
          email: 'mantencion@condominio.com',
          nombre: 'Juan',
          apellido: 'Mantención',
          password: hashedPassword,
          rol: 'mantencion',
          personalId: personalMantencion.id,
          activo: true,
        }
      })
      usuariosCreados.push({ email: mantencion.email, rol: mantencion.rol })
    }
    
    // Crear Limpieza
    const limpiezaExistente = await db.user.findUnique({
      where: { email: 'limpieza@condominio.com' }
    })
    
    if (!limpiezaExistente) {
      // Crear personal limpieza
      const personalLimpieza = await db.personal.create({
        data: {
          nombre: 'María Limpieza',
          cargo: 'Limpieza',
          contrato: 'Indefinido',
          email: 'limpieza@condominio.com',
          telefono: '+56 9 3333 4444',
          estado: 'Activo',
          sueldoBase: 700000,
          movilizacion: 40000,
          colacion: 25000,
        }
      })
      
      const hashedPassword = await hashPassword('Limpieza123!')
      const limpieza = await db.user.create({
        data: {
          email: 'limpieza@condominio.com',
          nombre: 'María',
          apellido: 'Limpieza',
          password: hashedPassword,
          rol: 'limpieza',
          personalId: personalLimpieza.id,
          activo: true,
        }
      })
      usuariosCreados.push({ email: limpieza.email, rol: limpieza.rol })
    }
    
    // Crear permisos por rol
    const permisosPorRol = [
      {
        rol: 'admin',
        descripcion: 'Administrador con acceso total',
        permisos: JSON.stringify({
          dashboard: { ver: true, verTodasOTs: true, verAprobaciones: true },
          ot: { ver: true, verTodas: true, crear: true, editar: true, eliminar: true, aprobar: true },
          gastos: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true },
          activos: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true },
          usuarios: { ver: true, crear: true, editar: true, eliminar: true },
        })
      },
      {
        rol: 'supervisor',
        descripcion: 'Supervisor con permisos de creación bajo aprobación',
        permisos: JSON.stringify({
          dashboard: { ver: true, verTodasOTs: true, verAprobaciones: true },
          ot: { ver: true, verTodas: true, crear: true, editar: true, aprobar: false, verAprobacion: true },
          gastos: { ver: true, crear: true, editar: true, aprobar: false, necesitaAprobacion: true },
          activos: { ver: true, crear: true, editar: true, aprobar: false, necesitaAprobacion: true },
        })
      },
      {
        rol: 'mantencion',
        descripcion: 'Personal de mantención - ve OTs asignadas',
        permisos: JSON.stringify({
          dashboard: { ver: true, verTodasOTs: false, verAprobaciones: false },
          ot: { ver: true, verAsignadas: true, verTodas: false, crear: false, editar: true, cambiarEstado: true },
          gastos: { ver: true, verPropios: true, crear: true, necesitaAprobacion: true },
        })
      },
      {
        rol: 'limpieza',
        descripcion: 'Personal de limpieza - solo ve sus OTs',
        permisos: JSON.stringify({
          dashboard: { ver: true, verTodasOTs: false, verAprobaciones: false },
          ot: { ver: true, verAsignadas: true, verTodas: false, crear: false, editar: false, cambiarEstado: true },
        })
      },
    ]
    
    for (const permiso of permisosPorRol) {
      await db.rolPermiso.upsert({
        where: { rol: permiso.rol },
        create: permiso,
        update: permiso,
      })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Usuarios de prueba creados exitosamente',
      usuarios: {
        admin: 'admin@condominio.com / Admin123!',
        supervisor: 'supervisor@condominio.com / Supervisor123!',
        mantencion: 'mantencion@condominio.com / Mantencion123!',
        limpieza: 'limpieza@condominio.com / Limpieza123!',
      },
      creados: usuariosCreados
    })
    
  } catch (error) {
    console.error('Error creando usuarios de prueba:', error)
    return NextResponse.json({ 
      error: 'Error al crear usuarios de prueba',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
