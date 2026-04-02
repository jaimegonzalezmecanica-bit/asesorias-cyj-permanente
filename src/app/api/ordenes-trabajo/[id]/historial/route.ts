import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get historial for an OT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const historial = await db.oTHistorial.findMany({
      where: { otId: id },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(historial)
  } catch (error) {
    console.error('Error fetching historial:', error)
    return NextResponse.json({ error: 'Error fetching historial' }, { status: 500 })
  }
}

// POST - Add new historial entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Verify OT exists
    const ot = await db.ordenTrabajo.findUnique({
      where: { id }
    })
    
    if (!ot) {
      return NextResponse.json({ error: 'Orden de trabajo not found' }, { status: 404 })
    }
    
    const historial = await db.oTHistorial.create({
      data: {
        otId: id,
        userId: data.userId || null,
        accion: data.accion || 'modificado',
        campo: data.campo || null,
        valorAntes: data.valorAntes || null,
        valorDespues: data.valorDespues || null,
        celular: data.celular || null
      },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      }
    })
    
    return NextResponse.json(historial)
  } catch (error) {
    console.error('Error creating historial:', error)
    return NextResponse.json({ error: 'Error creating historial' }, { status: 500 })
  }
}
