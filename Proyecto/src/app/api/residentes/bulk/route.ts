import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Bulk upload residents from Excel data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const residents = data.residents // Array of resident objects from Excel
    
    if (!Array.isArray(residents) || residents.length === 0) {
      return NextResponse.json({ error: 'No residents data provided' }, { status: 400 })
    }
    
    const results = {
      total: residents.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const row of residents) {
      try {
        // Map Excel columns to database fields
        // Excel columns: Nombre, Apellidos, RUT, Casa_Depto, Etapa, Telefono, Tipo_Residente, Vehículos
        const nombre = [row.Nombre, row.Apellidos].filter(Boolean).join(' ').trim()
        const rut = row.RUT?.toString().trim() || null
        const unidad = row.Casa_Depto?.toString().trim() || row.Etapa?.toString().trim() || null
        const telefono = row.Telefono?.toString().trim() || null
        const tipo = mapTipoResidente(row.Tipo_Residente)
        const vehiculos = row.Vehículos ? JSON.stringify([{ descripcion: row.Vehículos }]) : null
        
        if (!nombre) {
          results.skipped++
          continue
        }
        
        // Check if resident exists by RUT or by name + unidad
        let existingResidente: { id: string; rut: string | null; unidad: string | null; telefono: string | null; vehiculos: string | null } | null = null
        
        if (rut) {
          existingResidente = await db.residente.findFirst({
            where: { rut },
            select: { id: true, rut: true, unidad: true, telefono: true, vehiculos: true }
          })
        }
        if (!existingResidente && nombre && unidad) {
          existingResidente = await db.residente.findFirst({
            where: {
              nombre: { equals: nombre },
              unidad: { equals: unidad }
            },
            select: { id: true, rut: true, unidad: true, telefono: true, vehiculos: true }
          })
        }
        
        if (existingResidente) {
          // Update existing resident
          await db.residente.update({
            where: { id: existingResidente.id },
            data: {
              nombre,
              rut: rut || existingResidente.rut,
              unidad: unidad || existingResidente.unidad,
              tipo,
              telefono: telefono || existingResidente.telefono,
              vehiculos: vehiculos || existingResidente.vehiculos,
            }
          })
          results.updated++
        } else {
          // Create new resident
          await db.residente.create({
            data: {
              nombre,
              rut,
              unidad,
              tipo,
              telefono,
              vehiculos,
              estado: 'Activo',
              fechaIngreso: new Date().toISOString().split('T')[0],
            }
          })
          results.created++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Row error: ${errorMessage}`)
        results.skipped++
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error bulk uploading residents:', error)
    return NextResponse.json({ error: 'Error processing bulk upload' }, { status: 500 })
  }
}

function mapTipoResidente(tipo: string | undefined): string {
  if (!tipo) return 'Residente'
  const tipoLower = tipo.toLowerCase().trim()
  if (tipoLower.includes('propietario')) return 'Propietario'
  if (tipoLower.includes('arrendatario')) return 'Arrendatario'
  if (tipoLower.includes('visita')) return 'Visita'
  return 'Residente'
}
