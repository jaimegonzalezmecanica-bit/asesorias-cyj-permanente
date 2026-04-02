/**
 * Página de Login
 * Asesorías Integrales CYJ - Sistema de Gestión
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

// Color principal azul
const PRIMARY_COLOR = '#1e40af';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sistema = searchParams.get('sistema');
  const redirect = searchParams.get('redirect') || (sistema ? '/sistema' : '/');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      // Redirigir a la página solicitada o al dashboard
      router.push(redirect);
      router.refresh();
      
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingrese sus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full text-white" style={{ backgroundColor: PRIMARY_COLOR }} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        {/* Demo Credentials (Solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Credenciales de prueba:
            </p>
            <div className="text-sm text-center space-y-1">
              <p><strong>Email:</strong> admin@condominio.com</p>
              <p><strong>Password:</strong> Admin123!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoginSkeleton() {
  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingrese sus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-4 shadow-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Asesorías Integrales CYJ" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Asesorías Integrales
          </h1>
          <p className="text-xl font-bold mt-1" style={{ color: PRIMARY_COLOR }}>
            CYJ
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Sistema de Gestión
          </p>
        </div>

        {/* Login Form with Suspense */}
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <a href="/" className="text-sm hover:underline" style={{ color: PRIMARY_COLOR }}>
            ← Volver al inicio
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          © {new Date().getFullYear()} Asesorías Integrales CYJ. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
