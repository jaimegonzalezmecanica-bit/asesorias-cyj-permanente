/**
 * API de Gestión de Usuarios
 * Servicios Integrales - Sistema de Gestión v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  getCurrentSession, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserById,
  hasPermission,
  hashPassword,
  encrypt
} from '@/lib/auth';

// GET - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar permiso
    if (!hasPermission(session.user.rol, 'usuarios.ver')) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver usuarios' },
        { status: 403 }
      );
    }
    
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rut: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        ultimoAcceso: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(users);
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar permiso
    if (!hasPermission(session.user.rol, 'usuarios.crear')) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear usuarios' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { email, nombre, apellido, password, rut, telefono, direccion, rol } = body;
    
    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: 'Email, nombre y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    // Validar contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }
    
    const user = await createUser({
      email,
      nombre,
      apellido,
      password,
      rut,
      telefono,
      direccion,
      rol: rol || 'usuario',
      creadoPor: session.userId,
    });
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
