/**
 * API de Gestión de Gastos
 * Condominio Laguna Norte - Sistema de Gestión v2
 * CORREGIDO: Autenticación, validación y transacciones atómicas
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession, hasPermission, logAction } from '@/lib/auth'

// CORREGIDO: Interfaz para validación de entrada
interface GastoInput {
  descripcion?: string
  categoria?: string
  estado?: string
  monto?: number | string
  fecha?: string
  propiedad?: string
  proveedorId?: string
  nDoc?: string
  centroCostoId?: string  // CORREGIDO: Usar relación correcta
  notas?: string
  comprobante?: string
  condominioId?: string
}

// CORREGIDO: Categorías válidas
const CATEGORIAS_VALIDAS = [
  'Mantenimiento',
  'Administración',
  'Seguridad',
  'Áreas Verdes',
  'Servicios Básicos',
  'Limpieza',
  'Reparaciones',
  'Equipamiento',
  'Otros'
]

// CORREGIDO: Estados válidos
const ESTADOS_VALIDOS = ['Pendiente', 'Pagado', 'Rechazado', 'En revisión']

// GET - List all gastos
// CORREGIDO: Agregada autenticación y paginación
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
    if (!hasPermission(session.user.rol, 'gastos.ver')) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver gastos' },
        { status: 403 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    // CORREGIDO: Sanitizar parámetros
    const search = (searchParams.get('search') || '').trim().slice(0, 50)
    const categoria = searchParams.get('categoria') || ''
    const estado = searchParams.get('estado') || ''
    
    // CORREGIDO: Agregar paginación
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit
    
    // CORREGIDO: Construir where con filtros
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { descripcion: { contains: search } },
        { categoria: { contains: search } },
      ]
    }
    
    if (categoria && CATEGORIAS_VALIDAS.includes(categoria)) {
      whereClause.categoria = categoria
    }
    
    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      whereClause.estado = estado
    }
    
    // CORREGIDO: Obtener total para paginación
    const [gastos, total] = await Promise.all([
      db.gasto.findMany({
        where: whereClause,
        include: {
          proveedor: {
            select: { id: true, razonSocial: true, rut: true }
          },
          centroCosto: {
            select: { id: true, codigo: true, nombre: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.gasto.count({ where: whereClause })
    ])
    
    return NextResponse.json({
      data: gastos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching gastos:', error)
    return NextResponse.json({ error: 'Error fetching gastos' }, { status: 500 })
  }
}

// POST - Create new gasto
// CORREGIDO: Transacción atómica con caja chica
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
    if (!hasPermission(session.user.rol, 'gastos.crear')) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear gastos' },
        { status: 403 }
      )
    }
    
    const data: GastoInput = await request.json()
    
    // CORREGIDO: Validar descripción requerida
    if (!data.descripcion || !data.descripcion.trim()) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar longitud de descripción
    if (data.descripcion.length > 500) {
      return NextResponse.json(
        { error: 'La descripción no puede exceder 500 caracteres' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar y parsear monto correctamente
    let monto: number
    if (data.monto === undefined || data.monto === null || data.monto === '') {
      return NextResponse.json(
        { error: 'El monto es requerido' },
        { status: 400 }
      )
    }
    
    monto = typeof data.monto === 'string' ? parseFloat(data.monto) : data.monto
    
    if (isNaN(monto)) {
      return NextResponse.json(
        { error: 'El monto debe ser un número válido' },
        { status: 400 }
      )
    }
    
    if (monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }
    
    if (monto > 999999999) {
      return NextResponse.json(
        { error: 'El monto excede el límite permitido' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar categoría
    const categoria = data.categoria || 'Mantenimiento'
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      return NextResponse.json(
        { error: `Categoría inválida. Valores permitidos: ${CATEGORIAS_VALIDAS.join(', ')}` },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar estado
    const estado = data.estado || 'Pendiente'
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar proveedorId si se proporciona
    if (data.proveedorId) {
      const proveedorExists = await db.proveedor.findUnique({
        where: { id: data.proveedorId }
      })
      
      if (!proveedorExists) {
        return NextResponse.json(
          { error: 'El proveedor especificado no existe' },
          { status: 400 }
        )
      }
    }
    
    // CORREGIDO: Validar centroCostoId si se proporciona
    if (data.centroCostoId) {
      const centroExists = await db.centroCostoMaster.findUnique({
        where: { id: data.centroCostoId }
      })
      
      if (!centroExists) {
        return NextResponse.json(
          { error: 'El centro de costo especificado no existe' },
          { status: 400 }
        )
      }
    }
    
    // CORREGIDO: Usar transacción atómica para crear gasto y actualizar caja
    const gasto = await db.$transaction(async (tx) => {
      // Crear el gasto
      const newGasto = await tx.gasto.create({
        data: {
          descripcion: data.descripcion!.trim(),
          categoria,
          estado,
          monto,
          fecha: data.fecha || new Date().toISOString().split('T')[0],
          propiedad: data.propiedad?.trim() || null,
          proveedorId: data.proveedorId || null,
          nDoc: data.nDoc?.trim() || null,
          centroCostoId: data.centroCostoId || null,
          notas: data.notas?.trim() || null,
          comprobante: data.comprobante || null,
          condominioId: data.condominioId || null,
        },
        include: {
          proveedor: true,
          centroCosto: true,
        }
      })
      
      // CORREGIDO: Actualizar caja chica atómicamente si está pagado
      if (estado === 'Pagado') {
        const caja = await tx.cajaChica.findFirst()
        
        if (!caja) {
          // Crear caja chica si no existe
          await tx.cajaChica.create({
            data: {
              saldo: -monto,
              saldoInicial: 0,
            }
          })
        } else {
          // CORREGIDO: Verificar saldo suficiente
          if (caja.saldo < monto) {
            // No revertir la transacción, solo registrar advertencia
            console.warn(`Gasto creado con saldo insuficiente en caja. Saldo: ${caja.saldo}, Monto: ${monto}`)
          }
          
          // Actualizar saldo (decrementar atómicamente)
          await tx.cajaChica.update({
            where: { id: caja.id },
            data: {
              saldo: { decrement: monto }
            }
          })
        }
      }
      
      return newGasto
    }, {
      // CORREGIDO: Configuración de transacción
      maxWait: 5000,
      timeout: 10000,
    })
    
    // CORREGIDO: Registrar en log de auditoría
    await logAction(
      session.userId,
      'create',
      'Gasto',
      gasto.id,
      null,
      { descripcion: gasto.descripcion, monto: gasto.monto, estado: gasto.estado }
    )
    
    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    console.error('Error creating gasto:', error)
    
    // CORREGIDO: Manejar errores específicos
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Error de base de datos. Intente nuevamente.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ error: 'Error creating gasto' }, { status: 500 })
  }
}
