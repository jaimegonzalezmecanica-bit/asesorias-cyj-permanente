# Informe de Optimización Móvil: Gestión de Tareas en Órdenes de Trabajo

Este informe detalla la revisión, depuración, corrección y optimización del sistema de gestión de tareas dentro de las Órdenes de Trabajo (OT) para mejorar su usabilidad en dispositivos móviles. El objetivo principal fue implementar una interacción intuitiva mediante gestos de deslizamiento (swipe) para la actualización rápida de tareas.

## 1. Análisis de Funcionamiento Actual

El sistema de Órdenes de Trabajo, desarrollado con Next.js y React, gestionaba las tareas de la siguiente manera:

-   **Visualización**: Las tareas se presentaban en una tabla dentro de un componente `Dialog` (modal) de Radix UI, accesible desde el detalle de una OT.
-   **Interacción**: Para actualizar una tarea, el usuario debía abrir el diálogo de edición de la OT, navegar a la pestaña "Tareas", localizar la tarea específica y modificar su estado o cumplimiento mediante un `Select` o `Checkbox`. 
-   **Persistencia**: Los cambios se guardaban de forma colectiva al presionar el botón "Guardar" de la OT, lo que enviaba una solicitud `PUT` a la API `/api/ordenes-trabajo/[id]` con todos los datos de la orden.

Aunque funcional, este enfoque presentaba una **alta fricción de usuario** en entornos móviles, donde el espacio de pantalla es limitado y la interacción táctil requiere flujos más directos y gestuales.

## 2. Detección de Errores y Oportunidades de Mejora

Durante el análisis, se identificaron los siguientes puntos críticos y áreas de mejora:

1.  **Experiencia de Usuario (UX) Móvil Deficiente**: El proceso de múltiples clics y navegación por pestañas para actualizar una tarea era engorroso para técnicos en terreno que necesitan una interacción rápida y eficiente. La interfaz no aprovechaba los patrones de interacción nativos de los dispositivos móviles.
2.  **Falta de Trazabilidad en Incumplimientos**: No existía un mecanismo directo para registrar el motivo por el cual una tarea no se cumplía. Las justificaciones debían consignarse en el campo de notas general de la OT, lo que dificultaba el seguimiento y análisis de problemas específicos por tarea.
3.  **Riesgo de Pérdida de Datos y Race Conditions**: La actualización de tareas a través de la API `PUT` de la OT completa implicaba enviar todos los datos de la orden. Esto generaba dos riesgos principales:
    *   **Pérdida de Progreso**: Si un usuario realizaba cambios en una tarea y la aplicación se cerraba o la conexión se perdía antes de guardar la OT completa, los cambios de la tarea se perdían.
    *   **Race Conditions**: En un escenario multiusuario, si dos técnicos editaban la misma OT simultáneamente, los cambios de uno podrían sobreescribir los del otro, especialmente si solo se modificaba una pequeña parte de la OT.
4.  **Acoplamiento y Complejidad del Componente**: El componente `OrdenesTrabajoModule` era excesivamente grande (más de 1800 líneas), manejando la lógica de toda la OT, incluyendo materiales, herramientas, personal y tareas. Esto dificultaba la lectura, el mantenimiento y la escalabilidad, además de impactar el rendimiento de renderizado.

## 3. Reparación y Optimización

Para abordar los problemas identificados, se implementaron las siguientes soluciones:

### 3.1. Nuevo Endpoint de API para Tareas Individuales

Se creó un nuevo endpoint `PATCH` en `/api/ordenes-trabajo/tareas` para permitir la actualización atómica de tareas individuales. Este endpoint recibe el `id` de la tarea, su nuevo `estado`, `cumple` (booleano) y opcionalmente `notas`.

