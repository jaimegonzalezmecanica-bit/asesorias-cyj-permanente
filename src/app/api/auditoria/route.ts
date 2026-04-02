/**
 * API de Auditoría del Sistema
 * Gestiona auditorías operacionales de condominios
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Checklist predefinido basado en Ley 21.442
const CHECKLIST_DEFAULT = [
  // Sección: Documentación Legal
  { seccion: 'Documentación Legal', pregunta: '¿El Reglamento de Copropiedad está actualizado y registrado?', obligatorio: true, orden: 1 },
  { seccion: 'Documentación Legal', pregunta: '¿Existen actas de asambleas registradas y disponibles?', obligatorio: true, orden: 2 },
  { seccion: 'Documentación Legal', pregunta: '¿Los contratos con proveedores están vigentes?', obligatorio: true, orden: 3 },
  { seccion: 'Documentación Legal', pregunta: '¿Se cuenta con pólizas de seguro vigentes?', obligatorio: true, orden: 4 },
  
  // Sección: Gestión Financiera
  { seccion: 'Gestión Financiera', pregunta: '¿Los estados financieros están actualizados?', obligatorio: true, orden: 5 },
  { seccion: 'Gestión Financiera', pregunta: '¿El fondo de reserva se encuentra correctamente constituido?', obligatorio: true, orden: 6 },
  { seccion: 'Gestión Financiera', pregunta: '¿Existe conciliación bancaria mensual?', obligatorio: true, orden: 7 },
  { seccion: 'Gestión Financiera', pregunta: '¿Los gastos comunes están correctamente liquidados?', obligatorio: true, orden: 8 },
  
  // Sección: Seguridad
  { seccion: 'Seguridad', pregunta: '¿Los extintores están vigentes y correctamente ubicados?', obligatorio: true, orden: 9 },
  { seccion: 'Seguridad', pregunta: '¿El plan de emergencia está actualizado?', obligatorio: true, orden: 10 },
  { seccion: 'Seguridad', pregunta: '¿Las salidas de emergencia están señalizadas y despejadas?', obligatorio: true, orden: 11 },
  { seccion: 'Seguridad', pregunta: '¿Se realizan simulacros de evacuación periódicamente?', obligatorio: false, orden: 12 },
  
  // Sección: Mantenimiento
  { seccion: 'Mantenimiento', pregunta: '¿Existe un plan de mantenimiento preventivo?', obligatorio: true, orden: 13 },
  { seccion: 'Mantenimiento', pregunta: '¿Los ascensores tienen revisión técnica al día?', obligatorio: true, orden: 14 },
  { seccion: 'Mantenimiento', pregunta: '¿Las áreas comunes están en buen estado?', obligatorio: true, orden: 15 },
  { seccion: 'Mantenimiento', pregunta: '¿Los sistemas de bombeo funcionan correctamente?', obligatorio: true, orden: 16 },
  
  // Sección: Gestión Administrativa
  { seccion: 'Gestión Administrativa', pregunta: '¿Existe un registro actualizado de propietarios?', obligatorio: true, orden: 17 },
  { seccion: 'Gestión Administrativa', pregunta: '¿Las órdenes de trabajo se gestionan correctamente?', obligatorio: true, orden: 18 },
  { seccion: 'Gestión Administrativa', pregunta: '¿Los pagos a proveedores se realizan puntualmente?', obligatorio: true, orden: 19 },
  { seccion: 'Gestión Administrativa', pregunta: '¿El personal cuenta con contrato y beneficios al día?', obligatorio: true, orden: 20 },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const condominioId = searchParams.get('condominioId')
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const search = searchParams.get('search')
    
    // Construir filtros
    const where: Prisma.AuditoriaWhereInput = {}
    
    if (condominioId) {
      where.condominioId = condominioId
    }
    
    if (estado) {
      where.estado = estado
    }
    
    if (tipo) {
      where.tipo = tipo
    }
    
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { codigo: { contains: search } },
        { responsable: { contains: search } },
      ]
    }
    
    // Obtener auditorías con conteos
    const auditorias = await db.auditoria.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            hallazgos: true,
            acciones: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Calcular estadísticas
    const total = auditorias.length
    const planificadas = auditorias.filter(a => a.estado === 'Planificada').length
    const enEjecucion = auditorias.filter(a => a.estado === 'En Ejecución').length
    const completadas = auditorias.filter(a => a.estado === 'Completada').length
    const canceladas = auditorias.filter(a => a.estado === 'Cancelada').length
    
    const promedioPuntuacion = auditorias.length > 0 
      ? Math.round(auditorias.reduce((acc, a) => acc + a.puntuacionTotal, 0) / auditorias.length)
      : 0
    
    const totalHallazgos = auditorias.reduce((acc, a) => acc + (a._count?.hallazgos || 0), 0)
    const totalAcciones = auditorias.reduce((acc, a) => acc + (a._count?.acciones || 0), 0)
    
    return NextResponse.json(auditorias.map(a => ({
      ...a,
      itemsCount: a._count?.items || 0,
      hallazgosCount: a._count?.hallazgos || 0,
      accionesCount: a._count?.acciones || 0,
      _count: undefined
    })))
    
  } catch (error) {
    console.error('Error fetching auditorias:', error)
    return NextResponse.json({ error: 'Error al obtener auditorías' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generar código de auditoría
    const year = new Date().getFullYear()
    const existingAuditorias = await db.auditoria.findMany({
      where: {
        codigo: { contains: `AUD-${year}` }
      }
    })
    const count = existingAuditorias.length + 1
    const codigo = `AUD-${year}-${count.toString().padStart(3, '0')}`
    
    // Crear auditoría
    const auditoria = await db.auditoria.create({
      data: {
        codigo,
        titulo: data.titulo,
        tipo: data.tipo || 'Interna',
        categoria: data.categoria || 'General',
        estado: 'Planificada',
        fechaInicio: data.fechaInicio || null,
        fechaFin: data.fechaFin || null,
        responsable: data.responsable || null,
        alcance: data.alcance || null,
        objetivo: data.objetivo || null,
        condominioId: data.condominioId || null,
      }
    })
    
    // Crear items del checklist por defecto
    if (data.createChecklist !== false) {
      await db.auditoriaItem.createMany({
        data: CHECKLIST_DEFAULT.map(item => ({
          auditoriaId: auditoria.id,
          seccion: item.seccion,
          pregunta: item.pregunta,
          obligatorio: item.obligatorio,
          orden: item.orden,
          calificacion: 'Pendiente',
          criticidad: 'Menor'
        }))
      })
    }
    
    // Retornar auditoría con items
    const auditoriaCompleta = await db.auditoria.findUnique({
      where: { id: auditoria.id },
      include: {
        items: {
          orderBy: { orden: 'asc' }
        }
      }
    })
    
    return NextResponse.json(auditoriaCompleta, { status: 201 })
    
  } catch (error) {
    console.error('Error creating auditoria:', error)
    return NextResponse.json({ error: 'Error al crear la auditoría' }, { status: 500 })
  }
}
