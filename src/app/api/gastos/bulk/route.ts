import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Bulk upload gastos from Excel data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const gastosList = data.gastos // Array of gasto objects from Excel
    
    if (!Array.isArray(gastosList) || gastosList.length === 0) {
      return NextResponse.json({ error: 'No gastos data provided' }, { status: 400 })
    }
    
    const results = {
      total: gastosList.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    // Get current count for generating new codes
    const existingCount = await db.gasto.count()
    let nextCodeNumber = existingCount + 1
    
    for (let i = 0; i < gastosList.length; i++) {
      const row = gastosList[i]
      try {
        // Map Excel columns to database fields
        // Excel columns: Codigo, Descripcion, Categoria, Monto, Fecha, Proveedor, NDoc, CentroCosto, Estado
        const codigo = row.Codigo?.toString().trim() || row.codigo?.toString().trim() || null
        const descripcion = row.Descripcion?.toString().trim() || row.descripcion?.toString().trim()
        const categoria = row.Categoria?.toString().trim() || row.categoria?.toString().trim() || 'Mantenimiento'
        const monto = parseFloat(row.Monto?.toString() || row.monto?.toString() || '0') || 0
        const fecha = row.Fecha?.toString().trim() || row.fecha?.toString().trim() || new Date().toISOString().split('T')[0]
        const proveedorNombre = row.Proveedor?.toString().trim() || row.proveedor?.toString().trim() || null
        const nDoc = row.NDoc?.toString().trim() || row.nDoc?.toString().trim() || null
        const centroCostoNombre = row.CentroCosto?.toString().trim() || row.centroCosto?.toString().trim() || null
        const estado = row.Estado?.toString().trim() || row.estado?.toString().trim() || 'Pendiente'
        
        if (!descripcion) {
          results.skipped++
          continue
        }
        
        // Find proveedor by name
        let proveedorId: string | null = null
        if (proveedorNombre) {
          const proveedor = await db.proveedor.findFirst({
            where: { razonSocial: { equals: proveedorNombre } }
          })
          if (proveedor) {
            proveedorId = proveedor.id
          }
        }
        
        // Find centro de costo by name
        let centroCostoId: string | null = null
        if (centroCostoNombre) {
          const centro = await db.centroCostoMaster.findFirst({
            where: { nombre: { equals: centroCostoNombre } }
          })
          if (centro) {
            centroCostoId = centro.id
          }
        }
        
        // Check if gasto exists by codigo or nDoc
        let existingGasto: { id: string } | null = null
        if (codigo) {
          existingGasto = await db.gasto.findFirst({
            where: { codigo },
            select: { id: true }
          })
        }
        if (!existingGasto && nDoc) {
          existingGasto = await db.gasto.findFirst({
            where: { nDoc },
            select: { id: true }
          })
        }
        
        // Generate codigo if not provided
        const finalCodigo = codigo || `G-${String(nextCodeNumber++).padStart(3, '0')}`
        
        if (existingGasto && existingGasto.id) {
          // Update existing gasto
          await db.gasto.update({
            where: { id: existingGasto.id },
            data: {
              codigo: finalCodigo,
              descripcion,
              categoria,
              monto,
              fecha,
              proveedor: proveedorNombre,
              proveedorId,
              centroCosto: centroCostoNombre,
              centroCostoId,
              nDoc,
              estado,
            }
          })
          results.updated++
        } else {
          // Create new gasto
          await db.gasto.create({
            data: {
              codigo: finalCodigo,
              descripcion,
              categoria,
              monto,
              fecha,
              proveedor: proveedorNombre,
              proveedorId,
              centroCosto: centroCostoNombre,
              centroCostoId,
              nDoc,
              estado,
            }
          })
          results.created++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Fila ${i + 1}: ${errorMessage}`)
        results.skipped++
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error bulk uploading gastos:', error)
    return NextResponse.json({ error: 'Error processing bulk upload' }, { status: 500 })
  }
}
