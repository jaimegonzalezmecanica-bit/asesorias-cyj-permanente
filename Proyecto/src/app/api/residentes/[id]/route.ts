import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get residente by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const residente = await db.residente.findUnique({
      where: { id }
    })
    
    if (!residente) {
      return NextResponse.json({ error: 'Residente not found' }, { status: 404 })
    }
    
    return NextResponse.json(residente)
  } catch (error) {
    console.error('Error fetching residente:', error)
    return NextResponse.json({ error: 'Error fetching residente' }, { status: 500 })
  }
}

// PUT - Update residente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const residente = await db.residente.update({
      where: { id },
      data: {
        nombre: data.nombre,
        rut: data.rut,
        unidad: data.unidad,
        tipo: data.tipo,
        telefono: data.telefono,
        email: data.email,
        fechaIngreso: data.fechaIngreso,
        estado: data.estado,
        notas: data.notas,
        propiedadId: data.propiedadId || null,
      }
    })
    
    return NextResponse.json(residente)
  } catch (error) {
    console.error('Error updating residente:', error)
    return NextResponse.json({ error: 'Error updating residente' }, { status: 500 })
  }
}

// DELETE - Delete residente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.residente.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting residente:', error)
    return NextResponse.json({ error: 'Error deleting residente' }, { status: 500 })
  }
}
