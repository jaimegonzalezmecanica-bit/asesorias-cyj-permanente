import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE - Eliminar punto de ronda
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar si tiene registros asociados
    const registrosCount = await db.registroRonda.count({
      where: { puntoId: id }
    })

    if (registrosCount > 0) {
      // Si tiene registros, solo desactivar
      await db.puntoRonda.update({
        where: { id },
        data: { activo: false }
      })
      return NextResponse.json({ 
        message: 'Punto desactivado (tiene registros asociados)' 
      })
    }

    // Si no tiene registros, eliminar completamente
    await db.puntoRonda.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Punto eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting punto de ronda:', error)
    return NextResponse.json(
      { error: 'Error al eliminar punto de ronda' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar punto de ronda
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const punto = await db.puntoRonda.update({
      where: { id },
      data: {
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        descripcion: data.descripcion,
        activo: data.activo,
        orden: data.orden,
      }
    })

    return NextResponse.json(punto)
  } catch (error) {
    console.error('Error updating punto de ronda:', error)
    return NextResponse.json(
      { error: 'Error al actualizar punto de ronda' },
      { status: 500 }
    )
  }
}
