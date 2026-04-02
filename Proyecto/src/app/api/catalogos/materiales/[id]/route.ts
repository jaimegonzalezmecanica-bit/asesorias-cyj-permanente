import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get material by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const material = await db.catMaterial.findUnique({
      where: { id }
    })
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Error fetching material' }, { status: 500 })
  }
}

// PUT - Update material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const material = await db.catMaterial.update({
      where: { id },
      data: {
        nombre: data.nombre,
        unidad: data.unidad,
        precioUnit: parseFloat(data.precioUnit) || 0,
        categoria: data.categoria,
      }
    })
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: 'Error updating material' }, { status: 500 })
  }
}

// DELETE - Delete material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.catMaterial.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Error deleting material' }, { status: 500 })
  }
}
