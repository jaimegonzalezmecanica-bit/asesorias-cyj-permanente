/**
 * Componente de tarjeta de OT con gestos de swipe para móvil
 * - Swipe izquierda: Marcar como completada
 * - Swipe derecha: Marcar con problemas (abre cuadro de notas)
 */

'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  MessageSquare,
  Calendar,
  User,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OTCardProps {
  ot: {
    id: string;
    otNum: string;
    titulo: string;
    descripcion?: string | null;
    prioridad: string;
    estado: string;
    tipo?: string;
    fechaLimite?: string | null;
    ubicacion?: string | null;
    asignado?: {
      nombre: string;
    } | null;
    progreso?: number;
  };
  onComplete: (id: string) => void;
  onProblem: (id: string, notes: string) => void;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  'Urgente': 'bg-red-500 text-white',
  'Alta': 'bg-orange-500 text-white',
  'Media': 'bg-amber-500 text-white',
  'Baja': 'bg-green-500 text-white',
};

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'En Progreso': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completado': 'bg-green-100 text-green-700 border-green-200',
  'Cancelado': 'bg-red-100 text-red-700 border-red-200',
};

export function SwipeableOTCard({ ot, onComplete, onProblem, onClick }: OTCardProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const startX = useRef(0);
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Limitar el swipe
    const limitedDiff = Math.max(-150, Math.min(150, diff));
    setSwipeX(limitedDiff);
    
    // Determinar dirección para feedback visual
    if (limitedDiff < -SWIPE_THRESHOLD) {
      setSwipeDirection('left');
    } else if (limitedDiff > SWIPE_THRESHOLD) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeX) > SWIPE_THRESHOLD) {
      if (swipeX < 0) {
        // Swipe izquierda = Completada
        onComplete(ot.id);
      } else {
        // Swipe derecha = Con problemas
        setShowNotesDialog(true);
      }
    }
    
    // Reset
    setIsSwiping(false);
    setSwipeX(0);
    setSwipeDirection(null);
  };

  const handleSaveNotes = () => {
    onProblem(ot.id, notes);
    setShowNotesDialog(false);
    setNotes('');
  };

  // Calcular opacidad de las acciones
  const completeOpacity = swipeX < 0 ? Math.min(Math.abs(swipeX) / 100, 1) : 0;
  const problemOpacity = swipeX > 0 ? Math.min(swipeX / 100, 1) : 0;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Fondo de acciones */}
        <div className="absolute inset-0 flex">
          {/* Acción izquierda: Completar (verde) */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-green-500 flex items-center justify-start pl-4 w-1/2"
            style={{ opacity: completeOpacity }}
          >
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium text-sm">Completar</span>
            </div>
          </div>
          
          {/* Acción derecha: Problemas (rojo) */}
          <div 
            className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center justify-end pr-4 w-1/2"
            style={{ opacity: problemOpacity }}
          >
            <div className="flex items-center gap-2 text-white">
              <span className="font-medium text-sm">Problemas</span>
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tarjeta principal */}
        <div
          className={cn(
            "relative bg-white dark:bg-slate-900 border rounded-xl p-4 transition-shadow cursor-pointer",
            isSwiping ? "shadow-lg" : "shadow-sm hover:shadow-md"
          )}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-start gap-3">
            {/* Indicador de prioridad */}
            <div className={cn(
              "w-1.5 h-full min-h-[80px] rounded-full shrink-0",
              ot.prioridad === 'Urgente' ? 'bg-red-500' :
              ot.prioridad === 'Alta' ? 'bg-orange-500' :
              ot.prioridad === 'Media' ? 'bg-amber-500' : 'bg-green-500'
            )} />

            <div className="flex-1 min-w-0" onClick={onClick}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {ot.otNum}
                    </span>
                    <Badge className={cn("text-[9px]", priorityColors[ot.prioridad] || 'bg-gray-500 text-white')}>
                      {ot.prioridad}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{ot.titulo}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>

              {/* Info */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {ot.ubicacion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ot.ubicacion}
                  </span>
                )}
                {ot.fechaLimite && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ot.fechaLimite).toLocaleDateString('es-CL')}
                  </span>
                )}
                {ot.asignado && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ot.asignado.nombre}
                  </span>
                )}
              </div>

              {/* Estado y progreso */}
              <div className="flex items-center justify-between mt-3">
                <Badge 
                  variant="outline" 
                  className={cn("text-[9px]", estadoColors[ot.estado] || 'bg-gray-100 text-gray-700')}
                >
                  {ot.estado}
                </Badge>
                
                {ot.progreso !== undefined && ot.progreso > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${ot.progreso}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {ot.progreso}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Indicadores de swipe */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1 opacity-30">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-30">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Dialog de notas */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Reportar Problema
            </DialogTitle>
            <DialogDescription>
              OT: {ot.otNum} - {ot.titulo}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">
                Describe el problema o comentario
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Faltan materiales, se necesita autorización adicional..."
                className="w-full min-h-[100px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNotesDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNotes}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Reportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente para lista móvil de OTs
interface MobileOTListProps {
  ordenes: OTCardProps['ot'][];
  onComplete: (id: string) => void;
  onProblem: (id: string, notes: string) => void;
  onOTClick?: (id: string) => void;
}

export function MobileOTList({ ordenes, onComplete, onProblem, onOTClick }: MobileOTListProps) {
  return (
    <div className="space-y-3 p-4">
      {ordenes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No hay órdenes de trabajo</p>
        </div>
      ) : (
        ordenes.map((ot) => (
          <SwipeableOTCard
            key={ot.id}
            ot={ot}
            onComplete={onComplete}
            onProblem={onProblem}
            onClick={() => onOTClick?.(ot.id)}
          />
        ))
      )}
    </div>
  );
}
