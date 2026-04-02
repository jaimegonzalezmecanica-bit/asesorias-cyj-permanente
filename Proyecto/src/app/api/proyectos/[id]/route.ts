import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get proyecto by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proyecto = await db.proyecto.findUnique({
      where: { id },
      include: {
        materiales: true,
        herramientas: true,
        tareas: true,
        personal: true,
      }
    })
    
    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto not found' }, { status: 404 })
    }
    
    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error fetching proyecto:', error)
    return NextResponse.json({ error: 'Error fetching proyecto' }, { status: 500 })
  }
}

// PUT - Update proyecto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const proyecto = await db.proyecto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        categoria: data.categoria,
        estado: data.estado,
        ubicacion: data.ubicacion,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        presProg: parseFloat(data.presProg) || 0,
        presUsado: parseFloat(data.presUsado) || 0,
        avance: parseInt(data.avance) || 0,
        descripcion: data.descripcion,
        notas: data.notas,
      }
    })
    
    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error updating proyecto:', error)
    return NextResponse.json({ error: 'Error updating proyecto' }, { status: 500 })
  }
}

// DELETE - Delete proyecto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.proyectoMaterial.deleteMany({ where: { proyectoId: id } })
    await db.proyectoHerramienta.deleteMany({ where: { proyectoId: id } })
    await db.proyectoTarea.deleteMany({ where: { proyectoId: id } })
    await db.proyectoPersonal.deleteMany({ where: { proyectoId: id } })
    
    await db.proyecto.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proyecto:', error)
    return NextResponse.json({ error: 'Error deleting proyecto' }, { status: 500 })
  }
}
