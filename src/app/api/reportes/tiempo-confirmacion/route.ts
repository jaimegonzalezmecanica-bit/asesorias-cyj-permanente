/**
 * API de Reporte de Tiempo de Confirmación de OT
 * Asesorías Integrales CyJ - Sistema de Gestión
 * 
 * Retorna OTs aprobadas con métricas de tiempo de respuesta y desviación
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List approved OTs with confirmation time metrics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Build date filter for approval date
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (fechaDesde) {
      dateFilter.gte = new Date(fechaDesde)
    }
    if (fechaHasta) {
      // Add one day to include the end date fully
      const endDate = new Date(fechaHasta)
      endDate.setHours(23, 59, 59, 999)
      dateFilter.lte = endDate
    }

    // Fetch approved OTs
    const ordenes = await db.ordenTrabajo.findMany({
      where: {
        fechaAprobacion: { not: null },
        ...(Object.keys(dateFilter).length > 0 && {
          fechaAprobacion: dateFilter
        })
      },
      include: {
        centroCosto: true,
      },
      orderBy: { fechaAprobacion: 'desc' }
    })

    // Get all unique approver IDs (filter out nulls)
    const approverIds = [...new Set(ordenes.filter(o => o.aprobadoPor).map(o => o.aprobadoPor))] as string[]

    // Fetch approver names
    const approvers = approverIds.length > 0 ? await db.user.findMany({
      where: { id: { in: approverIds } },
      select: { id: true, nombre: true, apellido: true }
    }) : []

    // Create a map for quick lookup
    const approverMap = new Map(approvers.map(a => [a.id, `${a.nombre} ${a.apellido || ''}`.trim()]))

    // Calculate metrics for each OT
    const result = ordenes.map(ot => {
      // Calculate response time in minutes
      let tiempoRespuesta: number | null = null
      if (ot.fechaSolicitudAprobacion && ot.fechaAprobacion) {
        const diffMs = ot.fechaAprobacion.getTime() - ot.fechaSolicitudAprobacion.getTime()
        tiempoRespuesta = Math.round(diffMs / (1000 * 60)) // Convert to minutes
      }

      // Calculate deviation (positive = delay, negative = ahead)
      const desviacion = (ot.tiempoReal || 0) - (ot.tiempoEst || 0)

      return {
        otNum: ot.otNum,
        titulo: ot.titulo,
        fechaSolicitud: ot.fechaSolicitudAprobacion,
        fechaAprobacion: ot.fechaAprobacion,
        tiempoRespuesta,
        tiempoEstimado: ot.tiempoEst || 0,
        tiempoReal: ot.tiempoReal || 0,
        desviacion,
        aprobadoPor: ot.aprobadoPor ? approverMap.get(ot.aprobadoPor) || 'Desconocido' : null,
        centroCosto: ot.centroCosto?.nombre || null,
        estado: ot.estado,
        tipo: ot.tipo,
        prioridad: ot.prioridad,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tiempo confirmación report:', error)
    return NextResponse.json({ error: 'Error fetching report' }, { status: 500 })
  }
}
