import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Bulk upload personal from Excel data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const personalList = data.personal // Array of personal objects from Excel
    
    if (!Array.isArray(personalList) || personalList.length === 0) {
      return NextResponse.json({ error: 'No personal data provided' }, { status: 400 })
    }
    
    const results = {
      total: personalList.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const row of personalList) {
      try {
        // Map Excel columns to database fields
        const nombre = row.Nombre?.toString().trim() || row.nombre?.toString().trim()
        const rut = row.RUT?.toString().trim() || row.rut?.toString().trim() || null
        const cargo = row.Cargo?.toString().trim() || row.cargo?.toString().trim() || null
        const telefono = row.Telefono?.toString().trim() || row.telefono?.toString().trim() || null
        const email = row.Email?.toString().trim() || row.email?.toString().trim() || null
        
        if (!nombre) {
          results.skipped++
          continue
        }
        
        // Check if personal exists by RUT or by name
        let existingPersonal: { 
          id: string
          rut: string | null
          cargo: string | null
          telefono: string | null
          email: string | null
        } | null = null
        
        if (rut) {
          existingPersonal = await db.personal.findFirst({
            where: { rut },
            select: { id: true, rut: true, cargo: true, telefono: true, email: true }
          })
        }
        if (!existingPersonal && nombre) {
          existingPersonal = await db.personal.findFirst({
            where: { nombre: { equals: nombre } },
            select: { id: true, rut: true, cargo: true, telefono: true, email: true }
          })
        }
        
        if (existingPersonal) {
          // Update existing personal
          await db.personal.update({
            where: { id: existingPersonal.id },
            data: {
              nombre,
              rut: rut || existingPersonal.rut,
              cargo: cargo || existingPersonal.cargo,
              telefono: telefono || existingPersonal.telefono,
              email: email || existingPersonal.email,
            }
          })
          results.updated++
        } else {
          // Create new personal
          await db.personal.create({
            data: {
              nombre,
              rut,
              cargo,
              telefono,
              email,
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
    console.error('Error bulk uploading personal:', error)
    return NextResponse.json({ error: 'Error processing bulk upload' }, { status: 500 })
  }
}
