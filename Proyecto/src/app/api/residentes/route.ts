import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all residentes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    
    const residentes = await db.residente.findMany({
      where: search ? {
        OR: [
          { nombre: { contains: search } },
          { rut: { contains: search } },
          { unidad: { contains: search } },
          { estado: { contains: search } },
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(residentes)
  } catch (error) {
    console.error('Error fetching residentes:', error)
    return NextResponse.json({ error: 'Error fetching residentes' }, { status: 500 })
  }
}

// POST - Create new residente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const residente = await db.residente.create({
      data: {
        nombre: data.nombre,
        rut: data.rut || '',
        unidad: data.unidad || '',
        tipo: data.tipo || 'Residente',
        telefono: data.telefono || '',
        email: data.email || '',
        fechaIngreso: data.fechaIngreso || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Activo',
        notas: data.notas || '',
        propiedadId: data.propiedadId || null,
      }
    })
    
    return NextResponse.json(residente)
  } catch (error) {
    console.error('Error creating residente:', error)
    return NextResponse.json({ error: 'Error creating residente' }, { status: 500 })
  }
}
