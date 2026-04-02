import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ots = await db.ordenTrabajo.findMany({
      where: { estadoAprob: 'Pendiente' },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(ots)
  } catch (error) {
    console.error('Error fetching aprobaciones:', error)
    return NextResponse.json({ error: 'Error al obtener aprobaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { otId, accion, observaciones, aprobadoPor, nombreAprobador } = data

    const ot = await db.ordenTrabajo.update({
      where: { id: otId },
      data: {
        estadoAprob: accion === 'Aprobar' ? 'Aprobada' : 'Rechazada',
        estado: accion === 'Aprobar' ? 'Abierta' : 'Cancelada'
      }
    })

    // Opcional: Registrar en historial si el modelo existe
    try {
      await db.historialAprobacionOT.create({
        data: {
          otId,
          estadoAnterior: 'Pendiente',
          estadoNuevo: accion === 'Aprobar' ? 'Aprobada' : 'Rechazada',
          observaciones,
          aprobadoPor,
          nombreAprobador,
          fechaAccion: new Date().toISOString(),
        }
      })
    } catch (e) {
      console.warn('HistorialAprobacionOT no disponible')
    }
    
    return NextResponse.json(ot)
  } catch (error) {
    console.error('Error procesando aprobación:', error)
    return NextResponse.json({ error: 'Error al procesar aprobación' }, { status: 500 })
  }
}
