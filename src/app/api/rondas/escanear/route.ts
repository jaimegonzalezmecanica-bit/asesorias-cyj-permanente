import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Registrar escaneo de ronda
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verificar que el punto existe
    const punto = await db.puntoRonda.findUnique({
      where: { id: data.puntoId }
    })

    if (!punto) {
      return NextResponse.json(
        { error: 'Punto de ronda no encontrado' },
        { status: 404 }
      )
    }

    if (!punto.activo) {
      return NextResponse.json(
        { error: 'Este punto de ronda está inactivo' },
        { status: 400 }
      )
    }

    // Crear el registro
    const registro = await db.registroRonda.create({
      data: {
        puntoId: data.puntoId,
        usuarioId: data.usuarioId || null,
        usuarioNombre: data.usuarioNombre || 'Sistema',
        observaciones: data.observaciones || null,
        estado: data.estado || 'Normal',
        notaIncidencia: data.notaIncidencia || null,
        foto: data.foto || null,
      },
      include: {
        punto: {
          select: {
            nombre: true,
            ubicacion: true,
          }
        }
      }
    })

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Error registrando ronda:', error)
    return NextResponse.json(
      { error: 'Error al registrar ronda' },
      { status: 500 }
    )
  }
}
