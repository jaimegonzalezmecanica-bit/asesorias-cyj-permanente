/**
 * Hook de Sesión Mejorado
 * Condominio Laguna Norte - Sistema de Gestión v2
 * CORREGIDO: Agregado refresh automático de sesión y mejor manejo de errores
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  rol: string;
  permisos: string[];
}

export interface Session {
  authenticated: boolean;
  user: User | null;
}

// CORREGIDO: Configuración de constantes
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
const SESSION_CHECK_DELAY = 100; // 100ms - Reducido para carga más rápida

export function useSession() {
  const [session, setSession] = useState<Session>({
    authenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // CORREGIDO: Usar ref para evitar race conditions en cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchSession = useCallback(async (showLoading = false) => {
    // CORREGIDO: Validar que el componente siga montado
    if (!isMountedRef.current) return;
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        // CORREGIDO: Evitar caché
        cache: 'no-store',
      });
      
      // CORREGIDO: Manejar respuestas no exitosas
      if (!response.ok) {
        if (response.status === 401) {
          setSession({ authenticated: false, user: null });
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // CORREGIDO: Validar estructura de respuesta
      if (!isMountedRef.current) return;
      
      setSession({
        authenticated: data.authenticated || false,
        user: data.user || null,
      });
      setError(null);
    } catch (err) {
      // CORREGIDO: Mejor manejo de errores
      console.error('Error fetching session:', err);
      
      if (!isMountedRef.current) return;
      
      setSession({
        authenticated: false,
        user: null,
      });
      
      // CORREGIDO: Solo mostrar error si no es error de red
      if (err instanceof Error && !err.message.includes('fetch')) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // CORREGIDO: Función para iniciar refresh automático
  const startAutoRefresh = useCallback(() => {
    // Limpiar intervalo existente
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Iniciar nuevo intervalo
    refreshIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && session.authenticated) {
        fetchSession(false); // Refresh silencioso
      }
    }, SESSION_REFRESH_INTERVAL);
  }, [fetchSession, session.authenticated]);

  // CORREGIDO: Efecto para cargar sesión inicial
  useEffect(() => {
    isMountedRef.current = true;
    
    // CORREGIDO: Timeout más corto para mejor UX
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        fetchSession(true);
      }
    }, SESSION_CHECK_DELAY);
    
    // CORREGIDO: Safety timeout - si después de 5 segundos no hay respuesta, dejar de cargar
    const safetyTimeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      clearTimeout(safetyTimeoutId);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchSession]);

  // CORREGIDO: Efecto para iniciar refresh automático cuando hay sesión
  useEffect(() => {
    if (session.authenticated) {
      startAutoRefresh();
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session.authenticated, startAutoRefresh]);

  const login = async (email: string, password: string) => {
    // CORREGIDO: Validar inputs antes de enviar
    if (!email || !email.trim()) {
      throw new Error('El email es requerido');
    }
    
    if (!password) {
      throw new Error('La contraseña es requerida');
    }
    
    // CORREGIDO: Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('El formato del email no es válido');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // CORREGIDO: Propagar error del servidor
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // CORREGIDO: Actualizar sesión y iniciar refresh
      await fetchSession(true);
      startAutoRefresh();
      
      return data;
    } catch (err) {
      // CORREGIDO: Manejar error y propagar
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // Ignorar errores de logout, limpiar sesión localmente de todas formas
      console.warn('Error during logout:', err);
    } finally {
      // CORREGIDO: Detener refresh automático
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      setSession({
        authenticated: false,
        user: null,
      });
      setError(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!session.user) return false;
    // Admin tiene acceso total
    if (session.user.rol === 'admin') return true;
    return session.user.permisos.includes(permission);
  };

  const isAdmin = (): boolean => {
    return session.user?.rol === 'admin';
  };

  const isSupervisor = (): boolean => {
    return session.user?.rol === 'supervisor' || session.user?.rol === 'admin';
  };

  const isPersonal = (): boolean => {
    return session.user?.rol === 'personal';
  };

  const canEditProgress = (): boolean => {
    // Personal solo puede editar progreso en OT
    return session.user?.rol === 'personal' || session.user?.rol === 'admin' || session.user?.rol === 'supervisor';
  };

  // CORREGIDO: Agregar función para limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    user: session.user,
    loading,
    error,
    authenticated: session.authenticated,
    login,
    logout,
    hasPermission,
    isAdmin,
    isSupervisor,
    isPersonal,
    canEditProgress,
    refresh: fetchSession,
    clearError,
  };
}
