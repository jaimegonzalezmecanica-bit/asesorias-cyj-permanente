'use client'

import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Check, X, Info, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface OTTarea {
  id: string
  descripcion: string
  cantidad: number
  estado: string
  cumple: boolean | null
}

interface MobileTaskItemProps {
  tarea: OTTarea
  onUpdate: (id: string, updates: Partial<OTTarea> & { notas?: string }) => Promise<void>
}

export const MobileTaskItem: React.FC<MobileTaskItemProps> = ({ tarea, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [nota, setNota] = useState('')
  
  // Motion values para el gesto de swipe
  const x = useMotionValue(0)
  
  // Colores de fondo según la dirección del swipe
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239, 68, 68, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(34, 197, 94, 0.2)']
  )
  
  // Opacidad de los iconos
  const checkOpacity = useTransform(x, [20, 80], [0, 1])
  const xOpacity = useTransform(x, [-80, -20], [1, 0])

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = 100
    
    if (info.offset.x > threshold) {
      // Swipe Derecha -> Completar
      setLoading(true)
      try {
        await onUpdate(tarea.id, { estado: 'Completado', cumple: true })
        toast.success('Tarea completada')
      } catch (e) {
        toast.error('Error al actualizar tarea')
      } finally {
        setLoading(false)
        x.set(0)
      }
    } else if (info.offset.x < -threshold) {
      // Swipe Izquierda -> No cumplida (abrir nota)
      setDrawerOpen(true)
      x.set(0)
    } else {
      // Reset si no llega al umbral
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
        <motion.div 
          style={{ background }}
          className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none"
        >
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{tarea.descripcion}</span>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] py-0 h-4">Cant: {tarea.cantidad}</Badge>
              <Badge 
                className={`text-[10px] py-0 h-4 ${
                  tarea.estado === 'Completado' ? 'bg-green-100 text-green-700' : 
                  tarea.estado === 'En Progreso' ? 'bg-blue-100 text-blue-700' : 
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                {tarea.estado}
              </Badge>
              {tarea.cumple !== null && (
                <Badge className={`text-[10px] py-0 h-4 ${tarea.cumple ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {tarea.cumple ? 'Cumple' : 'No cumple'}
                </Badge>
              )}
            </div>
          </div>
          <Info className="w-4 h-4 text-slate-300 ml-2" />
        </motion.div>
      </div>

      {/* Drawer para capturar la nota del motivo */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Motivo de Incumplimiento</DrawerTitle>
              <DrawerDescription>Indica por qué no se pudo cumplir la tarea: "{tarea.descripcion}"</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <Textarea 
                placeholder="Ej: Falta de material, acceso denegado, etc."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            </div>
            <DrawerFooter>
              <Button onClick={handleConfirmNoCumple} disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                Confirmar No Cumplimiento
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
