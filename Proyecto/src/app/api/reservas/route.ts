import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all reservas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const espacioId = searchParams.get('espacioId')
    const residenteId = searchParams.get('residenteId')
    const estado = searchParams.get('estado')
    const fecha = searchParams.get('fecha')
    const month = searchParams.get('month') // Format: YYYY-MM
    
    const where: any = {}
    
    if (espacioId) where.espacioId = espacioId
    if (residenteId) where.residenteId = residenteId
    if (estado) where.estado = estado
    if (fecha) where.fechaReserva = fecha
    if (month) {
      where.fechaReserva = { startsWith: month }
    }
    
    const reservas = await db.reserva.findMany({
      where,
      include: {
        espacio: true,
        residente: true,
      },
      orderBy: { fechaReserva: 'asc' }
    })
    
    return NextResponse.json(reservas)
  } catch (error) {
    console.error('Error fetching reservas:', error)
    return NextResponse.json({ error: 'Error fetching reservas' }, { status: 500 })
  }
}

// POST - Create new reserva
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generate code
    const count = await db.reserva.count()
    const codigo = `RES-${String(count + 1).padStart(6, '0')}`
    
    // Check for conflicts
    const existingReserva = await db.reserva.findFirst({
      where: {
        espacioId: data.espacioId,
        fechaReserva: data.fechaReserva,
        horario: data.horario,
        estado: { notIn: ['Cancelada'] }
      }
    })
    
    if (existingReserva) {
      return NextResponse.json({ 
        error: 'Ya existe una reserva para este espacio, fecha y horario' 
      }, { status: 400 })
    }
    
    // Verify resident status if residenteId provided
    let verificacionMorosidad = 'No Verificado'
    if (data.residenteId) {
      const residente = await db.residente.findUnique({
        where: { id: data.residenteId }
      })
      if (residente) {
        verificacionMorosidad = residente.estado === 'Moroso' ? 'Moroso' : 'Al Día'
      }
    }
    
    // Calculate monto
    const espacio = await db.espacioComun.findUnique({
      where: { id: data.espacioId }
    })
    
    let montoTotal = 0
    if (espacio) {
      if (data.horario === 'Mañana' || data.horario === 'Tarde') {
        montoTotal = espacio.precioHora * 4 // 4 hours per shift
      } else {
        montoTotal = espacio.precioDia
      }
    }
    
    const reserva = await db.reserva.create({
      data: {
        codigo,
        espacioId: data.espacioId,
        residenteId: data.residenteId || null,
        nombreResidente: data.nombreResidente,
        unidadResidente: data.unidadResidente || '',
        telefonoResidente: data.telefonoResidente || '',
        emailResidente: data.emailResidente || '',
        fechaReserva: data.fechaReserva,
        fechaSolicitud: new Date().toISOString().split('T')[0],
        horario: data.horario || 'Mañana',
        horaInicio: data.horaInicio || '',
        horaFin: data.horaFin || '',
        estado: data.estado || 'Pendiente',
        estadoPago: data.estadoPago || 'Pendiente',
        montoTotal: data.montoTotal || montoTotal,
        descuento: data.descuento || 0,
        montoFinal: (data.montoTotal || montoTotal) - (data.descuento || 0),
        numeroPersonas: data.numeroPersonas || 0,
        motivoEvento: data.motivoEvento || '',
        observaciones: data.observaciones || '',
        correoRespaldo: data.correoRespaldo || '',
        nombreCorreoRespaldo: data.nombreCorreoRespaldo || '',
        verificacionMorosidad,
      },
      include: {
        espacio: true,
        residente: true,
      }
    })
    
    return NextResponse.json(reserva)
  } catch (error) {
    console.error('Error creating reserva:', error)
    return NextResponse.json({ error: 'Error creating reserva' }, { status: 500 })
  }
}
