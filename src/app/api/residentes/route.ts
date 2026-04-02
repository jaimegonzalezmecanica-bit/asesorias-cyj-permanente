/**
 * API de Gestión de Residentes
 * Condominio Laguna Norte - Sistema de Gestión v2
 * CORREGIDO: Agregada autenticación, validación y verificación de duplicados
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession, hasPermission, validarRutChileno, formatearRut, logAction } from '@/lib/auth'

// CORREGIDO: Interfaz para validación de entrada
interface ResidenteInput {
  nombre?: string
  apellido?: string
  rut?: string
  unidad?: string
  etapa?: string
  tipo?: string
  telefono?: string
  email?: string
  fechaIngreso?: string
  estado?: string
  vehiculos?: string
  notas?: string
  propiedadId?: string
  condominioId?: string
}

// CORREGIDO: Función para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// CORREGIDO: Función para validar teléfono chileno
function isValidPhone(phone: string): boolean {
  // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678
  const cleanPhone = phone.replace(/[\s-]/g, '')
  return /^(\+56)?9\d{8}$/.test(cleanPhone) || /^\d{7,9}$/.test(cleanPhone)
}

// GET - List all residentes
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
    if (!hasPermission(session.user.rol, 'residentes.ver')) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver residentes' },
        { status: 403 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    // CORREGIDO: Sanitizar y limitar parámetros
    const search = (searchParams.get('search') || '').trim().slice(0, 50)
    const etapa = (searchParams.get('etapa') || '').trim().slice(0, 50)
    
    // CORREGIDO: Agregar paginación
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit
    
    const whereClause = {
      AND: [
        search ? {
          OR: [
            { nombre: { contains: search } },
            { apellido: { contains: search } },
            { rut: { contains: search } },
            { unidad: { contains: search } },
            { etapa: { contains: search } },
          ]
        } : {},
        etapa ? { etapa: { equals: etapa } } : {},
      ]
    }
    
    // CORREGIDO: Obtener total para paginación
    const [residentes, total] = await Promise.all([
      db.residente.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          propiedad: {
            select: { id: true, nombre: true, tipo: true }
          }
        }
      }),
      db.residente.count({ where: whereClause })
    ])
    
    return NextResponse.json({
      data: residentes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching residentes:', error)
    return NextResponse.json({ error: 'Error fetching residentes' }, { status: 500 })
  }
}

// POST - Create new residente
// CORREGIDO: Agregada autenticación y validación completa
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
    if (!hasPermission(session.user.rol, 'residentes.crear')) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear residentes' },
        { status: 403 }
      )
    }
    
    const data: ResidenteInput = await request.json()
    
    // CORREGIDO: Validar nombre requerido
    if (!data.nombre || !data.nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar longitud del nombre
    if (data.nombre.length > 100) {
      return NextResponse.json(
        { error: 'El nombre no puede exceder 100 caracteres' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar RUT si se proporciona
    let rutFormateado: string | null = null
    if (data.rut && data.rut.trim()) {
      if (!validarRutChileno(data.rut)) {
        return NextResponse.json(
          { error: 'El RUT ingresado no es válido' },
          { status: 400 }
        )
      }
      rutFormateado = formatearRut(data.rut)
      
      // CORREGIDO: Verificar RUT duplicado
      const existingRut = await db.residente.findFirst({
        where: { rut: rutFormateado }
      })
      
      if (existingRut) {
        return NextResponse.json(
          { error: 'Ya existe un residente con ese RUT' },
          { status: 409 }
        )
      }
    }
    
    // CORREGIDO: Validar email si se proporciona
    if (data.email && data.email.trim() && !isValidEmail(data.email)) {
      return NextResponse.json(
        { error: 'El email no tiene un formato válido' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar teléfono si se proporciona
    if (data.telefono && data.telefono.trim() && !isValidPhone(data.telefono)) {
      return NextResponse.json(
        { error: 'El teléfono no tiene un formato válido' },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar tipo de residente
    const tiposValidos = ['Residente', 'Propietario', 'Arrendatario', 'Visita']
    if (data.tipo && !tiposValidos.includes(data.tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar estado
    const estadosValidos = ['Activo', 'Moroso', 'Vacaciones', 'Licencia', 'Inactivo']
    if (data.estado && !estadosValidos.includes(data.estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` },
        { status: 400 }
      )
    }
    
    // CORREGIDO: Validar propiedadId si se proporciona
    if (data.propiedadId) {
      const propiedadExists = await db.propiedad.findUnique({
        where: { id: data.propiedadId }
      })
      
      if (!propiedadExists) {
        return NextResponse.json(
          { error: 'La propiedad especificada no existe' },
          { status: 400 }
        )
      }
    }
    
    const residente = await db.residente.create({
      data: {
        nombre: data.nombre.trim(),
        apellido: data.apellido?.trim() || null,
        rut: rutFormateado,
        unidad: data.unidad?.trim() || null,
        etapa: data.etapa?.trim() || null,
        tipo: data.tipo || 'Residente',
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        fechaIngreso: data.fechaIngreso || null,
        estado: data.estado || 'Activo',
        vehiculos: data.vehiculos?.trim() || null,
        notas: data.notas?.trim() || null,
        propiedadId: data.propiedadId || null,
        condominioId: data.condominioId || null,
      }
    })
    
    // CORREGIDO: Registrar en log de auditoría
    await logAction(
      session.userId,
      'create',
      'Residente',
      residente.id,
      null,
      { nombre: residente.nombre, rut: residente.rut }
    )
    
    return NextResponse.json(residente, { status: 201 })
  } catch (error) {
    console.error('Error creating residente:', error)
    return NextResponse.json({ error: 'Error creating residente' }, { status: 500 })
  }
}
