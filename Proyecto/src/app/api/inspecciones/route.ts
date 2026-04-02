import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all inspecciones
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { estado: { contains: search } },
        { tipo: { contains: search } },
        { ubicacion: { contains: search } },
        { asignado: { contains: search } },
      ]
    }
    
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    
    const inspecciones = await db.inspeccion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(inspecciones)
  } catch (error) {
    console.error('Error fetching inspecciones:', error)
    return NextResponse.json({ error: 'Error fetching inspecciones' }, { status: 500 })
  }
}

// POST - Create new inspeccion
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const inspeccion = await db.inspeccion.create({
      data: {
        titulo: data.titulo,
        tipo: data.tipo || 'SST',
        estado: data.estado || 'Planificado',
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        hora: data.hora || null,
        ubicacion: data.ubicacion || null,
        asignado: data.asignado || null,
        descripcion: data.descripcion || null,
        recurrente: data.recurrente || false,
        notas: data.notas || null,
        observaciones: data.observaciones || null,
        recomendaciones: data.recomendaciones || null,
        firmaInspector: data.firmaInspector || null,
        firmaSupervisor: data.firmaSupervisor || null,
        nombreInspector: data.nombreInspector || null,
        nombreSupervisor: data.nombreSupervisor || null,
        fotosAntes: data.fotosAntes || null,
        fotosDurante: data.fotosDurante || null,
        fotosDespues: data.fotosDespues || null,
      }
    })
    
    return NextResponse.json(inspeccion)
  } catch (error) {
    console.error('Error creating inspeccion:', error)
    return NextResponse.json({ error: 'Error creating inspeccion' }, { status: 500 })
  }
}
