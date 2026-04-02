import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo') || 'residentes'
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const categoria = searchParams.get('categoria')
    const prioridad = searchParams.get('prioridad')
    const contrato = searchParams.get('contrato')
    const espacio = searchParams.get('espacio')
    const frecuencia = searchParams.get('frecuencia')
    const tipoGasto = searchParams.get('tipoGasto')

    let datos: any[] = []
    const where: any = {}

    // Filtros de fecha base
    if (fechaDesde || fechaHasta) {
      const dateFilter: any = {}
      if (fechaDesde) dateFilter.gte = new Date(fechaDesde)
      if (fechaHasta) dateFilter.lte = new Date(fechaHasta)
      
      // Mapear el campo de fecha según el módulo
      const dateField = ['rondas', 'asistencia'].includes(modulo) ? 'fechaHora' : 
                        ['ot', 'proyectos', 'auditoria'].includes(modulo) ? 'fechaInicio' : 
                        ['gastoscomunes'].includes(modulo) ? 'fechaEmision' : 'createdAt'
      
      where[dateField] = dateFilter
    }

    if (estado && estado !== 'all') where.estado = estado

    switch (modulo) {
      case 'residentes':
        datos = await db.residente.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'personal':
        if (contrato) where.contrato = contrato
        datos = await db.personal.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'ot':
        if (tipo) where.tipo = tipo
        if (prioridad) where.prioridad = prioridad
        datos = await db.ordenTrabajo.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'proyectos':
        if (categoria) where.categoria = categoria
        datos = await db.proyecto.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'gastos':
        if (categoria) where.categoria = categoria
        datos = await db.gasto.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'activos':
        if (categoria) where.categoria = categoria
        datos = await db.activo.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'vehiculos':
        datos = await db.vehiculo.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'reservas':
        if (espacio) where.espacio = espacio
        datos = await db.reserva.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      case 'asistencia':
        datos = await db.asistencia.findMany({ where, include: { personal: true }, orderBy: { createdAt: 'desc' } })
        break
      case 'rondas':
        datos = await db.registroRonda.findMany({ where, include: { punto: true }, orderBy: { fechaHora: 'desc' } })
        break
      case 'centrocostos':
        if (tipoGasto) where.tipoGasto = tipoGasto
        datos = await db.centroCostoMaster.findMany({ where, orderBy: { createdAt: 'desc' } })
        break
      default:
        datos = []
    }

    return NextResponse.json(datos)
  } catch (error) {
    console.error('Error en reportes:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
