import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar OTs pendientes de aprobación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const search = searchParams.get('search')
    
    // Construir filtros
    const where: any = {
      // Solo OTs que han solicitado aprobación (tienen fecha de solicitud)
      fechaSolicitudAprob: { not: null }
    }
    
    if (estado && estado !== 'all') {
      where.estadoAprobacion = estado
    }
    
    if (search) {
      where.OR = [
        { otNum: { contains: search } },
        { titulo: { contains: search } },
      ]
    }
    
    const ordenes = await db.ordenTrabajo.findMany({
      where,
      include: {
        centroCosto: {
          select: { id: true, codigo: true, nombre: true }
        },
        asignado: {
          select: { id: true, nombre: true }
        },
        propiedad: {
          select: { id: true, nombre: true }
        },
        materiales: true,
        herramientas: true,
        tareas: true,
        personalOT: true,
        historialAprobaciones: {
          orderBy: { fechaAccion: 'desc' }
        }
      },
      orderBy: { fechaSolicitudAprob: 'desc' }
    })
    
    // Calcular estadísticas
    const estadisticas = {
      Pendiente: await db.ordenTrabajo.count({ 
        where: { ...where, estadoAprobacion: 'Pendiente' } 
      }),
      Aprobada: await db.ordenTrabajo.count({ 
        where: { ...where, estadoAprobacion: 'Aprobada' } 
      }),
      Rechazada: await db.ordenTrabajo.count({ 
        where: { ...where, estadoAprobacion: 'Rechazada' } 
      }),
    }
    
    return NextResponse.json({ ordenes, estadisticas })
  } catch (error) {
    console.error('Error fetching aprobaciones OT:', error)
    return NextResponse.json(
      { error: 'Error al obtener aprobaciones' },
      { status: 500 }
    )
  }
}

// POST - Aprobar o rechazar OT
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { otId, accion, observaciones, aprobadoPor, nombreAprobador } = data
    
    if (!otId || !accion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }
    
    const nuevoEstado = accion === 'aprobar' ? 'Aprobada' : 'Rechazada'
    const ahora = new Date().toISOString()
    
    // Obtener estado anterior
    const otActual = await db.ordenTrabajo.findUnique({
      where: { id: otId },
      select: { estadoAprobacion: true }
    })
    
    // Actualizar OT
    const otActualizada = await db.ordenTrabajo.update({
      where: { id: otId },
      data: {
        estadoAprobacion: nuevoEstado,
        fechaAprobacion: ahora,
        aprobadoPor: aprobadoPor,
        observacionesAprob: observaciones || null,
        // Si se aprueba, cambiar estado de la OT a "En Progreso" o mantener
        ...(accion === 'aprobar' ? { 
          estado: 'En Progreso',
          fechaInicioReal: new Date().toISOString().split('T')[0]
        } : {
          estado: 'Cancelado'
        })
      }
    })
    
    // Registrar en historial
    await db.historialAprobacionOT.create({
      data: {
        otId,
        estadoAnterior: otActual?.estadoAprobacion || 'Pendiente',
        estadoNuevo: nuevoEstado,
        observaciones: observaciones || null,
        aprobadoPor: aprobadoPor,
        nombreAprobador: nombreAprobador,
        fechaAccion: ahora,
      }
    })
    
    return NextResponse.json({ 
      message: `OT ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`,
      ot: otActualizada 
    })
  } catch (error) {
    console.error('Error processing aprobacion:', error)
    return NextResponse.json(
      { error: 'Error al procesar aprobación' },
      { status: 500 }
    )
  }
}
