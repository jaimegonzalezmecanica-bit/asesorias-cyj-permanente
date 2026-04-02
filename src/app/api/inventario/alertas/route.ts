import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get items below minimum stock (alertas)
export async function GET() {
  try {
    // Get items where estado is Bajo or Agotado, or cantidadActual <= stockMinimo
    // Note: Prisma doesn't support comparing two columns directly in where clause,
    // so we use raw query for the comparison
    const items = await db.$queryRaw<Array<{
      id: string
      codigo: string
      nombre: string
      descripcion: string | null
      categoria: string
      unidad: string
      cantidadActual: number
      stockMinimo: number
      stockMaximo: number
      precioUnit: number
      ubicacion: string | null
      proveedor: string | null
      fechaUltimaCompra: string | null
      estado: string
      notas: string | null
      createdAt: Date
      updatedAt: Date
    }>>`
      SELECT * FROM Inventario
      WHERE estado IN ('Bajo', 'Agotado')
         OR (cantidadActual <= stockMinimo AND stockMinimo > 0)
      ORDER BY cantidadActual ASC
    `

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventario alertas:', error)
    return NextResponse.json({ error: 'Error fetching inventario alertas' }, { status: 500 })
  }
}
