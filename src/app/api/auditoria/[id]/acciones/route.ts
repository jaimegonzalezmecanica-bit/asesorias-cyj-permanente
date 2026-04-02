import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar acciones de una auditoría
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const acciones = await db.auditoriaAccion.findMany({
      where: { auditoriaId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(acciones)
  } catch (error) {
    console.error('Error fetching acciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las acciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva acción
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const accion = await db.auditoriaAccion.create({
      data: {
        auditoriaId: id,
        hallazgoId: data.hallazgoId || null,
        codigo: data.codigo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo || 'Correctiva',
        responsable: data.responsable || null,
        fechaCompromiso: data.fechaCompromiso || null,
        estado: 'Pendiente',
        notas: data.notas || null,
      }
    })

    // Si hay hallazgo relacionado, actualizar su estado
    if (data.hallazgoId) {
      await db.auditoriaHallazgo.update({
        where: { id: data.hallazgoId },
        data: { estado: 'Acción Definida' }
      })
    }

    return NextResponse.json(accion)
  } catch (error) {
    console.error('Error creating accion:', error)
    return NextResponse.json(
      { error: 'Error al crear la acción' },
      { status: 500 }
    )
  }
}
