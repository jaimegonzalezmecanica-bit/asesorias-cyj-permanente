/**
 * Middleware de Protección de Rutas
 * Servicios Integrales - Sistema de Gestión v2
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/', // Landing page pública
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/callback',
  '/api/auth/providers',
  '/api/auth/csrf',
];

// Rutas de API que requieren autenticación
const PROTECTED_API_PREFIXES = [
  '/api/residentes',
  '/api/propiedades',
  '/api/personal',
  '/api/proveedores',
  '/api/ordenes-trabajo',
  '/api/proyectos',
  '/api/gastos',
  '/api/inspecciones',
  '/api/activos',
  '/api/catalogos',
  '/api/centros-costo',
  '/api/dashboard',
  '/api/caja-chica',
  '/api/pdf',
  '/api/usuarios',
  '/api/espacios-comunes',
  '/api/reservas',
  '/api/ubicaciones',
];

// Rutas de páginas que requieren autenticación
const PROTECTED_PAGE_PREFIXES = [
  '/sistema',
];

// Verificar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    return pathname === route || pathname.startsWith(route + '/');
  });
}

// Verificar si una ruta de API necesita protección
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

// Verificar si una página necesita protección
function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir archivos estáticos y recursos del sistema
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/icons') ||
    /\.\w+$/.test(pathname) // Archivos con extensión
  ) {
    return NextResponse.next();
  }

  // Permitir rutas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Obtener token de sesión de las cookies
  const sessionToken = request.cookies.get('condominio_session')?.value;

  // Verificar si es ruta protegida (API o página)
  const isProtected = isProtectedApiRoute(pathname) || isProtectedPage(pathname);

  if (!isProtected) {
    return NextResponse.next();
  }

  // Si no hay token y es una ruta protegida
  if (!sessionToken) {
    // Si es API, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autenticado', authenticated: false },
        { status: 401 }
      );
    }

    // Si es página, redirigir a login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    if (pathname.startsWith('/sistema')) {
      loginUrl.searchParams.set('sistema', 'true');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Token presente: permitir el paso (la validación completa se hace en la API)
  // Nota: La verificación profunda en DB se hace en cada route handler
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
