import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Dashboard stats
export async function GET() {
  try {
    const [
      propiedades,
      residentes,
      ordenes,
      personal,
      activos,
      gastos,
      caja,
      centros,
    ] = await Promise.all([
      db.propiedad.findMany(),
      db.residente.findMany(),
      db.ordenTrabajo.findMany({
        include: { propiedad: true, asignado: true, centroCosto: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      db.personal.findMany(),
      db.activo.findMany(),
      db.gasto.findMany({ include: { centroCosto: true } }),
      db.cajaChica.findFirst(),
      db.centroCostoMaster.findMany(),
    ])
    
    // Calculate stats
    const stats = {
      totalPropiedades: propiedades.length,
      totalResidentes: residentes.length,
      otPendientes: ordenes.filter(o => o.estado === 'Pendiente').length,
      otEnProgreso: ordenes.filter(o => o.estado === 'En Progreso').length,
      otCompletadas: ordenes.filter(o => o.estado === 'Completado').length,
      morosos: residentes.filter(r => r.estado === 'Moroso').length,
      totalPersonal: personal.length,
      totalActivos: activos.length,
      valorActivos: activos.reduce((sum, a) => sum + (a.valorActual || 0), 0),
      saldoCaja: caja?.saldo || 0,
      saldoInicialCaja: caja?.saldoInicial || 0,
      totalGastado: gastos.reduce((sum, g) => sum + (g.monto || 0), 0),
      gastosDelMes: gastos
        .filter(g => g.fecha && g.fecha.startsWith(new Date().toISOString().slice(0, 7)))
        .reduce((sum, g) => sum + (g.monto || 0), 0),
    }
    
    // Estado de propiedades
    const estadoPropiedades = {
      Ocupado: propiedades.filter(p => p.estado === 'Ocupado').length,
      Disponible: propiedades.filter(p => p.estado === 'Disponible').length,
      Arriendo: propiedades.filter(p => p.estado === 'Arriendo').length,
      Venta: propiedades.filter(p => p.estado === 'Venta').length,
      Mantenimiento: propiedades.filter(p => p.estado === 'Mantenimiento').length,
    }
    
    // Centro de costo con gasto
    const centrosConGasto = centros.map(cc => {
      const gastado = gastos
        .filter(g => g.centroCostoId === cc.id || g.centroCosto?.id === cc.id)
        .reduce((sum, g) => sum + (g.monto || 0), 0)
      return {
        ...cc,
        gastado,
        disponible: (cc.presupuestoMens || 0) - gastado,
        porcentaje: (cc.presupuestoMens || 0) > 0 ? Math.round((gastado / cc.presupuestoMens) * 100) : 0
      }
    })
    
    return NextResponse.json({
      stats,
      estadoPropiedades,
      recentOT: ordenes,
      centrosConGasto,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Error fetching dashboard' }, { status: 500 })
  }
}
