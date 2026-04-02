import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener historial de un item de cumplimiento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const historial = await db.historialCumplimiento.findMany({
      where: { cumplimientoId: id },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json(historial)
  } catch (error) {
    console.error('Error fetching historial:', error)
    return NextResponse.json(
      { error: 'Error al obtener el historial' },
      { status: 500 }
    )
  }
}
