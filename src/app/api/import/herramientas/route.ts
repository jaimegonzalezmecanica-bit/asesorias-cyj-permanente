import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Importar herramientas desde Excel/CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { herramientas } = body

    if (!Array.isArray(herramientas) || herramientas.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron datos de herramientas' },
        { status: 400 }
      )
    }

    let creadas = 0
    let actualizadas = 0
    const errores: string[] = []

    for (const herr of herramientas) {
      try {
        // Mapear campos del Excel a la base de datos
        const codigo = herr.Codigo || herr.Código || herr.codigo || herr.CODIGO || null
        const nombre = herr.Nombre || herr.nombre || herr.NOMBRE || herr.Herramienta || herr.herramienta
        const marca = herr.Marca || herr.marca || herr.MARCA || null
        const modelo = herr.Modelo || herr.modelo || herr.MODELO || null
        const cantidad = parseInt(herr.Cantidad || herr.cantidad || herr.CANTIDAD || '1') || 1
        const ubicacion = herr.Ubicacion || herr.Ubicación || herr.ubicacion || herr.UBICACION || null
        const estado = herr.Estado || herr.estado || herr.ESTADO || 'Bueno'
        const valorReposicion = parseFloat(herr.Valor || herr.ValorReposicion || herr.valor || herr.VALOR || '0') || 0
        const fechaAdquisicion = herr.FechaAdquisicion || herr.Fecha_Adquisicion || herr.fechaAdquisicion || herr.FECHA_ADQUISICION || null
        const descripcion = herr.Descripcion || herr.Descripción || herr.descripcion || herr.DESCRIPCION || null

        if (!nombre) {
          errores.push(`Fila ignorada: falta nombre de herramienta`)
          continue
        }

        // Validar estado
        const estadosValidos = ['Bueno', 'Regular', 'Malo', 'En reparación']
        const estadoNormalizado = estadosValidos.includes(estado) ? estado : 'Bueno'

        // Buscar si existe por código o nombre
        let existente = null
        if (codigo) {
          existente = await db.catHerramienta.findFirst({
            where: { codigo }
          })
        }
        if (!existente) {
          existente = await db.catHerramienta.findFirst({
            where: { nombre }
          })
        }

        if (existente) {
          // Actualizar existente
          await db.catHerramienta.update({
            where: { id: existente.id },
            data: {
              marca: marca || existente.marca,
              modelo: modelo || existente.modelo,
              cantidad: cantidad || existente.cantidad,
              ubicacion: ubicacion || existente.ubicacion,
              estado: estadoNormalizado,
              valorReposicion: valorReposicion || existente.valorReposicion,
              fechaAdquisicion: fechaAdquisicion || existente.fechaAdquisicion,
              descripcion: descripcion || existente.descripcion,
            }
          })
          actualizadas++
        } else {
          // Crear nueva
          await db.catHerramienta.create({
            data: {
              codigo,
              nombre,
              marca,
              modelo,
              cantidad,
              ubicacion,
              estado: estadoNormalizado,
              valorReposicion,
              fechaAdquisicion,
              descripcion,
            }
          })
          creadas++
        }
      } catch (error) {
        const nombreHerr = herr.Nombre || herr.nombre || herr.Herramienta || 'desconocida'
        errores.push(`Error con herramienta "${nombreHerr}": ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Importación completada: ${creadas} creadas, ${actualizadas} actualizadas`,
      creadas,
      actualizadas,
      errores: errores.length > 0 ? errores : undefined
    })

  } catch (error) {
    console.error('Error importing herramientas:', error)
    return NextResponse.json(
      { error: 'Error al importar herramientas' },
      { status: 500 }
    )
  }
}
