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

// PUT - Update orden de trabajo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // Update main OT
    const orden = await db.ordenTrabajo.update({
      where: { id },
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        prioridad: data.prioridad,
        estado: data.estado,
        ubicacion: data.ubicacion || null,
        fechaInicio: data.fechaInicio || null,
        fechaLimite: data.fechaLimite || null,
        fechaInicioReal: data.fechaInicioReal || null,
        fechaFinReal: data.fechaFinReal || null,
        costoEstimado: parseFloat(data.costoEstimado) || 0,
        costoReal: parseFloat(data.costoReal) || 0,
        progreso: parseInt(data.progreso) || 0,
        descripcion: data.descripcion || null,
        tiempoEst: parseInt(data.tiempoEst) || 0,
        tiempoReal: parseInt(data.tiempoReal) || 0,
        valorHora: parseFloat(data.valorHora) || 0,
        notas: data.notas || null,
        propiedadId: data.propiedadId || null,
        asignadoId: data.asignadoId || null,
        activoId: data.activoId || null,
        centroCostoId: data.centroCostoId || null,
        esRecurrente: data.esRecurrente || false,
        formaPago: data.formaPago || null,
        // Campos de aprobación
        estadoAprobacion: data.estadoAprobacion,
        fechaSolicitudAprob: data.fechaSolicitudAprob,
        fechaAprobacion: data.fechaAprobacion,
        aprobadoPor: data.aprobadoPor,
        observacionesAprob: data.observacionesAprob,
      }
    })
    
    // Update materials if provided
    if (data.materiales !== undefined) {
      await db.oTMaterial.deleteMany({ where: { otId: id } })
      if (data.materiales.length > 0) {
        await db.oTMaterial.createMany({
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
    }
    
    // Update herramientas if provided
    if (data.herramientas !== undefined) {
      await db.oTHerramienta.deleteMany({ where: { otId: id } })
      if (data.herramientas.length > 0) {
        await db.oTHerramienta.createMany({
          data: data.herramientas.map((h: any) => ({
            nombre: h.nombre,
            cantidad: parseInt(h.cantidad) || 1,
            otId: id
          }))
        })
      }
    }
    
    // Update tareas if provided
    if (data.tareas !== undefined) {
      await db.oTTarea.deleteMany({ where: { otId: id } })
      if (data.tareas.length > 0) {
        await db.oTTarea.createMany({
          data: data.tareas.map((t: any) => ({
            descripcion: t.descripcion,
            cantidad: parseInt(t.cantidad) || 1,
            estado: t.estado || 'Pendiente',
            otId: id
          }))
        })
      }
    }
    
    // Update personal if provided
    if (data.personalOT !== undefined) {
      await db.oTPersonal.deleteMany({ where: { otId: id } })
      if (data.personalOT.length > 0) {
        await db.oTPersonal.createMany({
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
