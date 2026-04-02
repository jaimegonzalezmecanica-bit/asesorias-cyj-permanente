import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get movement by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movimiento = await db.movimientoInventario.findUnique({
      where: { id }
    })
    
    if (!movimiento) {
      return NextResponse.json({ error: 'Movimiento not found' }, { status: 404 })
    }
    
    return NextResponse.json(movimiento)
  } catch (error) {
    console.error('Error fetching movimiento:', error)
    return NextResponse.json({ error: 'Error fetching movimiento' }, { status: 500 })
  }
}

// DELETE - Delete movement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.movimientoInventario.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movimiento:', error)
    return NextResponse.json({ error: 'Error deleting movimiento' }, { status: 500 })
  }
}
