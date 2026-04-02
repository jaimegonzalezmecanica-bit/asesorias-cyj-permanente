import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ExportRequest {
  modulo: string
  formato: 'csv' | 'excel' | 'pdf'
  filtros: Record<string, string>
  columnas: string[]
  fechaDesde?: string
  fechaHasta?: string
  condominioId?: string
}

// Configuración de módulos
const MODULES_CONFIG: Record<string, {
  model: string
  label: string
  columns: { key: string; label: string }[]
}> = {
  residentes: {
    model: 'residente',
    label: 'Residentes',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'rut', label: 'RUT' },
      { key: 'unidad', label: 'Unidad' },
      { key: 'etapa', label: 'Etapa' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Email' },
      { key: 'estado', label: 'Estado' },
      { key: 'fechaIngreso', label: 'Fecha Ingreso' }
    ]
  },
  personal: {
    model: 'personal',
    label: 'Personal',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'rut', label: 'RUT' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'contrato', label: 'Contrato' },
      { key: 'sueldoBase', label: 'Sueldo Base' },
      { key: 'movilizacion', label: 'Movilización' },
      { key: 'colacion', label: 'Colación' },
      { key: 'estado', label: 'Estado' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Email' },
      { key: 'fechaIngreso', label: 'Fecha Ingreso' }
    ]
  },
  gastos: {
    model: 'gasto',
    label: 'Gastos',
    columns: [
      { key: 'descripcion', label: 'Descripción' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'monto', label: 'Monto' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'estado', label: 'Estado' },
      { key: 'nDoc', label: 'N° Documento' },
      { key: 'propiedad', label: 'Propiedad' }
    ]
  },
  ordenes: {
    model: 'ordenTrabajo',
    label: 'Órdenes de Trabajo',
    columns: [
      { key: 'otNum', label: 'N° OT' },
      { key: 'titulo', label: 'Título' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'prioridad', label: 'Prioridad' },
      { key: 'estado', label: 'Estado' },
      { key: 'ubicacion', label: 'Ubicación' },
      { key: 'fechaInicio', label: 'Fecha Inicio' },
      { key: 'fechaLimite', label: 'Fecha Límite' },
      { key: 'costoEstimado', label: 'Costo Estimado' },
      { key: 'costoReal', label: 'Costo Real' },
      { key: 'progreso', label: 'Progreso (%)' }
    ]
  },
  activos: {
    model: 'activo',
    label: 'Activos',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'estado', label: 'Estado' },
      { key: 'ubicacion', label: 'Ubicación' },
      { key: 'serie', label: 'N° Serie' },
      { key: 'fechaCompra', label: 'Fecha Compra' },
      { key: 'costoCompra', label: 'Costo Compra' },
      { key: 'valorActual', label: 'Valor Actual' }
    ]
  },
  proveedores: {
    model: 'proveedor',
    label: 'Proveedores',
    columns: [
      { key: 'razonSocial', label: 'Razón Social' },
      { key: 'rut', label: 'RUT' },
      { key: 'giro', label: 'Giro' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'telCorp', label: 'Teléfono' },
      { key: 'emailCorp', label: 'Email' },
      { key: 'contacto', label: 'Contacto' },
      { key: 'estado', label: 'Estado' }
    ]
  },
  cumplimiento: {
    model: 'cumplimiento',
    label: 'Cumplimiento Legal',
    columns: [
      { key: 'titulo', label: 'Título' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'subcategoria', label: 'Subcategoría' },
      { key: 'estado', label: 'Estado' },
      { key: 'fechaVencimiento', label: 'Fecha Vencimiento' },
      { key: 'obligatorio', label: 'Obligatorio' },
      { key: 'cumplimientoPorc', label: 'Cumplimiento (%)' }
    ]
  },
  auditoria: {
    model: 'auditoria',
    label: 'Auditoría',
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'titulo', label: 'Título' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'estado', label: 'Estado' },
      { key: 'fechaInicio', label: 'Fecha Inicio' },
      { key: 'fechaFin', label: 'Fecha Fin' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'puntuacionTotal', label: 'Puntuación' }
    ]
  },
  propiedades: {
    model: 'propiedad',
    label: 'Propiedades',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'estado', label: 'Estado' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'habitaciones', label: 'Habitaciones' },
      { key: 'banos', label: 'Baños' },
      { key: 'mts2', label: 'M²' },
      { key: 'precio', label: 'Precio' }
    ]
  },
  gastoscomunes: {
    model: 'gastoComun',
    label: 'Gastos Comunes',
    columns: [
      { key: 'periodo', label: 'Periodo' },
      { key: 'fechaEmision', label: 'Fecha Emisión' },
      { key: 'fechaVencimiento', label: 'Fecha Vencimiento' },
      { key: 'totalGastos', label: 'Total Gastos' },
      { key: 'totalCobrar', label: 'Total a Cobrar' },
      { key: 'montoPorUnidad', label: 'Monto por Unidad' },
      { key: 'estado', label: 'Estado' }
    ]
  },
  reservas: {
    model: 'reserva',
    label: 'Reservas',
    columns: [
      { key: 'titulo', label: 'Título' },
      { key: 'espacio', label: 'Espacio' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'horaInicio', label: 'Hora Inicio' },
      { key: 'horaFin', label: 'Hora Fin' },
      { key: 'residente', label: 'Residente' },
      { key: 'unidad', label: 'Unidad' },
      { key: 'estado', label: 'Estado' },
      { key: 'monto', label: 'Monto' }
    ]
  },
  centrosCosto: {
    model: 'centroCostoMaster',
    label: 'Centros de Costo',
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'tipoGasto', label: 'Tipo Gasto' },
      { key: 'presupuestoMens', label: 'Presupuesto Mensual' },
      { key: 'presupuestoAnual', label: 'Presupuesto Anual' },
      { key: 'estado', label: 'Estado' }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { modulo, filtros, columnas, fechaDesde, fechaHasta, condominioId } = body

    const config = MODULES_CONFIG[modulo]
    if (!config) {
      return NextResponse.json({ error: 'Módulo no válido' }, { status: 400 })
    }

    // Obtener datos según el módulo
    let data: any[] = []
    
    switch (modulo) {
      case 'residentes':
        data = await db.residente.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.tipo && { tipo: filtros.tipo })
          }
        })
        break

      case 'personal':
        data = await db.personal.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.contrato && { contrato: filtros.contrato })
          }
        })
        break

      case 'gastos':
        data = await db.gasto.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.categoria && { categoria: filtros.categoria }),
            ...(fechaDesde && { fecha: { gte: fechaDesde } }),
            ...(fechaHasta && { fecha: { lte: fechaHasta } })
          },
          include: { proveedor: true }
        })
        data = data.map(g => ({
          ...g,
          proveedor: g.proveedor?.razonSocial || '-'
        }))
        break

      case 'ordenes':
        data = await db.ordenTrabajo.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.tipo && { tipo: filtros.tipo }),
            ...(filtros.prioridad && { prioridad: filtros.prioridad })
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'activos':
        data = await db.activo.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.categoria && { categoria: filtros.categoria })
          }
        })
        break

      case 'proveedores':
        data = await db.proveedor.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado })
          }
        })
        break

      case 'cumplimiento':
        data = await db.cumplimiento.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.categoria && { categoria: filtros.categoria })
          }
        })
        break

      case 'auditoria':
        data = await db.auditoria.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.tipo && { tipo: filtros.tipo })
          }
        })
        break

      case 'propiedades':
        data = await db.propiedad.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.tipo && { tipo: filtros.tipo })
          }
        })
        break

      case 'gastoscomunes':
        data = await db.gastoComun.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado })
          }
        })
        break

      case 'reservas':
        data = await db.reserva.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado })
          }
        })
        break

      case 'centrosCosto':
        data = await db.centroCostoMaster.findMany({ 
          where: {
            ...(condominioId && { condominioId }),
            ...(filtros.estado && { estado: filtros.estado }),
            ...(filtros.tipoGasto && { tipoGasto: filtros.tipoGasto })
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Módulo no implementado' }, { status: 400 })
    }

    // Obtener labels de columnas
    const columnLabels = columnas.map(col => {
      const colConfig = config.columns.find(c => c.key === col)
      return colConfig?.label || col
    })

    // Devolver datos para que el frontend los procese
    return NextResponse.json({ 
      data, 
      columns: columnas,
      columnLabels,
      title: config.label,
      totalRecords: data.length
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 })
  }
}
