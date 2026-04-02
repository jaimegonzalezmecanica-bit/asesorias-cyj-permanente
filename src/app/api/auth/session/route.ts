/**
 * API para obtener sesión actual
 * Condominio Laguna Norte - Sistema de Gestión v2
 */

import { NextResponse } from 'next/server';
import { getCurrentSession, getPermissions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // Los admin siempre tienen todos los permisos
    if (session.user.rol === 'admin') {
      const permisos = getPermissions(session.user.rol);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.nombre,
          apellido: session.user.apellido,
          rol: session.user.rol,
          permisos,
        },
      });
    }
    
    // Para otros roles, verificar si tiene permisos personalizados
    // Los permisos se guardan como JSON string de un array: '["ots.ver", "ots.crear"]'
    let permisosPersonalizados: string[] = [];
    
    if (session.user.permisos) {
      try {
        const parsed = JSON.parse(session.user.permisos);
        if (Array.isArray(parsed)) {
          permisosPersonalizados = parsed;
        }
      } catch {
        console.error('Error parseando permisos personalizados');
      }
    }
    
    // Si tiene permisos personalizados, usar esos
    // Si no tiene permisos personalizados, usar los del rol por defecto
    const permisos = permisosPersonalizados.length > 0 
      ? permisosPersonalizados 
      : getPermissions(session.user.rol);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        nombre: session.user.nombre,
        apellido: session.user.apellido,
        rol: session.user.rol,
        permisos,
      },
    });
    
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesión' },
      { status: 500 }
    );
  }
}
