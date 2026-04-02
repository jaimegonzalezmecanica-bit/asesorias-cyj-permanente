import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - Listar puntos de ronda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const condominioId = searchParams.get('condominioId')

    const where: any = {}
    if (condominioId) {
      where.condominioId = condominioId
    }

    const puntos = await db.puntoRonda.findMany({
      where,
      include: {
        _count: {
          select: { registros: true }
        }
      },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(puntos)
  } catch (error) {
    console.error('Error fetching puntos de ronda:', error)
    return NextResponse.json(
      { error: 'Error al obtener puntos de ronda' },
      { status: 500 }
    )
  }
}

// POST - Crear punto de ronda
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generar código QR único
    const codigoQr = `RND-${nanoid(12).toUpperCase()}`
    
    // Obtener el siguiente orden
    const ultimoPunto = await db.puntoRonda.findFirst({
      orderBy: { orden: 'desc' },
      select: { orden: true }
    })
    
    const nuevoOrden = (ultimoPunto?.orden || 0) + 1

    const punto = await db.puntoRonda.create({
      data: {
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        descripcion: data.descripcion || null,
        codigoQr,
        activo: true,
        orden: nuevoOrden,
        condominioId: data.condominioId || null,
      }
    })

    return NextResponse.json(punto, { status: 201 })
  } catch (error) {
    console.error('Error creating punto de ronda:', error)
    return NextResponse.json(
      { error: 'Error al crear punto de ronda' },
      { status: 500 }
    )
  }
}
