import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all espacios comunes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo')
    const activoParam = searchParams.get('activo')
    
    const espacios = await db.espacioComun.findMany({
      where: {
        AND: [
          tipo ? { tipo } : {},
          activoParam !== null ? { activo: activoParam === 'true' } : {},
        ]
      },
      include: {
        _count: {
          select: { reservas: true }
        }
      },
      orderBy: { codigo: 'asc' }
    })
    
    return NextResponse.json(espacios)
  } catch (error) {
    console.error('Error fetching espacios comunes:', error)
    return NextResponse.json({ error: 'Error fetching espacios comunes' }, { status: 500 })
  }
}

// POST - Create new espacio comun
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generate code
    const count = await db.espacioComun.count()
    const codigo = `ESP-${String(count + 1).padStart(3, '0')}`
    
    const espacio = await db.espacioComun.create({
      data: {
        codigo,
        nombre: data.nombre,
        tipo: data.tipo || 'Quincho',
        capacidad: data.capacidad || 0,
        ubicacion: data.ubicacion || '',
        descripcion: data.descripcion || '',
        precioHora: data.precioHora || 0,
        precioDia: data.precioDia || 0,
        requierePago: data.requierePago || false,
        notas: data.notas || '',
      }
    })
    
    return NextResponse.json(espacio)
  } catch (error) {
    console.error('Error creating espacio comun:', error)
    return NextResponse.json({ error: 'Error creating espacio comun' }, { status: 500 })
  }
}
