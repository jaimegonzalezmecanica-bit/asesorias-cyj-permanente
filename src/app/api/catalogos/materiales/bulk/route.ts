import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Bulk create materials
export async function POST(request: Request) {
  try {
    const materiales = await request.json()
    
    if (!Array.isArray(materiales) || materiales.length === 0) {
      return NextResponse.json({ error: 'No hay materiales para importar' }, { status: 400 })
    }

    const created = []
    const errors = []

    for (let i = 0; i < materiales.length; i++) {
      const mat = materiales[i]
      try {
        const material = await db.catMaterial.create({
          data: {
            codigo: mat.codigo || null,
            nombre: mat.nombre,
            categoria: mat.categoria || 'General',
            unidad: mat.unidad || 'unidad',
            precioUnit: parseFloat(mat.precioUnit) || 0,
            stockActual: parseInt(mat.stockActual) || 0,
            stockMinimo: parseInt(mat.stockMin) || 0,
          }
        })
        created.push(material)
      } catch (error) {
        errors.push(`Fila ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    return NextResponse.json({
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
      materiales: created
    })
  } catch (error) {
    console.error('Error bulk creating materials:', error)
    return NextResponse.json({ 
      error: 'Error al importar materiales',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
