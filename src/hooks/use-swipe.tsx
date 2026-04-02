/**
 * Hook para detectar gestos de deslizamiento (swipe) en móviles
 * Soporta: swipeLeft, swipeRight, swipeUp, swipeDown
 */

'use client';

import { useCallback, useRef, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Distancia mínima para detectar swipe (default: 50px)
  preventDefaultTouch?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
  direction: SwipeDirection;
}

export function useSwipe(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouch = true,
  } = config;

  const [state, setState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
    direction: null,
  });

  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
      direction: null,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isSwiping) return;
    
    if (preventDefaultTouch) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // Determinar dirección predominante
    let direction: SwipeDirection = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > threshold / 2) {
        direction = deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Swipe vertical
      if (Math.abs(deltaY) > threshold / 2) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    setState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction,
    }));
  }, [state.isSwiping, state.startX, state.startY, threshold, preventDefaultTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!state.isSwiping) return;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;

    // Solo ejecutar si supera el threshold
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    setState(prev => ({
      ...prev,
      isSwiping: false,
      direction: null,
    }));
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Calcular el desplazamiento actual para animaciones
  const getSwipeOffset = useCallback(() => {
    if (!state.isSwiping) return 0;
    return state.currentX - state.startX;
  }, [state]);

  // Obtener la opacidad para feedback visual
  const getSwipeOpacity = useCallback((maxOffset: number = 100) => {
    if (!state.isSwiping) return 0;
    const offset = Math.abs(state.currentX - state.startX);
    return Math.min(offset / maxOffset, 1);
  }, [state]);

  return {
    elementRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping: state.isSwiping,
    direction: state.direction,
    getSwipeOffset,
    getSwipeOpacity,
    swipeState: state,
  };
}

// Componente wrapper para facilitar el uso
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold,
  className = '',
  style,
}: SwipeableProps) {
  const { elementRef, handlers, getSwipeOffset, isSwiping } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
  });

  const offset = getSwipeOffset();

  return (
    <div
      ref={elementRef}
      className={`touch-pan-y ${className}`}
      style={{
        ...style,
        transform: isSwiping ? `translateX(${offset * 0.3}px)` : 'translateX(0)',
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
      }}
      {...handlers}
    >
      {children}
    </div>
  );
}
