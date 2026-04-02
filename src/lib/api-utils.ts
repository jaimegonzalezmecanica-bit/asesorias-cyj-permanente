/**
 * Middleware de Autenticación para API Routes
 * Condominio Laguna Norte - Sistema de Gestión v2
 * CORREGIDO: Funciones reutilizables para verificar autenticación
 */

import { NextResponse } from 'next/server'
import { getCurrentSession, hasPermission, SessionData } from '@/lib/auth'

// CORREGIDO: Interfaz para opciones de autenticación
export interface AuthOptions {
  requireAuth?: boolean
  requiredPermission?: string
  allowRoles?: string[]
}

// CORREGIDO: Tipo para respuesta de autenticación
export type AuthResult = 
  | { success: true; session: SessionData }
  | { success: false; response: NextResponse }

/**
 * Verifica la autenticación y permisos para una API Route
 * @param options Opciones de autenticación
 * @returns Sesión del usuario o respuesta de error
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await withAuth({ requiredPermission: 'usuarios.ver' })
 *   if (!auth.success) return auth.response
 *   
 *   // auth.session contiene la sesión del usuario
 *   const data = await db.user.findMany()
 *   return NextResponse.json(data)
 * }
 */
export async function withAuth(options: AuthOptions = {}): Promise<AuthResult> {
  const { requireAuth = true, requiredPermission, allowRoles } = options
  
  // Verificar si se requiere autenticación
  if (!requireAuth) {
    return { success: true, session: null as unknown as SessionData }
  }
  
  // Obtener sesión actual
  const session = await getCurrentSession()
  
  // Verificar que existe sesión
  if (!session) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'No autenticado',
          authenticated: false,
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
  }
  
  // Verificar permiso específico si se requiere
  if (requiredPermission && !hasPermission(session.user.rol, requiredPermission)) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'No tiene permisos para realizar esta acción',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }
  }
  
  // Verificar roles permitidos si se especifican
  if (allowRoles && allowRoles.length > 0 && !allowRoles.includes(session.user.rol)) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'No tiene el rol necesario para esta acción',
          code: 'FORBIDDEN_ROLE'
        },
        { status: 403 }
      )
    }
  }
  
  return { success: true, session }
}

/**
 * Wrapper para API Routes que maneja autenticación automáticamente
 * @param handler Handler de la API Route
 * @param options Opciones de autenticación
 * @returns API Route handler con autenticación
 * 
 * @example
 * export const GET = apiRoute(
 *   async (request, { session }) => {
 *     const data = await db.user.findMany()
 *     return NextResponse.json(data)
 *   },
 *   { requiredPermission: 'usuarios.ver' }
 * )
 */
export function apiRoute<T = unknown>(
  handler: (
    request: Request,
    context: { session: SessionData; params?: T }
  ) => Promise<NextResponse> | NextResponse,
  options: AuthOptions = {}
) {
  return async (request: Request, context?: { params?: T }) => {
    const auth = await withAuth(options)
    
    if (!auth.success) {
      return auth.response
    }
    
    return handler(request, {
      session: auth.session,
      params: context?.params
    })
  }
}

/**
 * Validación de entrada con Zod-like validation (sin dependencia externa)
 * @param data Datos a validar
 * @param schema Esquema de validación
 * @returns Datos validados o error
 */
export function validateInput<T extends Record<string, unknown>>(
  data: unknown,
  schema: {
    [K in keyof T]?: {
      required?: boolean
      type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
      min?: number
      max?: number
      pattern?: RegExp
      enum?: unknown[]
      transform?: (value: unknown) => unknown
    }
  }
): { success: true; data: T } | { success: false; errors: string[] } {
  const errors: string[] = []
  const result: Record<string, unknown> = {}
  
  if (typeof data !== 'object' || data === null) {
    return { success: false, errors: ['Los datos deben ser un objeto'] }
  }
  
  const inputData = data as Record<string, unknown>
  
  for (const [key, rules] of Object.entries(schema)) {
    let value = inputData[key]
    
    // Aplicar transformación si existe
    if (rules.transform && value !== undefined) {
      value = rules.transform(value)
    }
    
    // Verificar si es requerido
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`El campo '${key}' es requerido`)
      continue
    }
    
    // Si no es requerido y está vacío, continuar
    if (value === undefined || value === null || value === '') {
      result[key] = value
      continue
    }
    
    // Verificar tipo
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== rules.type) {
        errors.push(`El campo '${key}' debe ser de tipo ${rules.type}`)
        continue
      }
    }
    
    // Verificar mínimo
    if (rules.min !== undefined) {
      if (typeof value === 'string' && value.length < rules.min) {
        errors.push(`El campo '${key}' debe tener al menos ${rules.min} caracteres`)
      } else if (typeof value === 'number' && value < rules.min) {
        errors.push(`El campo '${key}' debe ser mayor o igual a ${rules.min}`)
      } else if (Array.isArray(value) && value.length < rules.min) {
        errors.push(`El campo '${key}' debe tener al menos ${rules.min} elementos`)
      }
    }
    
    // Verificar máximo
    if (rules.max !== undefined) {
      if (typeof value === 'string' && value.length > rules.max) {
        errors.push(`El campo '${key}' no puede exceder ${rules.max} caracteres`)
      } else if (typeof value === 'number' && value > rules.max) {
        errors.push(`El campo '${key}' no puede ser mayor a ${rules.max}`)
      } else if (Array.isArray(value) && value.length > rules.max) {
        errors.push(`El campo '${key}' no puede tener más de ${rules.max} elementos`)
      }
    }
    
    // Verificar patrón
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`El campo '${key}' no tiene el formato correcto`)
    }
    
    // Verificar enum
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`El campo '${key}' debe ser uno de: ${rules.enum.join(', ')}`)
    }
    
    result[key] = value
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return { success: true, data: result as T }
}

/**
 * Helper para respuestas de error consistentes
 */
export const ApiError = {
  badRequest: (message: string, details?: unknown) => 
    NextResponse.json({ error: message, details }, { status: 400 }),
  
  unauthorized: (message: string = 'No autenticado') => 
    NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 }),
  
  forbidden: (message: string = 'No tiene permisos') => 
    NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 }),
  
  notFound: (resource: string = 'Recurso') => 
    NextResponse.json({ error: `${resource} no encontrado` }, { status: 404 }),
  
  conflict: (message: string) => 
    NextResponse.json({ error: message, code: 'CONFLICT' }, { status: 409 }),
  
  internal: (message: string = 'Error interno del servidor') => 
    NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 }),
}
