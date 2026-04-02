import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get orden de trabajo by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orden = await db.ordenTrabajo.findUnique({
      where: { id },
      include: {
        propiedad: true,
        asignado: true,
        activo: true,
        centroCosto: true,
        materiales: true,
        herramientas: true,
        tareas: true,
        personalOT: true,
        documentos: true,
      }
    })
    
    if (!orden) {
      return NextResponse.json({ error: 'Orden not found' }, { status: 404 })
    }
    
    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error fetching orden:', error)
    return NextResponse.json({ error: 'Error fetching orden' }, { status: 500 })
  }
}

// Calcular progreso automático basado en tareas y recursos
function calcularProgresoAutomatico(data: any): number {
  let progreso = 0
  let totalItems = 0
  let itemsCompletados = 0
  
  // Tareas: cada tarea cuenta como completada si tiene estado "Completado"
  if (data.tareas && data.tareas.length > 0) {
    totalItems += data.tareas.length * 2 // Las tareas valen doble
    itemsCompletados += data.tareas.filter((t: any) => t.estado === 'Completado' || t.cumple === true).length * 2
  }
  
  // Materiales: si hay materiales registrados, suma
  if (data.materiales && data.materiales.length > 0) {
    totalItems += data.materiales.length
    itemsCompletados += data.materiales.filter((m: any) => m.descripcion && m.cantidad > 0).length
  }
  
  // Personal: si hay personal con horas registradas
  if (data.personalOT && data.personalOT.length > 0) {
    totalItems += data.personalOT.length
    itemsCompletados += data.personalOT.filter((p: any) => p.horasTrabajadas > 0).length
  }
  
  // Herramientas: si hay herramientas
  if (data.herramientas && data.herramientas.length > 0) {
    totalItems += data.herramientas.length
    itemsCompletados += data.herramientas.filter((h: any) => h.nombre).length
  }
  
  // Si no hay items, mantener el progreso manual
  if (totalItems === 0) {
    return parseInt(data.progreso) || 0
  }
  
  progreso = Math.round((itemsCompletados / totalItems) * 100)
  
  // Si hay progreso manual y es mayor, usar ese
  const progresoManual = parseInt(data.progreso) || 0
  return Math.max(progreso, progresoManual)
}

