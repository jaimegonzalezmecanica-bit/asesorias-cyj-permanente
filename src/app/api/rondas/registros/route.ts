import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar registros de rondas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const puntoId = searchParams.get('puntoId')
    const fecha = searchParams.get('fecha')
    const limite = parseInt(searchParams.get('limite') || '100')

    const where: any = {}
    
    if (puntoId) {
      where.puntoId = puntoId
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      
      where.fechaHora = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    const registros = await db.registroRonda.findMany({
      where,
      include: {
        punto: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
          }
        }
      },
      orderBy: { fechaHora: 'desc' },
      take: limite,
    })

    return NextResponse.json(registros)
  } catch (error) {
    console.error('Error fetching registros de rondas:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros de rondas' },
      { status: 500 }
    )
  }
}
