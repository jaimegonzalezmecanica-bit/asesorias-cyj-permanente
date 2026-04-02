import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const vehiculos = await db.vehiculo.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(vehiculos)
  } catch (error) {
    console.error('Error fetching vehiculos:', error)
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marca, modelo, anio, patente, permiso, seguro, revision, estado } = body

    if (!patente) {
      return NextResponse.json({ error: 'La patente es obligatoria' }, { status: 400 })
    }

    const vehiculo = await db.vehiculo.create({
      data: {
        marca,
        modelo,
        anio: parseInt(anio) || 0,
        patente,
        permiso,
        seguro,
        revision,
        estado: estado || 'Activo'
      }
    })

    return NextResponse.json(vehiculo)
  } catch (error) {
    console.error('Error creating vehiculo:', error)
    return NextResponse.json({ error: 'Error al crear vehículo' }, { status: 500 })
  }
}