// PUT - Update orden de trabajo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Obtener la OT actual para comparar cambios
    const otActual = await db.ordenTrabajo.findUnique({
      where: { id },
      include: { tareas: true }
    })
    
    if (!otActual) {
      return NextResponse.json({ error: 'Orden not found' }, { status: 404 })
    }
    
    // Calcular progreso automático
    const progresoCalculado = calcularProgresoAutomatico(data)
    
    // Manejar cambio de estado automático
    let nuevoEstado = data.estado
    let fechaHoraInicio = otActual.fechaHoraInicio
    let fechaHoraFin = otActual.fechaHoraFin
    let segundosTranscurridos = otActual.segundosTranscurridos
    
    // Si cambia a "En Progreso" y no tenía fecha de inicio, registrar
    if (data.estado === 'En Progreso' && !otActual.fechaHoraInicio) {
      fechaHoraInicio = new Date()
    }
    
    // Si cambia a "Completado" o "Pendiente Aprobación", registrar fin
    if ((data.estado === 'Completado' || data.estado === 'Pendiente Aprobación') && !otActual.fechaHoraFin) {
      fechaHoraFin = new Date()
      
      // Calcular segundos transcurridos
      if (fechaHoraInicio) {
        const diff = fechaHoraFin.getTime() - new Date(fechaHoraInicio).getTime()
        segundosTranscurridos = Math.round(diff / 1000)
      }
    }
    
    // Determinar si necesita aprobación
    let pendienteAprobacion = otActual.pendienteAprobacion
    let fechaSolicitudAprobacion = otActual.fechaSolicitudAprobacion
    
    if (data.solicitarAprobacion && !otActual.pendienteAprobacion) {
      pendienteAprobacion = true
      fechaSolicitudAprobacion = new Date()
      nuevoEstado = 'Pendiente Aprobación'
    }
    
    // Si se está aprobando
    let fechaAprobacion = otActual.fechaAprobacion
    let aprobadoPor = otActual.aprobadoPor
    
    if (data.aprobar && otActual.pendienteAprobacion) {
      pendienteAprobacion = false
      fechaAprobacion = new Date()
      aprobadoPor = data.aprobadoPor || null
      nuevoEstado = 'Completado'
    }
    
    // Update main OT
    const orden = await db.ordenTrabajo.update({
      where: { id },
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        prioridad: data.prioridad,
        estado: nuevoEstado,
        ubicacion: data.ubicacion || null,
        ubicacionId: data.ubicacionId || null,
        fechaInicio: data.fechaInicio || null,
        fechaLimite: data.fechaLimite || null,
        fechaInicioReal: data.fechaInicioReal || null,
        fechaFinReal: data.fechaFinReal || null,
        horaInicioReal: data.horaInicioReal || null,
        horaFinReal: data.horaFinReal || null,
        costoEstimado: parseFloat(data.costoEstimado) || 0,
        costoReal: parseFloat(data.costoReal) || 0,
        progreso: progresoCalculado,
        descripcion: data.descripcion || null,
        tiempoEst: parseInt(data.tiempoEst) || 0,
        tiempoReal: Math.round(segundosTranscurridos / 60),
        valorHora: parseFloat(data.valorHora) || 0,
        notas: data.notas || null,
        propiedadId: data.propiedadId || null,
        asignadoId: data.asignadoId || null,
        activoId: data.activoId || null,
        centroCostoId: data.centroCostoId || null,
        esRecurrente: data.esRecurrente || false,
        formaPago: data.formaPago || null,
        fechaHoraInicio,
        fechaHoraFin,
        segundosTranscurridos,
        pendienteAprobacion,
        fechaSolicitudAprobacion,
        fechaAprobacion,
        aprobadoPor,
        observacionesAprobacion: data.observacionesAprobacion || null,
      }
    })
    
    // Update materials if provided (usando transacción para evitar duplicados)
    if (data.materiales !== undefined) {
      await db.$transaction(async (tx) => {
        await tx.oTMaterial.deleteMany({ where: { otId: id } })
        if (data.materiales.length > 0) {
          await tx.oTMaterial.createMany({
            data: data.materiales.map((m: any) => ({
              descripcion: m.descripcion,
              cantidad: parseFloat(m.cantidad) || 1,
              unidad: m.unidad || 'unidad',
              precioUnit: parseFloat(m.precioUnit) || 0,
              total: parseFloat(m.total) || 0,
              otId: id
            }))
          })
        }
      })
    }
    
    // Update herramientas if provided (usando transacción)
    if (data.herramientas !== undefined) {
      await db.$transaction(async (tx) => {
        await tx.oTHerramienta.deleteMany({ where: { otId: id } })
        if (data.herramientas.length > 0) {
          await tx.oTHerramienta.createMany({
            data: data.herramientas.map((h: any) => ({
              nombre: h.nombre,
              cantidad: parseInt(h.cantidad) || 1,
              otId: id
            }))
          })
        }
      })
    }
    
    // Update tareas if provided (usando transacción)
    if (data.tareas !== undefined) {
      await db.$transaction(async (tx) => {
        await tx.oTTarea.deleteMany({ where: { otId: id } })
        if (data.tareas.length > 0) {
          await tx.oTTarea.createMany({
            data: data.tareas.map((t: any) => ({
              descripcion: t.descripcion,
              cantidad: parseInt(t.cantidad) || 1,
              estado: t.estado || 'Pendiente',
              cumple: t.cumple || null,
              otId: id
            }))
          })
        }
      })
    }
    
    // Update personal if provided (usando transacción)
    if (data.personalOT !== undefined) {
      await db.$transaction(async (tx) => {
        await tx.oTPersonal.deleteMany({ where: { otId: id } })
        if (data.personalOT.length > 0) {
          await tx.oTPersonal.createMany({
            data: data.personalOT.map((p: any) => ({
              nombre: p.nombre,
              tipo: p.tipo || 'Interno',
              cantidad: parseInt(p.cantidad) || 1,
              precioUnit: parseFloat(p.precioUnit) || 0,
              horasTrabajadas: parseFloat(p.horasTrabajadas) || 0,
              total: parseFloat(p.total) || 0,
              cumple: p.cumple || null,
              observaciones: p.observaciones || null,
              otId: id
            }))
          })
        }
      })
    }
    
    // Crear registro de aprobación si se está solicitando
    if (data.solicitarAprobacion && !otActual.pendienteAprobacion) {
      await db.aprobacionOT.create({
        data: {
          otId: id,
          solicitadoPor: data.solicitadoPor || null,
          estado: 'Pendiente'
        }
      })
    }
    
    // Actualizar registro de aprobación si se está aprobando
    if (data.aprobar && otActual.pendienteAprobacion) {
      await db.aprobacionOT.updateMany({
        where: { otId: id, estado: 'Pendiente' },
        data: {
          estado: 'Aprobado',
          aprobadoPor: data.aprobadoPor || null,
          fechaAprobacion: new Date(),
          observaciones: data.observacionesAprobacion || null,
          segundosRespuesta: otActual.fechaSolicitudAprobacion 
            ? Math.round((new Date().getTime() - new Date(otActual.fechaSolicitudAprobacion).getTime()) / 1000)
            : null
        }
      })
    }
    
    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error updating orden:', error)
    return NextResponse.json({ error: 'Error updating orden' }, { status: 500 })
  }
}

// DELETE - Delete orden de trabajo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete related records first
    await db.oTMaterial.deleteMany({ where: { otId: id } })
    await db.oTHerramienta.deleteMany({ where: { otId: id } })
    await db.oTTarea.deleteMany({ where: { otId: id } })
    await db.oTPersonal.deleteMany({ where: { otId: id } })
    await db.oTDocumento.deleteMany({ where: { otId: id } })
    
    await db.ordenTrabajo.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting orden:', error)
    return NextResponse.json({ error: 'Error deleting orden' }, { status: 500 })
  }
}
