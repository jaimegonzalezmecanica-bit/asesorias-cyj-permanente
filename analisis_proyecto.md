# Análisis del Proyecto - Asesorías Integrales CYJ

## Stack Tecnológico
- Next.js 16 + React 19
- TypeScript
- Prisma ORM + SQLite/PostgreSQL
- NextAuth.js v4
- TailwindCSS v4
- Zustand (state management)
- shadcn/ui components

## ERRORES CRÍTICOS IDENTIFICADOS

### 1. layout.tsx - Error de sintaxis JSX (CRÍTICO)
```tsx
// INCORRECTO - falta el cierre del atributo className en <body>
<body
  className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
  {children}   // ← ERROR: children está fuera de la etiqueta body, no hay ">"
  <Toaster position="top-right" />
</body>

// CORRECTO
<body className={`...`}>
  {children}
  <Toaster position="top-right" />
</body>
```

### 2. Sidebar.tsx - Errores de sintaxis JSX (CRÍTICO)
```tsx
// INCORRECTO - falta ">" en el botón y en DropdownMenuContent
<button
  key={item.id}
  onClick={() => setCurrentModule(item.id)}
  className={cn(...)}
  // ← Falta ">" aquí
  {item.icon}
  <span className="truncate">{item.label}</span>
</button>

// INCORRECTO - DropdownMenuTrigger Button sin ">"
<Button
  variant="ghost"
  className="..."
  // ← Falta ">" aquí
  <Avatar ...>

// INCORRECTO - DropdownMenuContent sin ">"
<DropdownMenuContent
  align="end"
  className="..."
  // ← Falta ">" aquí
  <div className="...">

// INCORRECTO - DropdownMenuItem sin ">"
<DropdownMenuItem
  className="..."
  onClick={() => setCurrentModule('usuarios')}
  // ← Falta ">" aquí
  <Users ...>

// INCORRECTO - DropdownMenuItem de logout sin ">"
<DropdownMenuItem
  className="..."
  onClick={handleLogout}
  // ← Falta ">" aquí
  <LogOut ...>
```

### 3. login/page.tsx - Error de sintaxis JSX (CRÍTICO)
```tsx
// INCORRECTO - button sin ">"
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="..."
  tabIndex={-1}
  // ← Falta ">" aquí
  {showPassword ? (
    <EyeOff className="h-4 w-4" />
  ) : (
    <Eye className="h-4 w-4" />
  )}
</button>
```

### 4. next.config.ts - TypeScript errors ignorados (PROBLEMA DE CALIDAD)
```ts
typescript: {
  ignoreBuildErrors: true,  // ← Oculta errores reales de TypeScript
}
```

### 5. db.ts - Logging en producción (PROBLEMA DE RENDIMIENTO)
```ts
new PrismaClient({
  log: ['query'],  // ← Loggea TODAS las queries en producción, impacto de rendimiento
})
```

### 6. API Routes - Sin autenticación en la mayoría (SEGURIDAD CRÍTICA)
Las siguientes APIs no verifican autenticación:
- /api/ordenes-trabajo
- /api/gastos
- /api/residentes
- /api/personal
- /api/propiedades
- /api/activos
- /api/proveedores
- /api/proyectos
- /api/inspecciones
- /api/reservas
- /api/centros-costo
- /api/catalogos
- /api/dashboard

### 7. API de gastos - Condición de carrera en caja chica (BUG)
```ts
// En route.ts POST y PUT - no es atómico
const caja = await db.cajaChica.findFirst()
if (caja) {
  await db.cajaChica.update({
    where: { id: caja.id },
    data: { saldo: caja.saldo - monto }  // ← Race condition
  })
}
// CORRECTO: usar db.$transaction o update con decrement
```

### 8. API de reservas - Generación de código con race condition (BUG)
```ts
const count = await db.reserva.count()
const codigo = `RES-${String(count + 1).padStart(6, '0')}`
// ← Si dos usuarios crean reservas simultáneamente, pueden tener el mismo código
```

### 9. Codificación de caracteres - Problema UTF-8 (VISUAL)
Múltiples archivos muestran caracteres mal codificados:
- "GestiÃ³n" en lugar de "Gestión"
- "AdministraciÃ³n" en lugar de "Administración"
- "â€"" en lugar de "—"
- "Â©" en lugar de "©"
Esto indica que los archivos están guardados en UTF-8 pero se leen como Latin-1

### 10. API de usuarios - session.userId no existe (BUG)
```ts
creadoPor: session.userId,  // ← session.userId no existe, debería ser session.user.id
```

### 11. Módulo de gastos - Texto mal codificado en colores
```ts
const categoriaColors: Record<string, string> = {
  'AdministraciÃ³n': 'bg-blue-100 text-blue-700',  // ← Nunca coincidirá
  'Ãreas Verdes': 'bg-green-100 text-green-700',    // ← Nunca coincidirá
}
```

### 12. Dashboard API - Carga de todos los registros sin paginación (RENDIMIENTO)
```ts
db.propiedades.findMany()  // Sin límite - puede traer miles de registros
db.residentes.findMany()   // Sin límite
db.gastos.findMany()       // Sin límite - para calcular totales
```

### 13. next.config.ts - reactStrictMode: false (MALA PRÁCTICA)
```ts
reactStrictMode: false,  // ← Desactiva detección de problemas en desarrollo
```

## MEJORAS IMPLEMENTADAS

1. Corregir errores de sintaxis JSX en layout.tsx, Sidebar.tsx, login/page.tsx
2. Corregir bug session.userId → session.user.id en usuarios API
3. Corregir codificación de caracteres en categoriaColors y estadoColors
4. Mejorar db.ts para no loggear queries en producción
5. Mejorar next.config.ts (reactStrictMode: true, no ignorar errores TS)
6. Agregar middleware de autenticación para proteger APIs
7. Corregir race condition en caja chica usando transacciones
8. Corregir race condition en generación de código de reservas
9. Agregar paginación/límites en API de dashboard
10. Mejorar manejo de errores en APIs
