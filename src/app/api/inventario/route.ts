import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all inventario items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoria = searchParams.get('categoria') || ''
    const estado = searchParams.get('estado') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
        { ubicacion: { contains: search } },
        { proveedor: { contains: search } }
      ]
    }

    if (categoria) {
      where.categoria = categoria
    }

    if (estado) {
      where.estado = estado
    }

    const items = await db.inventario.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventario:', error)
    return NextResponse.json({ error: 'Error fetching inventario' }, { status: 500 })
  }
}

// POST - Create new inventario item
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Generate unique codigo if not provided
    let codigo = data.codigo
    if (!codigo) {
      const count = await db.inventario.count()
      codigo = `INV-${String(count + 1).padStart(5, '0')}`
    }

    // Calculate estado based on stock levels
    let estado = data.estado || 'Disponible'
    const cantidadActual = parseInt(data.cantidadActual) || 0
    const stockMinimo = parseInt(data.stockMinimo) || 0

    if (cantidadActual === 0) {
      estado = 'Agotado'
    } else if (cantidadActual <= stockMinimo) {
      estado = 'Bajo'
    }

    const item = await db.inventario.create({
      data: {
        codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        categoria: data.categoria || 'General',
        unidad: data.unidad || 'unidad',
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
    console.error('Error creating inventario item:', error)
    return NextResponse.json({ error: 'Error creating inventario item' }, { status: 500 })
  }
}
