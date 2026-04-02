import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Actualizar item de auditoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const data = await request.json()
    
    const item = await db.auditoriaItem.update({
      where: { 
        id: itemId,
        auditoriaId: id 
      },
      data: {
        cumple: data.cumple,
        evidencia: data.evidencia,
        observaciones: data.observaciones,
        calificacion: data.calificacion,
        criticidad: data.criticidad,
      }
    })

    // Recalcular puntuación de la auditoría
    const allItems = await db.auditoriaItem.findMany({
      where: { auditoriaId: id }
    })
    
    const conformes = allItems.filter(i => i.calificacion === 'Conforme').length
    const total = allItems.filter(i => i.calificacion !== 'N/A' && i.calificacion !== 'Pendiente').length
    const puntuacionTotal = total > 0 ? Math.round((conformes / total) * 100) : 0
    
    const criticos = allItems.filter(i => i.criticidad === 'Crítica' && i.calificacion === 'No Conforme').length
    const mayores = allItems.filter(i => i.criticidad === 'Mayor' && i.calificacion === 'No Conforme').length
    const menores = allItems.filter(i => i.criticidad === 'Menor' && i.calificacion === 'No Conforme').length
    
    await db.auditoria.update({
      where: { id },
      data: {
        puntuacionTotal,
        itemsCriticos: criticos,
        itemsMayores: mayores,
        itemsMenores: menores
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el item' },
      { status: 500 }
    )
  }
}
