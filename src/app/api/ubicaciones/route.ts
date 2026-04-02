import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all ubicaciones
export async function GET() {
  try {
    const ubicaciones = await db.ubicacion.findMany({
      where: { activo: true },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }]
    })
    return NextResponse.json(ubicaciones)
  } catch (error) {
    console.error('Error fetching ubicaciones:', error)
    return NextResponse.json({ error: 'Error fetching ubicaciones' }, { status: 500 })
  }
}

// POST - Create new ubicacion
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verificar si ya existe una ubicación con el mismo nombre
    const existente = await db.ubicacion.findFirst({
      where: { 
        nombre: { equals: data.nombre },
        activo: true
      }
    })
    
    if (existente) {
      return NextResponse.json({ error: 'Ya existe una ubicación con ese nombre', ubicacion: existente }, { status: 400 })
    }
    
    // Get next codigo
    const lastUbicacion = await db.ubicacion.findFirst({
      orderBy: { codigo: 'desc' }
    })
    
    let nextCodigo = 'UB-001'
    if (lastUbicacion && lastUbicacion.codigo) {
      const lastNum = parseInt(lastUbicacion.codigo.replace('UB-', ''))
      nextCodigo = `UB-${String(lastNum + 1).padStart(3, '0')}`
    }
    
    const ubicacion = await db.ubicacion.create({
      data: {
        codigo: nextCodigo,
        nombre: data.nombre,
        categoria: data.categoria || 'General',
        descripcion: data.descripcion || null,
      }
    })
    
    return NextResponse.json(ubicacion)
  } catch (error) {
    console.error('Error creating ubicacion:', error)
    return NextResponse.json({ error: 'Error creating ubicacion' }, { status: 500 })
  }
}