```typescript
// src/app/api/ordenes-trabajo/tareas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@prisma/client'

// PATCH - Actualizar una sola tarea de una OT (optimización móvil)
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, estado, cumple, notas } = data

    if (!id) {
      return NextResponse.json({ error: 'ID de tarea es requerido' }, { status: 400 })
    }

    // 1. Actualizar la tarea en la base de datos
    const tarea = await db.oTTarea.update({
      where: { id },
      data: {
        estado: estado || undefined,
        cumple: cumple !== undefined ? cumple : undefined,
      },
      include: { ot: { include: { tareas: true, materiales: true, personalOT: true, herramientas: true } } }
    })

    // 2. Recalcular el progreso de la Orden de Trabajo
    const ot = tarea.ot
    let totalItems = 0
    let itemsCompletados = 0

    // Lógica de cálculo de progreso basada en todas las tareas, materiales, personal y herramientas
    // ... (código de cálculo de progreso)

    const nuevoProgreso = totalItems === 0 ? ot.progreso : Math.round((itemsCompletados / totalItems) * 100)

    // 3. Actualizar la OT con el nuevo progreso y las notas (si existen)
    await db.ordenTrabajo.update({
      where: { id: ot.id },
      data: { 
        progreso: nuevoProgreso,
        notas: notas ? (ot.notas ? `${ot.notas}\n[Tarea: ${tarea.descripcion}]: ${notas}` : `[Tarea: ${tarea.descripcion}]: ${notas}`) : undefined
      }
    })

    return NextResponse.json({ 
      success: true, 
      tarea: { id: tarea.id, estado: tarea.estado, cumple: tarea.cumple },
      nuevoProgreso 
    })
  } catch (error) {
    console.error('Error actualizando tarea:', error)
    return NextResponse.json({ error: 'Error al actualizar la tarea' }, { status: 500 })
  }
}
```

### 3.2. Componente `MobileTaskItem` con Gestos de Swipe

Se creó un nuevo componente `MobileTaskItem.tsx` que encapsula la lógica de interacción táctil para cada tarea individual. Este componente utiliza `framer-motion` para manejar los gestos de deslizamiento y `vaul` (Drawer) para la entrada de notas.

```typescript
// src/components/ordenes-trabajo/MobileTaskItem.tsx
'use client'

import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Check, X, Info, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ... (Interfaces OTTarea y MobileTaskItemProps)

export const MobileTaskItem: React.FC<MobileTaskItemProps> = ({ tarea, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [nota, setNota] = useState('')
  
  const x = useMotionValue(0) // Controla la posición horizontal del swipe
  const background = useTransform(x, [-100, 0, 100], ['rgba(239, 68, 68, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(34, 197, 94, 0.2)']) // Cambia color de fondo
  const checkOpacity = useTransform(x, [20, 80], [0, 1]) // Opacidad del icono de check
  const xOpacity = useTransform(x, [-80, -20], [1, 0]) // Opacidad del icono de X

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = 100
    
    if (info.offset.x > threshold) { // Swipe Derecha -> Completar
      setLoading(true)
      try {
        await onUpdate(tarea.id, { estado: 'Completado', cumple: true })
        toast.success('Tarea completada')
      } catch (e) {
        toast.error('Error al actualizar tarea')
      } finally {
        setLoading(false)
        x.set(0) // Restablecer posición
      }
    } else if (info.offset.x < -threshold) { // Swipe Izquierda -> No cumplida (abrir nota)
      setDrawerOpen(true)
      x.set(0) // Restablecer posición
    } else { // Reset si no llega al umbral
      x.set(0)
    }
  }

  const handleConfirmNoCumple = async () => {
    if (!nota.trim()) {
      toast.error('Por favor, indica el motivo')
      return
    }
    
    setLoading(true)
    try {
      await onUpdate(tarea.id, { estado: 'Completado', cumple: false, notas: nota })
      toast.info('Tarea marcada como no cumplida')
      setDrawerOpen(false)
      setNota('')
    } catch (e) {
      toast.error('Error al actualizar tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border mb-2 bg-white select-none">
        {/* Capa de fondo con iconos */}
        <motion.div style={{ background }} className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <motion.div style={{ opacity: checkOpacity }} className="flex items-center gap-2 text-green-600 font-bold">
            <Check className="w-6 h-6" /> Completar
          </motion.div>
          <motion.div style={{ opacity: xOpacity }} className="flex items-center gap-2 text-red-600 font-bold">
            No cumple <X className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* Item deslizable */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -150, right: 150 }}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className="relative z-10 bg-white p-4 flex items-center justify-between active:cursor-grabbing"
        >
          {/* ... (Contenido de la tarea: descripción, badges de estado, etc.) */}
        </motion.div>
      </div>

      {/* Drawer para capturar la nota del motivo */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {/* ... (Contenido del Drawer: título, descripción, Textarea para notas, botones) */}
        </DrawerContent>
      </Drawer>
    </>
  )
}
```

