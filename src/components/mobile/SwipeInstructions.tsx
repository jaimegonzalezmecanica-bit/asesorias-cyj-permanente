/**
 * Componente visual que muestra cómo usar los gestos de swipe
 */

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, X, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeInstructionsProps {
  onDismiss?: () => void;
}

// Check if we're in browser and if instructions were shown before
function getShouldShowInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  const shown = localStorage.getItem('swipe-instructions-shown');
  return !shown;
}

export function SwipeInstructions({ onDismiss }: SwipeInstructionsProps) {
  const [visible, setVisible] = useState(getShouldShowInstructions);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('swipe-instructions-shown', 'true');
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hand className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Gestos Rápidos</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Swipe izquierda */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
              <span>←</span>
              <span>Desliza izquierda</span>
            </div>
            <p className="text-[10px] text-green-600 dark:text-green-500">Marcar completada</p>
          </div>
        </div>

        {/* Swipe derecha */}
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
              <span>Desliza derecha</span>
              <span>→</span>
            </div>
            <p className="text-[10px] text-red-600 dark:text-red-500">Reportar problema</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Toca una tarjeta para ver más detalles
      </p>
    </div>
  );
}
