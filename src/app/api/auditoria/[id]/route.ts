import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener auditoría por ID con todos los detalles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const auditoria = await db.auditoria.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { orden: 'asc' }
        },
        hallazgos: {
          orderBy: { createdAt: 'desc' }
        },
        acciones: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!auditoria) {
      return NextResponse.json(
        { error: 'Auditoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(auditoria)
  } catch (error) {
    console.error('Error fetching auditoria:', error)
    return NextResponse.json(
      { error: 'Error al obtener la auditoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar auditoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Si se está completando, calcular puntuación
    if (data.estado === 'Completada') {
      const items = await db.auditoriaItem.findMany({
        where: { auditoriaId: id }
      })
      
      const conformes = items.filter(i => i.calificacion === 'Conforme').length
      const total = items.filter(i => i.calificacion !== 'N/A' && i.calificacion !== 'Pendiente').length
      const puntuacionTotal = total > 0 ? Math.round((conformes / total) * 100) : 0
      
      const criticos = items.filter(i => i.criticidad === 'Crítica' && i.calificacion === 'No Conforme').length
      const mayores = items.filter(i => i.criticidad === 'Mayor' && i.calificacion === 'No Conforme').length
      const menores = items.filter(i => i.criticidad === 'Menor' && i.calificacion === 'No Conforme').length
      
      const auditoria = await db.auditoria.update({
        where: { id },
        data: {
          ...data,
          puntuacionTotal,
          itemsCriticos: criticos,
          itemsMayores: mayores,
          itemsMenores: menores,
          fechaFin: data.fechaFin || new Date().toISOString().split('T')[0]
        }
      })
      
      return NextResponse.json(auditoria)
    }
    
    const auditoria = await db.auditoria.update({
      where: { id },
      data
    })

    return NextResponse.json(auditoria)
  } catch (error) {
    console.error('Error updating auditoria:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la auditoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar auditoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Eliminar en cascada
    await db.auditoriaAccion.deleteMany({
      where: { auditoriaId: id }
    })
    
    await db.auditoriaHallazgo.deleteMany({
      where: { auditoriaId: id }
    })
    
    await db.auditoriaItem.deleteMany({
      where: { auditoriaId: id }
    })
    
    await db.auditoria.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting auditoria:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la auditoría' },
      { status: 500 }
    )
  }
}
