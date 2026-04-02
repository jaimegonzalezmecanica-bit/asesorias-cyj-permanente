import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single espacio comun
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const espacio = await db.espacioComun.findUnique({
      where: { id },
      include: {
        reservas: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!espacio) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(espacio)
  } catch (error) {
    console.error('Error fetching espacio:', error)
    return NextResponse.json({ error: 'Error fetching espacio' }, { status: 500 })
  }
}

// PUT - Update espacio comun
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const espacio = await db.espacioComun.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        capacidad: data.capacidad,
        ubicacion: data.ubicacion,
        descripcion: data.descripcion,
        precioHora: data.precioHora,
        precioDia: data.precioDia,
        requierePago: data.requierePago,
        activo: data.activo,
        notas: data.notas,
      }
    })
    
    return NextResponse.json(espacio)
  } catch (error) {
    console.error('Error updating espacio:', error)
    return NextResponse.json({ error: 'Error updating espacio' }, { status: 500 })
  }
}

// DELETE - Delete espacio comun
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if has reservations
    const reservasCount = await db.reserva.count({
      where: { espacioId: id }
    })
    
    if (reservasCount > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar, tiene reservas asociadas' 
      }, { status: 400 })
    }
    
    await db.espacioComun.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting espacio:', error)
    return NextResponse.json({ error: 'Error deleting espacio' }, { status: 500 })
  }
}
