import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar hallazgos de una auditoría
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const hallazgos = await db.auditoriaHallazgo.findMany({
      where: { auditoriaId: id },
      include: {
        acciones: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(hallazgos)
  } catch (error) {
    console.error('Error fetching hallazgos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los hallazgos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo hallazgo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const hallazgo = await db.auditoriaHallazgo.create({
      data: {
        auditoriaId: id,
        codigo: data.codigo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo || 'Observación',
        criticidad: data.criticidad || 'Menor',
        area: data.area || null,
        proceso: data.proceso || null,
        causaRaiz: data.causaRaiz || null,
        impacto: data.impacto || null,
        estado: 'Abierto',
        fechaDeteccion: data.fechaDeteccion || new Date().toISOString().split('T')[0],
        fechaLimite: data.fechaLimite || null,
        evidencia: data.evidencia || null,
      }
    })

    return NextResponse.json(hallazgo)
  } catch (error) {
    console.error('Error creating hallazgo:', error)
    return NextResponse.json(
      { error: 'Error al crear el hallazgo' },
      { status: 500 }
    )
  }
}
