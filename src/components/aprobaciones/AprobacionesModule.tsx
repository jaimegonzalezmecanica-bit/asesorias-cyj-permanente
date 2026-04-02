'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/hooks/use-session'
import { 
  Search, CheckCircle, XCircle, Clock, Eye,
  Users, Building2, Calendar, DollarSign, RefreshCw
} from 'lucide-react'
import { formatCLP, formatDate } from '@/lib/format'
import { toast } from 'sonner'

interface OrdenTrabajo {
  id: string
  otNum: string
  titulo: string
  tipo: string
  prioridad: string
  estado: string
  fechaSolicitudAprob: string | null
  costoEstimado: number
  costoReal: number
  progreso: number
  asignado: { nombre: string } | null
  centroCosto: { codigo: string } | null
  estadoAprobacion: string | null
}

export function AprobacionesModule() {
  const { user } = useSession()
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Pendiente')
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [actionType, setActionType] = useState<'aprobar' | 'rechazar'>('aprobar')
  const [observaciones, setObservaciones] = useState('')

  const fetchOrdenes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'all') params.append('estado', filtroEstado)
      if (search) params.append('search', search)
      const res = await fetch(`/api/aprobaciones-ot?${params.toString()}`)
      const data = await res.json()
      setOrdenes(data.ordenes || [])
    } catch (error) {
      console.error('Error fetching aprobaciones:', error)
    }
    setLoading(false)
  }, [filtroEstado, search])

  useEffect(() => {
    fetchOrdenes()
  }, [fetchOrdenes])

  const handleAction = async () => {
    if (!selectedOT) return
    try {
      const res = await fetch('/api/aprobaciones-ot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otId: selectedOT.id,
          accion: actionType,
          observaciones: observaciones || null,
          aprobadoPor: user?.id || null,
        }),
      })
      if (res.ok) {
        setActionDialogOpen(false)
        fetchOrdenes()
        toast.success(`OT ${actionType === 'aprobar' ? 'aprobada' : 'rechazada'} con éxito`)
      }
    } catch (error) {
      toast.error('Error al procesar acción')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar OT..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Pendiente">Pendientes</SelectItem>
            <SelectItem value="Aprobada">Aprobadas</SelectItem>
            <SelectItem value="Rechazada">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => fetchOrdenes()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Cargando...</div>
        ) : ordenes.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No hay órdenes para aprobar</div>
        ) : (
          ordenes.map((ot) => (
            <Card key={ot.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-blue-600">{ot.otNum}</span>
                    <Badge variant="outline" className={ot.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}>{ot.prioridad}</Badge>
                    <Badge variant="outline" className={ot.estadoAprobacion === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>{ot.estadoAprobacion || 'Pendiente'}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{ot.titulo}</h3>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-500 uppercase font-bold">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ot.asignado?.nombre || 'Sin asignar'}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {ot.centroCosto?.codigo || 'Sin CC'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(ot.fechaSolicitudAprob)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 border-l border-slate-100">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">Costo Est.</p>
                    <p className="font-mono font-bold text-slate-900">{formatCLP(ot.costoEstimado)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => { setSelectedOT(ot); setActionType('aprobar'); setActionDialogOpen(true); }}><CheckCircle className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => { setSelectedOT(ot); setActionType('rechazar'); setActionDialogOpen(true); }}><XCircle className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'aprobar' ? 'Aprobar' : 'Rechazar'} Orden de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-500">¿Estás seguro de que deseas {actionType} la OT <strong>{selectedOT?.otNum}</strong>?</p>
            <div className="space-y-2">
              <Label>Observaciones (opcional)</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Escribe el motivo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancelar</Button>
            <Button variant={actionType === 'aprobar' ? 'default' : 'destructive'} onClick={handleAction}>Confirmar {actionType === 'aprobar' ? 'Aprobación' : 'Rechazo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
