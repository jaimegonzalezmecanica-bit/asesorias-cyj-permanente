/**
 * API de Solicitudes de Mantenimiento del Portal de Residentes
 * Permite a los residentes crear y seguir solicitudes
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Tipos de solicitudes
const TIPOS_SOLICITUD = [
  'Mantenimiento',
  'Reparación',
  'Sugerencia',
  'Queja',
  'Otro',
];

// Helper para verificar sesión del portal
async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('portal_token')?.value;

  if (!token) return null;

  const acceso = await db.accesoPortal.findUnique({
    where: { token, activo: true },
    include: {
      residente: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          unidad: true,
        },
      },
    },
  });

  if (!acceso || (acceso.fechaExpiracion && acceso.fechaExpiracion < new Date())) {
    return null;
  }

  return acceso;
}

// GET - Obtener solicitudes del residente
export async function GET(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    const whereClause: { residenteId: string; estado?: string } = {
      residenteId: session.residenteId,
    };
    if (estado) whereClause.estado = estado;

    const solicitudes = await db.solicitudMantenimiento.findMany({
      where: whereClause,
      orderBy: { fechaSolicitud: 'desc' },
    });

    // Estadísticas
    const stats = {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'Pendiente').length,
      enProceso: solicitudes.filter(s => s.estado === 'En Proceso').length,
      resueltas: solicitudes.filter(s => s.estado === 'Resuelto').length,
    };

    return NextResponse.json({
      residente: session.residente,
      solicitudes,
      stats,
      tiposSolicitud: TIPOS_SOLICITUD,
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { titulo, descripcion, tipo, prioridad, ubicacion, fotos } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    const solicitud = await db.solicitudMantenimiento.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion || null,
        tipo: tipo || 'Mantenimiento',
        prioridad: prioridad || 'Normal',
        estado: 'Pendiente',
        ubicacion: ubicacion || session.residente.unidad,
        fotos: fotos ? JSON.stringify(fotos) : null,
        residenteId: session.residenteId,
      },
    });

    return NextResponse.json(solicitud);
  } catch (error) {
    console.error('Error creando solicitud:', error);
    return NextResponse.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}

// PUT - Agregar mensaje a la conversación o actualizar
export async function PUT(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, mensaje, accion } = body;

    // Verificar que la solicitud pertenece al residente
    const solicitud = await db.solicitudMantenimiento.findFirst({
      where: {
        id,
        residenteId: session.residenteId,
      },
    });

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (accion === 'agregar_mensaje' && mensaje) {
      // Obtener conversación existente
      const conversacionActual = solicitud.conversacion
        ? JSON.parse(solicitud.conversacion)
        : [];

      // Agregar nuevo mensaje
      const nuevoMensaje = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        autor: `${session.residente.nombre} ${session.residente.apellido || ''}`.trim(),
        esAdmin: false,
        mensaje,
      };

      const updated = await db.solicitudMantenimiento.update({
        where: { id },
        data: {
          conversacion: JSON.stringify([...conversacionActual, nuevoMensaje]),
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    return NextResponse.json(
      { error: 'Error al actualizar solicitud' },
      { status: 500 }
    );
  }
}
