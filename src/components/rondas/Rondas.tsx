'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  QrCode, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  History,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PuntoRonda {
  id: string
  nombre: string
  ubicacion: string
  ultimaVisita: string | null
  qrToken: string
}

const mockPuntos: PuntoRonda[] = [
  {
    id: 'PUN-001',
    nombre: 'Acceso Principal Norte',
    ubicacion: 'Portón 1',
    ultimaVisita: '2026-03-25T14:30:00',
    qrToken: 'QR-TOKEN-123-ABC'
  },
  {
    id: 'PUN-002',
    nombre: 'Bodega Central',
    ubicacion: 'Subterráneo -1',
    ultimaVisita: '2026-03-25T15:15:00',
    qrToken: 'QR-TOKEN-456-DEF'
  },
  {
    id: 'PUN-003',
    nombre: 'Perímetro Este',
    ubicacion: 'Muro colindante',
    ultimaVisita: null,
    qrToken: 'QR-TOKEN-789-GHI'
  }
]

export default function Rondas() {
  const [puntos, setPuntos] = useState(mockPuntos)
  const [selectedPunto, setSelectedPunto] = useState<PuntoRonda | null>(null)
  const [activeTab, setActiveTab] = useState<'puntos' | 'historial'>('puntos')

  const refreshQR = (id: string) => {
    // Simular refresco de token dinámico (Req 8)
    setPuntos(prev => prev.map(p => 
      p.id === id ? { ...p, qrToken: `QR-REFRESHED-${Math.random().toString(36).substr(2, 9).toUpperCase()}` } : p
    ))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rondas de Seguridad</h1>
          <p className="text-sm text-slate-500">Gestión de puntos de control con QR dinámico</p>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <History className="mr-2 h-4 w-4" />
            Historial
          </button>
          <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Punto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lista de Puntos */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-blue-600" />
            Puntos de Control
          </h3>
          <div className="space-y-3">
            {puntos.map((punto) => (
              <div 
                key={punto.id}
                onClick={() => setSelectedPunto(punto)}
                className={cn(
                  "group flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer",
                  selectedPunto?.id === punto.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-100"
                )}
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "rounded-full p-2.5",
                    punto.ultimaVisita ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{punto.nombre}</p>
                    <p className="text-xs text-slate-500">{punto.ubicacion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">Última Visita</p>
                  <p className="text-xs font-bold text-slate-900">
                    {punto.ultimaVisita ? new Date(punto.ultimaVisita).toLocaleTimeString('es-CL') : 'Sin registros'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle y QR */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {selectedPunto ? (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">{selectedPunto.nombre}</h3>
                <button 
                  onClick={() => refreshQR(selectedPunto.id)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="flex flex-col items-center">
                  <QrCode className="h-32 w-32 text-slate-900" />
                  <p className="mt-4 font-mono text-xs font-bold text-slate-500">{selectedPunto.qrToken}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Frecuencia</p>
                  <p className="text-sm font-bold text-slate-900">Cada 2 horas</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ubicación GPS</p>
                  <p className="text-sm font-bold text-slate-900">-33.4489, -70.6693</p>
                </div>
              </div>

              <button className="w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                Descargar QR para Impresión
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-12 text-slate-400">
              <QrCode className="mb-4 h-16 w-16 opacity-20" />
              <p className="text-sm">Selecciona un punto para ver su código QR dinámico</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
