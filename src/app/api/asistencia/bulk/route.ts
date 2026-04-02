import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const asistencias = data.asistencias || data.attendance || data.data || []
    
    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json({ 
        error: 'No hay datos para procesar',
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ['El archivo no contiene datos válidos']
      }, { status: 400 })
    }
    
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []
    
    for (const row of asistencias) {
      try {
        const rut = row.Rut || row.rut || row.RUT || row.ID || '';
        const nombrePersonal = row.NombrePersonal || row.nombrePersonal || row['Nombre'] || row.Nombre || row.Employee || row.Name || '';
        const fecha = row.Fecha || row.fecha || row.Date || new Date().toISOString().split('T')[0];
        const horaEntrada = row.HoraEntrada || row.horaEntrada || row['Hora Entrada'] || row.Entry || row.CheckIn || null;
        const horaSalida = row.HoraSalida || row.horaSalida || row['Hora Salida'] || row.Exit || row.CheckOut || null;
        const estado = row.Estado || row.estado || row.Status || 'Presente';
        const observaciones = row.Observaciones || row.observaciones || row.Notes || null;
        
        if (!rut && !nombrePersonal) {
          skipped++
          continue
        }
        
        let personal = null
        if (rut) {
          personal = await db.personal.findUnique({ where: { rut } })
        }
        if (!personal && nombrePersonal) {
          personal = await db.personal.findFirst({ where: { nombre: { contains: nombrePersonal } } })
        }

        if (!personal) {
          skipped++
          errors.push(`Personal no encontrado: ${rut || nombrePersonal}`)
          continue
        }
        
        const existing = await db.asistencia.findUnique({
          where: {
            personalId_fecha: {
              personalId: personal.id,
              fecha
            }
          }
        })
        
        if (existing) {
          await db.asistencia.update({
            where: { id: existing.id },
            data: { horaEntrada, horaSalida, estado, observaciones }
          })
          updated++
        } else {
          await db.asistencia.create({
            data: { personalId: personal.id, fecha, horaEntrada, horaSalida, estado, observaciones }
          })
          created++
        }
      } catch (error) {
        console.error('Error processing row:', error)
        errors.push(`Error en fila: ${JSON.stringify(row).substring(0, 100)}`)
        skipped++
      }
    }
    
    return NextResponse.json({ total: asistencias.length, created, updated, skipped, errors })
  } catch (error) {
    console.error('Error bulk uploading asistencias:', error)
    return NextResponse.json({ error: 'Error al procesar carga masiva', total: 0, created: 0, updated: 0, skipped: 0, errors: [String(error)] }, { status: 500 })
  }
}
