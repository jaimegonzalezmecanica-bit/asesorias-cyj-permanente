/**
 * Hook de Sesión
 * Servicios Integrales - Sistema de Gestión v2
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function useSession() {
  const [session, setSession] = useState<Session>({
    authenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      if (response.ok) {
        const data = await response.json();
        setSession({
          authenticated: data.authenticated,
          user: data.user || null,
        });
      } else {
        setSession({
          authenticated: false,
          user: null,
        });
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession({
        authenticated: false,
        user: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    await fetchSession();
    return data;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({
      authenticated: false,
      user: null,
    });
  };

  const hasPermission = (permission: string): boolean => {
    if (!session.user) return false;
    return session.user.permisos.includes(permission);
  };

  const isAdmin = (): boolean => {
    return session.user?.rol === 'admin';
  };

  const isSupervisor = (): boolean => {
    return session.user?.rol === 'supervisor' || session.user?.rol === 'admin';
  };

  return {
    session,
    user: session.user,
    loading,
    authenticated: session.authenticated,
    login,
    logout,
    hasPermission,
    isAdmin,
    isSupervisor,
    refresh: fetchSession,
  };
}
