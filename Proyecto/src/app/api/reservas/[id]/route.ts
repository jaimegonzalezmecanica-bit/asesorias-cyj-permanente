import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reserva = await db.reserva.findUnique({
      where: { id },
      include: {
        espacio: true,
        residente: true,
      }
    })
    
    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }
    
    return NextResponse.json(reserva)
  } catch (error) {
    console.error('Error fetching reserva:', error)
    return NextResponse.json({ error: 'Error fetching reserva' }, { status: 500 })
  }
}

// PUT - Update reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // If changing estado to Confirmada, check for conflicts
    if (data.estado === 'Confirmada') {
      const reserva = await db.reserva.findUnique({ where: { id } })
      if (reserva) {
        const conflict = await db.reserva.findFirst({
          where: {
            id: { not: id },
            espacioId: reserva.espacioId,
            fechaReserva: reserva.fechaReserva,
            horario: reserva.horario,
            estado: { notIn: ['Cancelada'] }
          }
        })
        if (conflict) {
          return NextResponse.json({ 
            error: 'Conflicto con otra reserva existente' 
          }, { status: 400 })
        }
      }
    }
    
    const updateData: any = {}
    
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.estadoPago !== undefined) updateData.estadoPago = data.estadoPago
    if (data.descuento !== undefined) {
      updateData.descuento = data.descuento
      // Recalculate montoFinal
      const reserva = await db.reserva.findUnique({ where: { id } })
      if (reserva) {
        updateData.montoFinal = reserva.montoTotal - data.descuento
      }
    }
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones
    if (data.numeroPersonas !== undefined) updateData.numeroPersonas = data.numeroPersonas
    if (data.motivoEvento !== undefined) updateData.motivoEvento = data.motivoEvento
    if (data.correoRespaldo !== undefined) updateData.correoRespaldo = data.correoRespaldo
    if (data.nombreCorreoRespaldo !== undefined) updateData.nombreCorreoRespaldo = data.nombreCorreoRespaldo
    if (data.horario !== undefined) updateData.horario = data.horario
    if (data.horaInicio !== undefined) updateData.horaInicio = data.horaInicio
    if (data.horaFin !== undefined) updateData.horaFin = data.horaFin
    if (data.fechaReserva !== undefined) updateData.fechaReserva = data.fechaReserva
    
    // Handle approval
    if (data.estado === 'Confirmada' && data.aprobadoPor) {
      updateData.aprobadoPor = data.aprobadoPor
      updateData.fechaAprobacion = new Date()
    }
    
    const reserva = await db.reserva.update({
      where: { id },
      data: updateData,
      include: {
        espacio: true,
        residente: true,
      }
    })
    
    return NextResponse.json(reserva)
  } catch (error) {
    console.error('Error updating reserva:', error)
    return NextResponse.json({ error: 'Error updating reserva' }, { status: 500 })
  }
}

// DELETE - Delete reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.reserva.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reserva:', error)
    return NextResponse.json({ error: 'Error deleting reserva' }, { status: 500 })
  }
}