### 3.3. Integración en `OrdenesTrabajoModule.tsx`

El componente `OrdenesTrabajoModule.tsx` fue modificado para:

-   **Importar `MobileTaskItem` y `toast`**: Se añadieron las importaciones necesarias.
-   **Función `handleUpdateTareaIndividual`**: Se creó una función asíncrona para manejar la llamada al nuevo endpoint `PATCH` y actualizar el estado local de la OT y sus tareas, así como el progreso general, sin recargar toda la OT. Esto asegura una experiencia de usuario fluida y reactiva.
-   **Renderizado Condicional**: La sección de tareas ahora renderiza de forma diferente según el tamaño de la pantalla:
    *   En pantallas pequeñas (`md:hidden`), utiliza el `MobileTaskItem` para cada tarea, permitiendo la interacción con swipe.
    *   En pantallas grandes (`hidden md:block`), mantiene la tabla clásica para una visualización más densa y edición tradicional.

```typescript
// src/components/ordenes-trabajo/OrdenesTrabajoModule.tsx (extractos)
import { useSession } from '@/hooks/use-session'
import { MobileTaskItem } from './MobileTaskItem' // [MODIFICADO] Nueva importación
import { toast } from 'sonner' // [MODIFICADO] Nueva importación

// ... (otras interfaces y estados)

  const handleUpdateTareaIndividual = async (tareaId: string, updates: Partial<OTTarea> & { notas?: string }) => { // [MODIFICADO] Nueva función
    try {
      const res = await fetch('/api/ordenes-trabajo/tareas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tareaId, ...updates })
      })
      
      if (!res.ok) throw new Error('Error al actualizar tarea')
      
      const data = await res.json()
      
      // Actualizar estado local para reflejar cambios sin recargar todo
      if (selectedOT) {
        const updatedTareas = selectedOT.tareas.map(t => 
          t.id === tareaId ? { ...t, ...data.tarea } : t
        )
        const updatedOT = { 
          ...selectedOT, 
          tareas: updatedTareas, 
          progreso: data.nuevoProgreso 
        }
        setSelectedOT(updatedOT)
        
        // También actualizar en la lista general
        setOrdenes(prev => prev.map(o => o.id === selectedOT.id ? updatedOT : o))
      }
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

// ... (otras funciones y JSX)

                {/* Tasks */}
                {selectedOT.tareas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" /> Tareas ({selectedOT.tareas.length})
                    </h4>
                    
                    {/* Vista móvil: Swipe items */}
                    <div className="md:hidden space-y-1"> // [MODIFICADO] Renderizado condicional para móvil
                      <p className="text-[10px] text-slate-400 mb-2 italic">Desliza derecha para completar, izquierda para no cumple.</p>
                      {selectedOT.tareas.map(t => (
                        <MobileTaskItem 
                          key={t.id} 
                          tarea={t} 
                          onUpdate={handleUpdateTareaIndividual} 
                        />
                      ))}
                    </div>

                    {/* Vista desktop: Tabla clásica */}
                    <div className="hidden md:block overflow-hidden rounded-lg border"> // [MODIFICADO] Renderizado condicional para desktop
                      <table className="w-full text-xs">
                        {/* ... (Tabla de tareas existente) */}
                      </table>
                    </div>
                  </div>
                )}
```

## 4. Casos de Prueba (Testing)

Para validar la nueva funcionalidad, se diseñaron y simularon los siguientes casos de prueba:

### Caso 1: Flujo Normal (Completar Tarea)

-   **Objetivo**: Verificar que el técnico puede completar una tarea rápidamente mediante un gesto de swipe a la derecha.
-   **Entrada (Input)**:
    -   Usuario en dispositivo móvil visualizando el detalle de una OT.
    -   Gesto: Deslizar el item "Revisión de tableros" hacia la **derecha** más de 100px.
-   **Acción del Sistema (Simulada)**:
    -   El componente `MobileTaskItem` detecta el swipe.
    -   Llama a `handleUpdateTareaIndividual` con `{ id: 
