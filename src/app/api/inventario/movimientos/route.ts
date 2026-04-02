import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'

// API de movimientos de inventario
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    return NextResponse.json({
      movimientos: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  } catch (error) {
    console.error('Error fetching movimientos:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    return NextResponse.json({ 
      error: 'Funcionalidad no disponible. El modelo MovimientoInventario no está definido en el schema.' 
    }, { status: 501 })
  } catch (error) {
    console.error('Error creating movimiento:', error)
    return NextResponse.json({ error: 'Error al crear movimiento' }, { status: 500 })
  }
}
