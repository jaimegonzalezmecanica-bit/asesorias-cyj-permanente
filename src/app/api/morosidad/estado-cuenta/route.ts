import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// GET - Listar estados de cuenta
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const residenteId = searchParams.get('residenteId')
    const periodo = searchParams.get('periodo')

    const where: Record<string, unknown> = {}
    if (residenteId) where.residenteId = residenteId
    if (periodo) where.periodo = periodo

    const estadosCuenta = await db.estadoCuenta.findMany({
      where,
      include: {
        residente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            unidad: true,
            etapa: true,
            telefono: true,
            email: true
          }
        },
        detalles: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { fechaGeneracion: 'desc' }
    })

    return NextResponse.json({ estadosCuenta })
  } catch (error) {
    console.error('Error fetching estados cuenta:', error)
    return NextResponse.json({ error: 'Error al obtener estados de cuenta' }, { status: 500 })
  }
}

// ============================================
// POST - Generar estados de cuenta
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { periodo, residenteId } = body

    // Si se especifica un residente, generar solo para ese
    const residentes = residenteId 
      ? await db.residente.findMany({ where: { id: residenteId } })
      : await db.residente.findMany()

    const estadosCuentaCreados = []

    for (const residente of residentes) {
      // Buscar estado de cuenta existente para el período
      const existente = await db.estadoCuenta.findUnique({
        where: {
          residenteId_periodo: {
            residenteId: residente.id,
            periodo: periodo
          }
        }
      })

      if (existente) continue // Ya existe para este período

      // Obtener deudas del residente
      const deudas = await db.deuda.findMany({
        where: {
          residenteId: residente.id,
          estado: { in: ['Pendiente', 'Parcial'] }
        }
      })

      // Obtener pagos del mes
      const pagos = await db.pagoGastoComun.findMany({
        where: {
          residenteId: residente.id,
          gastoComun: { periodo }
        },
        include: { gastoComun: true }
      })

      // Calcular saldos
      const saldoAnterior = deudas
        .filter(d => d.periodo !== periodo)
        .reduce((sum, d) => sum + d.montoTotal, 0)

      const cargosMes = deudas
        .filter(d => d.periodo === periodo)
        .reduce((sum, d) => sum + d.montoOriginal, 0)

      const pagosMes = pagos.reduce((sum, p) => sum + p.monto, 0)

      const interesesMora = deudas
        .filter(d => d.periodo === periodo)
        .reduce((sum, d) => sum + d.montoInteres, 0)

      const totalPagar = saldoAnterior + cargosMes - pagosMes + interesesMora

      // Fecha de vencimiento (día 10 del siguiente mes)
      const [year, month] = periodo.split('-').map(Number)
      const fechaVencimiento = new Date(year, month, 10).toISOString().split('T')[0]

      // Crear estado de cuenta
      const estadoCuenta = await db.estadoCuenta.create({
        data: {
          periodo,
          fechaGeneracion: new Date().toISOString().split('T')[0],
          saldoAnterior,
          cargosMes,
          pagosMes,
          saldoActual: totalPagar,
          interesesMora,
          totalPagar,
          fechaVencimiento,
          estado: 'Generado',
          residenteId: residente.id,
          detalles: {
            create: [
              {
                tipo: 'SaldoAnterior',
                concepto: 'Saldo anterior',
                monto: saldoAnterior
              },
              {
                tipo: 'Cargo',
                concepto: 'Gastos comunes ' + periodo,
                monto: cargosMes,
                fecha: new Date().toISOString().split('T')[0]
              },
              {
                tipo: 'Pago',
                concepto: 'Pagos del mes',
                monto: -pagosMes
              },
              {
                tipo: 'Interes',
                concepto: 'Intereses por mora',
                monto: interesesMora
              }
            ]
          }
        },
        include: {
          residente: true,
          detalles: true
        }
      })

      estadosCuentaCreados.push(estadoCuenta)
    }

    return NextResponse.json({ 
      message: `Se generaron ${estadosCuentaCreados.length} estados de cuenta`,
      estadosCuenta: estadosCuentaCreados 
    })
  } catch (error) {
    console.error('Error generating estados cuenta:', error)
    return NextResponse.json({ error: 'Error al generar estados de cuenta' }, { status: 500 })
  }
}
