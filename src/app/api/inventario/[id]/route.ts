import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get inventario item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventario.findUnique({
      where: { id }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching inventario item:', error)
    return NextResponse.json({ error: 'Error fetching inventario item' }, { status: 500 })
  }
}

// PUT - Update inventario item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Calculate estado based on stock levels
    let estado = data.estado || 'Disponible'
    const cantidadActual = parseInt(data.cantidadActual) || 0
    const stockMinimo = parseInt(data.stockMinimo) || 0

    if (cantidadActual === 0) {
      estado = 'Agotado'
    } else if (cantidadActual <= stockMinimo) {
      estado = 'Bajo'
    }

    const item = await db.inventario.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        categoria: data.categoria,
        unidad: data.unidad,
        cantidadActual,
        stockMinimo,
        stockMaximo: parseInt(data.stockMaximo) || 0,
        precioUnit: parseFloat(data.precioUnit) || 0,
        ubicacion: data.ubicacion || null,
        proveedor: data.proveedor || null,
        fechaUltimaCompra: data.fechaUltimaCompra || null,
        estado,
        notas: data.notas || null
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventario item:', error)
    return NextResponse.json({ error: 'Error updating inventario item' }, { status: 500 })
  }
}

// DELETE - Delete inventario item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.inventario.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventario item:', error)
    return NextResponse.json({ error: 'Error deleting inventario item' }, { status: 500 })
  }
}
