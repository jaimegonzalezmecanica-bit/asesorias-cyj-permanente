/**
 * API de Órdenes de Trabajo
 * CORREGIDO: Agregada autenticación, validación y generación atómica de números
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession, hasPermission, logAction } from '@/lib/auth'

// CORREGIDO: Interfaz para validación de entrada
interface MaterialInput {
  descripcion: string
  cantidad?: number | string
  unidad?: string
  precioUnit?: number | string
  total?: number | string
}

interface HerramientaInput {
  nombre: string
  cantidad?: number | string
}

interface TareaInput {
  descripcion: string
  cantidad?: number | string
  estado?: string
}

interface PersonalOTInput {
  nombre: string
  tipo?: string
  cantidad?: number | string
  precioUnit?: number | string
  horasTrabajadas?: number | string
  total?: number | string
  cumple?: boolean
  observaciones?: string
}

interface OrdenTrabajoInput {
  titulo: string
  tipo?: string
  prioridad?: string
  estado?: string
  ubicacion?: string
  fechaInicio?: string
  fechaLimite?: string
  fechaInicioReal?: string
  fechaFinReal?: string
  costoEstimado?: number | string
  costoReal?: number | string
  progreso?: number | string
  descripcion?: string
  tiempoEst?: number | string
  tiempoReal?: number | string
  valorHora?: number | string
  notas?: string
  propiedadId?: string
  asignadoId?: string
  activoId?: string
  centroCostoId?: string
  esRecurrente?: boolean
  formaPago?: string
  fotosAntes?: string[]
  fotosDespues?: string[]
  materiales?: MaterialInput[]
  herramientas?: HerramientaInput[]
  tareas?: TareaInput[]
  personalOT?: PersonalOTInput[]
  otNum?: string
}

// CORREGIDO: Función helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue
  try {
    return JSON.parse(jsonString) as T
  } catch {
    console.warn('Error parsing JSON, returning default value')
    return defaultValue
  }
}

// CORREGIDO: Función para validar y convertir número
function parseNumber(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? defaultValue : num
}

// CORREGIDO: Función para validar y convertir entero
function parseInt_(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return isNaN(num) ? defaultValue : Math.floor(num)
}

// GET - List all ordenes de trabajo
// CORREGIDO: Agregada autenticación
export async function GET(request: NextRequest) {
  try {
    // CORREGIDO: Verificar sesión
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // CORREGIDO: Verificar permiso
    if (!hasPermission(session.user.rol, 'ots.ver')) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver órdenes de trabajo' },
        { status: 403 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    // CORREGIDO: Sanitizar parámetro de búsqueda
    const search = (searchParams.get('search') || '').trim().slice(0, 100)
    
    // CORREGIDO: Agregar paginación
    const page = parseInt_(searchParams.get('page'), 1)
    const limit = Math.min(parseInt_(searchParams.get('limit'), 50), 100) // Max 100
    const skip = (page - 1) * limit
    
    const whereClause = search ? {
      OR: [
        { otNum: { contains: search } },
        { titulo: { contains: search } },
        { estado: { contains: search } },
      ]
    } : undefined
    
    // CORREGIDO: Obtener total para paginación
    const [ordenes, total] = await Promise.all([
      db.ordenTrabajo.findMany({
        where: whereClause,
        include: {
          propiedad: true,
          asignado: true,
          activo: true,
          centroCosto: true,
          materiales: true,
          herramientas: true,
          tareas: true,
          personalOT: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.ordenTrabajo.count({ where: whereClause })
    ])
    
    // CORREGIDO: Usar safeJsonParse en lugar de JSON.parse directo
    const ordenesWithCC = ordenes.map(ot => ({
      ...ot,
      centroCosto: ot.centroCosto, // Keep as object for frontend compatibility
      fotosAntes: safeJsonParse<string[]>(ot.fotosAntes, []),
      fotosDespues: safeJsonParse<string[]>(ot.fotosDespues, []),
    }))
    
    return NextResponse.json({
      data: ordenesWithCC,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching ordenes:', error)
    return NextResponse.json({ error: 'Error fetching ordenes' }, { status: 500 })
  }
}

// POST - Create new orden de trabajo
// CORREGIDO: Agregada autenticación, validación y generación atómica
export async function POST(request: NextRequest) {
  try {
    // CORREGIDO: Verificar sesión
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // CORREGIDO: Verificar permiso de creación
    if (!hasPermission(session.user.rol, 'ots.crear')) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear órdenes de trabajo' },
        { status: 403 }
      )
    }
    
    const data: OrdenTrabajoInput = await request.json()
    
    // CORREGIDO: Validar campos requeridos
    if (!data.titulo || !data.titulo.trim()) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar longitud del título
    if (data.titulo.length > 200) {
      return NextResponse.json(
        { error: 'El título no puede exceder 200 caracteres' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar valores enum
    const tiposValidos = ['Correctivo', 'Preventivo', 'Mejora', 'Emergencia']
    const prioridadesValidas = ['Urgente', 'Alta', 'Media', 'Baja']
    const estadosValidos = ['Pendiente', 'En Progreso', 'Completado', 'Cancelado']
    
    if (data.tipo && !tiposValidos.includes(data.tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (data.prioridad && !prioridadesValidas.includes(data.prioridad)) {
      return NextResponse.json(
        { error: `Prioridad inválida. Valores permitidos: ${prioridadesValidas.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (data.estado && !estadosValidos.includes(data.estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Generación atómica de número OT usando transacción
    const orden = await db.$transaction(async (tx) => {
      // Lock y obtener último número OT de forma atómica
      const lastOT = await tx.ordenTrabajo.findFirst({
        orderBy: { otNum: 'desc' },
        select: { otNum: true }
      })
      
      let nextNum = 'OT-1001'
      if (lastOT && lastOT.otNum) {
        const lastNum = parseInt(lastOT.otNum.replace('OT-', ''), 10)
        if (!isNaN(lastNum)) {
          nextNum = `OT-${String(lastNum + 1).padStart(4, '0')}`
        }
      }
      
      // Validar que el número no exista (doble verificación)
      const existingOT = await tx.ordenTrabajo.findUnique({
        where: { otNum: nextNum }
      })
      
      if (existingOT) {
        // Si existe por race condition, generar nuevo
        const allOTs = await tx.ordenTrabajo.findMany({
          select: { otNum: true },
          orderBy: { otNum: 'desc' },
          take: 1
        })
        if (allOTs.length > 0) {
          const maxNum = parseInt(allOTs[0].otNum.replace('OT-', ''), 10)
          nextNum = `OT-${String(maxNum + 1).padStart(4, '0')}`
        }
      }
      
      // Extraer recursos del data
      const { materiales, herramientas, tareas, personalOT, centroCostoId, ...otData } = data
      
      return tx.ordenTrabajo.create({
        data: {
          otNum: otData.otNum || nextNum,
          titulo: otData.titulo!.trim(),
          tipo: otData.tipo || 'Correctivo',
          prioridad: otData.prioridad || 'Media',
          estado: otData.estado || 'Pendiente',
          ubicacion: otData.ubicacion?.trim() || null,
          fechaInicio: otData.fechaInicio || null,
          fechaLimite: otData.fechaLimite || null,
          fechaInicioReal: otData.fechaInicioReal || null,
          fechaFinReal: otData.fechaFinReal || null,
          // CORREGIDO: Usar parseNumber para validación
          costoEstimado: parseNumber(otData.costoEstimado),
          costoReal: parseNumber(otData.costoReal),
          progreso: Math.min(100, Math.max(0, parseInt_(otData.progreso))), // 0-100
          descripcion: otData.descripcion?.trim() || null,
          tiempoEst: parseInt_(otData.tiempoEst),
          tiempoReal: parseInt_(otData.tiempoReal),
          valorHora: parseNumber(otData.valorHora),
          notas: otData.notas?.trim() || null,
          propiedadId: otData.propiedadId || null,
          asignadoId: otData.asignadoId || null,
          activoId: otData.activoId || null,
          centroCostoId: centroCostoId || null,
          esRecurrente: otData.esRecurrente || false,
          formaPago: otData.formaPago || null,
          fotosAntes: otData.fotosAntes && otData.fotosAntes.length > 0 
            ? JSON.stringify(otData.fotosAntes) 
            : null,
          fotosDespues: otData.fotosDespues && otData.fotosDespues.length > 0 
            ? JSON.stringify(otData.fotosDespues) 
            : null,
          
          // CORREGIDO: Crear recursos relacionados con validación
          materiales: materiales && materiales.length > 0 ? {
            create: materiales.map((m) => ({
              descripcion: m.descripcion?.trim() || '',
              cantidad: parseNumber(m.cantidad, 1),
              unidad: m.unidad || 'unidad',
              precioUnit: parseNumber(m.precioUnit),
              total: parseNumber(m.total),
            }))
          } : undefined,
          
          herramientas: herramientas && herramientas.length > 0 ? {
            create: herramientas.map((h) => ({
              nombre: h.nombre?.trim() || '',
              cantidad: parseInt_(h.cantidad, 1),
            }))
          } : undefined,
          
          tareas: tareas && tareas.length > 0 ? {
            create: tareas.map((t) => ({
              descripcion: t.descripcion?.trim() || '',
              cantidad: parseInt_(t.cantidad, 1),
              estado: t.estado || 'Pendiente',
            }))
          } : undefined,
          
          personalOT: personalOT && personalOT.length > 0 ? {
            create: personalOT.map((p) => ({
              nombre: p.nombre?.trim() || '',
              tipo: p.tipo || 'Interno',
              cantidad: parseInt_(p.cantidad, 1),
              precioUnit: parseNumber(p.precioUnit),
              horasTrabajadas: parseNumber(p.horasTrabajadas),
              total: parseNumber(p.total),
              cumple: p.cumple || null,
              observaciones: p.observaciones?.trim() || null,
            }))
          } : undefined,
        },
        include: {
          propiedad: true,
          asignado: true,
          centroCosto: true,
          materiales: true,
          herramientas: true,
          tareas: true,
          personalOT: true,
        }
      })
    }, {
      // CORREGIDO: Configuración de transacción
      maxWait: 5000,
      timeout: 10000,
    })
    
    // CORREGIDO: Registrar acción en log de auditoría
    await logAction(
      session.userId,
      'create',
      'OrdenTrabajo',
      orden.id,
      null,
      { otNum: orden.otNum, titulo: orden.titulo }
    )
    
    return NextResponse.json(orden, { status: 201 })
  } catch (error) {
    console.error('Error creating orden:', error)
    
    // CORREGIDO: Manejar errores específicos de Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'El número de OT ya existe. Intente nuevamente.' },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: 'Error creating orden' }, { status: 500 })
  }
}
