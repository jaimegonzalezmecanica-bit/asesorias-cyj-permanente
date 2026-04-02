/**
 * API de Logout
 * Servicios Integrales - Sistema de Gestión v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentSession, logAction, deleteSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (session) {
      // Registrar logout en logs
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logAction(
        session.userId, 
        'logout', 
        'User', 
        session.userId, 
        null, 
        null, 
        ip,
        userAgent
      );
    }
    
    // Eliminar sesión de la base de datos (invalidar token)
    if (session) {
      const cookieStore = await cookies();
      const token = cookieStore.get('condominio_session')?.value;
      if (token) {
        await deleteSession(token);
      }
    }
    
    // Limpiar cookie de sesión
    await clearSessionCookie();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
