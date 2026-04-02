import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all proyectos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    
    const proyectos = await db.proyecto.findMany({
      where: search ? {
        OR: [
          { nombre: { contains: search } },
          { estado: { contains: search } },
        ]
      } : undefined,
      include: {
        materiales: true,
        herramientas: true,
        tareas: true,
        personal: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(proyectos)
  } catch (error) {
    console.error('Error fetching proyectos:', error)
    return NextResponse.json({ error: 'Error fetching proyectos' }, { status: 500 })
  }
}

// POST - Create new proyecto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const proyecto = await db.proyecto.create({
      data: {
        nombre: data.nombre,
        categoria: data.categoria || 'General',
        estado: data.estado || 'Planificado',
        ubicacion: data.ubicacion || '',
        fechaInicio: data.fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: data.fechaFin || '',
        presProg: parseFloat(data.presProg) || 0,
        presUsado: parseFloat(data.presUsado) || 0,
        avance: parseInt(data.avance) || 0,
        descripcion: data.descripcion || '',
        notas: data.notas || '',
      }
    })
    
    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error creating proyecto:', error)
    return NextResponse.json({ error: 'Error creating proyecto' }, { status: 500 })
  }
}
