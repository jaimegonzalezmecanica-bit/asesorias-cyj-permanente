
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Pencil, Trash2, Search, Calendar as CalendarIcon, Users,
  Home, CheckCircle, XCircle, Clock, DollarSign, Download,
  ChevronLeft, ChevronRight, LayoutGrid, List, Paperclip, X, Upload, Eye
} from 'lucide-react'
import { formatCLP, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'

interface Residente {
  id: string
  nombre: string
  apellido?: string
  unidad?: string
}

interface Reserva {
  id: string
  titulo: string
  espacio: string
  fecha: string
  horaInicio: string
  horaFin: string
  residente: string
  unidad: string | null
  telefono: string | null
  email: string | null
  numPersonas: number
  estado: string
  monto: number
  pagado: boolean
  notas: string | null
  comprobante: string | null
  residenteId: string | null
}

const espaciosOptions = [
  'Quincho', 'Sala de Eventos', 'Piscina', 'Estacionamiento Visita',
  'Cancha Deportiva', 'Gimnasio', 'Sala de Reuniones', 'Parrilla', 'Otro'
]

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Confirmada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelada': 'bg-red-100 text-red-700 border-red-200',
  'Completada': 'bg-green-100 text-green-700 border-green-200',
}

export function ReservasModule() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [view, setView] = useState<'lista' | 'calendario'>('lista')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [formData, setFormData] = useState({
    titulo: '',
    espacio: 'Quincho',
    fecha: '',
    horaInicio: '09:00',
    horaFin: '18:00',
    residente: '',
    unidad: '',
    telefono: '',
    email: '',
    numPersonas: 1,
    estado: 'Pendiente',
    monto: 0,
    pagado: false,
    notas: '',
    comprobante: '', // URL del comprobante
    residenteId: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resReservas, resResidentes] = await Promise.all([
        fetch('/api/reservas'),
        fetch('/api/residentes'),
      ])
      setReservas(await resReservas.json())
      setResidentes(await resResidentes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const data = new FormData()
    data.append('file', file)
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: data,
      })
      if (!res.ok) throw new Error(await res.text())
      const { url } = await res.json()
      setFormData(prev => ({ ...prev, comprobante: url }))
      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleFileRemove = async (urlToRemove: string): Promise<boolean> => {
    // Implementar lógica para eliminar archivo del servidor si es necesario
    // Por ahora, solo lo eliminamos del estado local
    setFormData(prev => ({ ...prev, comprobante: '' }))
    return true
  }

  const handleSave = async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing ? `/api/reservas/${selectedReserva?.id}` : '/api/reservas'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchData()
        toast.success(`Reserva ${isEditing ? 'actualizada' : 'creada'} con éxito`)
      }
    } catch (error) {
      toast.error('Error al guardar reserva')
    }
  }

  const openEditDialog = (reserva: Reserva) => {
    setIsEditing(true)
    setSelectedReserva(reserva)
    setFormData({
      titulo: reserva.titulo,
      espacio: reserva.espacio,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      residente: reserva.residente,
      unidad: reserva.unidad || '',
      telefono: reserva.telefono || '',
      email: reserva.email || '',
      numPersonas: reserva.numPersonas,
      estado: reserva.estado,
      monto: reserva.monto,
      pagado: reserva.pagado,
      notas: reserva.notas || '',
      comprobante: reserva.comprobante || '',
      residenteId: reserva.residenteId || '',
    })
    setDialogOpen(true)
  }

  // Lógica de calendario
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-lg"><CalendarIcon className="w-5 h-5 text-pink-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Gestión de Reservas</h2>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="lista"><List className="w-4 h-4 mr-2" /> Lista</TabsTrigger>
              <TabsTrigger value="calendario"><LayoutGrid className="w-4 h-4 mr-2" /> Calendario</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => { setIsEditing(false); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Reserva
          </Button>
        </div>
      </div>

      {view === 'lista' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
          ) : (
            reservas.map((r) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditDialog(r)}>
                <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                  <div>
                    <Badge variant="outline" className={estadoColors[r.estado]}>{r.estado}</Badge>
                    <CardTitle className="text-base mt-2 truncate max-w-[150px]">{r.titulo || r.espacio}</CardTitle>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(r.fecha)}</span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>{r.residente}</span>
                    <span className="text-slate-900 font-mono">{formatCLP(r.monto)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold">
                    <Clock className="w-3 h-3" /> {r.horaInicio} - {r.horaFin}
                    {r.comprobante && <Paperclip className="w-3 h-3 ml-auto text-blue-500" />}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg uppercase font-bold text-slate-700">
              {currentMonth.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-400 py-2">{d}</div>
              ))}
              {blanks.map(b => <div key={`b-${b}`} className="h-20 bg-slate-50/30 rounded" />)}
              {days.map(d => {
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const resDay = reservas.filter(r => r.fecha.startsWith(dateStr) && r.estado === 'Confirmada')
                return (
                  <div key={d} className="h-20 border border-slate-100 rounded p-1 space-y-1 overflow-y-auto hover:bg-slate-50 transition-colors">
                    <span className="text-[10px] font-bold text-slate-300">{d}</span>
                    {resDay.map(r => (
                      <div key={r.id} className="text-[8px] bg-blue-100 text-blue-700 p-1 rounded font-bold truncate uppercase" title={r.titulo}>
                        {r.horaInicio} {r.espacio}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-bold">{isEditing ? 'Editar' : 'Nueva'} Reserva</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Título / Evento</Label>
                <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Espacio</Label>
                <Select value={formData.espacio} onValueChange={(v) => setFormData({...formData, espacio: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {espaciosOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Monto</Label>
                <Input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: Number(e.target.value)})} />
              </div>
            </div>

            {/* Comprobante Section (Req 15) */}
            <div className="space-y-2 border-t pt-4">
              <FileUpload
                label="Comprobante / Respaldo"
                description="Arrastra o haz click para subir el comprobante (PDF, JPG, PNG)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={formData.comprobante ? [formData.comprobante] : []}
                maxFiles={1}
                accept={{ 'image/*': ['.jpeg', '.png', '.gif'], 'application/pdf': ['.pdf'] }}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pagado"
                checked={formData.pagado}
                onCheckedChange={(checked) => setFormData({...formData, pagado: Boolean(checked)})}
              />
              <label
                htmlFor="pagado"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pagado
              </label>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
