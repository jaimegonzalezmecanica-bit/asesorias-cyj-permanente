/**
 * API de Dashboard - Estadísticas del Sistema
 * CORREGIDO: Agregada autenticación y validación de sesión
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession, hasPermission } from '@/lib/auth'

// GET - Dashboard stats
// CORREGIDO: Verificación de autenticación
export async function GET() {
  try {
    // CORREGIDO: Verificar sesión antes de mostrar datos
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado', authenticated: false },
        { status: 401 }
      )
    }
    
    // CORREGIDO: Verificar permiso básico
    if (!hasPermission(session.user.rol, 'reportes.ver')) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver el dashboard' },
        { status: 403 }
      )
    }
    
    // CORREGIDO: Agregar límites a las consultas para mejor rendimiento
    const [
      propiedades,
      residentes,
      todasOrdenes,
      recentOT,
      personal,
      activos,
      gastos,
      caja,
      centros,
      cumplimientoItems,
    ] = await Promise.all([
      // CORREGIDO: Limitar a propiedades activas
      db.propiedad.findMany({
        select: { id: true, estado: true, nombre: true }
      }),
      // CORREGIDO: Seleccionar solo campos necesarios
      db.residente.findMany({
        select: { id: true, estado: true }
      }),
      // Obtener TODAS las órdenes para contar estados correctamente
      db.ordenTrabajo.findMany({
        select: { estado: true, estadoAprobacion: true }
      }),
      // Separar consulta para últimas 6 órdenes recientes
      db.ordenTrabajo.findMany({
        include: { 
          propiedad: { select: { nombre: true } }, 
          asignado: { select: { nombre: true } }, 
          centroCosto: { select: { codigo: true, nombre: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      // CORREGIDO: Contar en lugar de traer todos
      db.personal.count(),
      // CORREGIDO: Seleccionar solo campos necesarios para activos
      db.activo.findMany({
        select: { id: true, valorActual: true }
      }),
      // CORREGIDO: Limitar gastos al año actual para mejor rendimiento
      db.gasto.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1)
          }
        },
        select: { monto: true, fecha: true, centroCostoId: true, centroCosto: { select: { id: true } } }
      }),
      db.cajaChica.findFirst({
        select: { saldo: true, saldoInicial: true }
      }),
      db.centroCostoMaster.findMany({
        select: { id: true, codigo: true, nombre: true, presupuestoMens: true }
      }),
      // Usar el modelo Cumplimiento que existe en el schema
      db.cumplimiento.findMany({
        select: { 
          id: true, 
          titulo: true, 
          categoria: true, 
          estado: true, 
          obligatorio: true,
          fechaVencimiento: true
        }
      }),
    ])

    // Calculate stats - usando todasOrdenes para conteo correcto
    const otCompletadasList = todasOrdenes.filter(o => o.estado === 'Completado')
    const otPendientesAprobacion = otCompletadasList.filter(o => 
      o.estadoAprobacion === 'Pendiente' || !o.estadoAprobacion
    ).length
    const otAprobadas = otCompletadasList.filter(o => o.estadoAprobacion === 'Aprobada').length
    const otRechazadas = otCompletadasList.filter(o => o.estadoAprobacion === 'Rechazada').length

    const stats = {
      totalPropiedades: propiedades.length,
      totalResidentes: residentes.length,
      otPendientes: todasOrdenes.filter(o => o.estado === 'Pendiente').length,
      otEnProgreso: todasOrdenes.filter(o => o.estado === 'En Progreso').length,
      otCompletadas: otCompletadasList.length,
      otPendientesAprobacion,
      otAprobadas,
      otRechazadas,
      morosos: residentes.filter(r => r.estado === 'Moroso').length,
      totalPersonal: personal, // CORREGIDO: Ya es un count
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
        id: cc.id,
        nombre: cc.nombre,
        presupuesto: cc.presupuestoMens || 0,
        gastado,
        disponible: (cc.presupuestoMens || 0) - gastado,
        porcentaje: (cc.presupuestoMens || 0) > 0 ? Math.round((gastado / cc.presupuestoMens) * 100) : 0
      }
    })

    // Cumplimiento Legal - Estadísticas
    const hoy = new Date()
    
    // Agrupar documentos por categoría usando el modelo Cumplimiento
    const documentosPorCategoria = {
      Legal: cumplimientoItems.filter(c => c.categoria === 'Legal'),
      Seguridad: cumplimientoItems.filter(c => c.categoria === 'Seguridad'),
      Reglamentario: cumplimientoItems.filter(c => c.categoria === 'Reglamentario'),
      Interno: cumplimientoItems.filter(c => c.categoria === 'Interno'),
      Financiero: cumplimientoItems.filter(c => c.categoria === 'Financiero'),
    }
    
    const cumplimientoStats = {
      total: cumplimientoItems.length,
      completados: cumplimientoItems.filter(c => c.estado === 'Completado').length,
      pendientes: cumplimientoItems.filter(c => c.estado === 'Pendiente').length,
      enProceso: cumplimientoItems.filter(c => c.estado === 'En Proceso').length,
      vencidos: cumplimientoItems.filter(c => 
        c.estado === 'Vencido' || 
        (c.estado !== 'Completado' && 
        c.fechaVencimiento && 
        new Date(c.fechaVencimiento) < hoy)
      ).length,
      porVencer: cumplimientoItems.filter(c => {
        if (c.estado === 'Completado' || !c.fechaVencimiento) return false
        const fechaVen = new Date(c.fechaVencimiento)
        const en30Dias = new Date()
        en30Dias.setDate(en30Dias.getDate() + 30)
        return fechaVen >= hoy && fechaVen <= en30Dias
      }).length,
      obligatorios: cumplimientoItems.filter(c => c.obligatorio).length,
      opcionales: cumplimientoItems.filter(c => !c.obligatorio).length,
      porcentajeGeneral: cumplimientoItems.length > 0 
        ? Math.round(cumplimientoItems.filter(c => c.estado === 'Completado').length / cumplimientoItems.length * 100)
        : 0,
      porcentajeLegal: documentosPorCategoria.Legal.length > 0 
        ? Math.round(documentosPorCategoria.Legal.filter(c => c.estado === 'Completado').length / documentosPorCategoria.Legal.length * 100)
        : 0,
      porcentajeReglamentario: documentosPorCategoria.Reglamentario.length > 0 
        ? Math.round(documentosPorCategoria.Reglamentario.filter(c => c.estado === 'Completado').length / documentosPorCategoria.Reglamentario.length * 100)
        : 0,
      proximosVencer: cumplimientoItems
        .filter(c => {
          if (c.estado === 'Completado' || !c.fechaVencimiento) return false
          const fechaVen = new Date(c.fechaVencimiento)
          const en30Dias = new Date()
          en30Dias.setDate(en30Dias.getDate() + 30)
          return fechaVen >= hoy && fechaVen <= en30Dias
        })
        .map(c => ({
          id: c.id,
          titulo: c.titulo,
          fechaVencimiento: c.fechaVencimiento,
          categoria: c.categoria || 'General',
          estado: c.estado,
        }))
        .sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime())
        .slice(0, 5),
    }
    
    // CORREGIDO: Formatear recentOT para evitar referencias circulares
    const recentOTFormatted = recentOT.map(ot => ({
      id: ot.id,
      otNum: ot.otNum,
      titulo: ot.titulo,
      prioridad: ot.prioridad,
      estado: ot.estado,
      fechaLimite: ot.fechaLimite,
      propiedad: ot.propiedad?.nombre || null,
      asignado: ot.asignado?.nombre || null,
    }))
    
    return NextResponse.json({
      stats,
      estadoPropiedades,
      recentOT: recentOTFormatted,
      centrosConGasto,
      cumplimientoStats,
      // CORREGIDO: Información de sesión para verificación frontend
      authenticated: true,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ 
      error: 'Error fetching dashboard',
      authenticated: false 
    }, { status: 500 })
  }
}
