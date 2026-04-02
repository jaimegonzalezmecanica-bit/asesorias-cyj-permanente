'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Pencil, Trash2, Search, Calendar, Clock, Users, 
  Building2, AlertTriangle, CheckCircle, FileText, Upload
} from 'lucide-react'

interface EspacioComun {
  id: string
  codigo: string
  nombre: string
  tipo: string
  capacidad: number
  precioHora: number
  precioDia: number
  requierePago: boolean
  activo: boolean
}

interface Residente {
  id: string
  nombre: string
  rut: string | null
  unidad: string | null
  estado: string
  telefono: string | null
}

interface Reserva {
  id: string
  codigo: string
  espacioId: string
  espacio: EspacioComun
  residenteId: string | null
  residente: Residente | null
  nombreResidente: string
  unidadResidente: string | null
  telefonoResidente: string | null
  emailResidente: string | null
  fechaReserva: string
  fechaSolicitud: string
  horario: string
  horaInicio: string | null
  horaFin: string | null
  estado: string
  estadoPago: string
  montoTotal: number
  descuento: number
  montoFinal: number
  numeroPersonas: number
  motivoEvento: string | null
  observaciones: string | null
  verificacionMorosidad: string | null
}

const horarios = ['Mañana', 'Tarde', 'Noche']
const horarioColors: Record<string, string> = {
  'Mañana': 'bg-yellow-100 text-yellow-700',
  'Tarde': 'bg-orange-100 text-orange-700',
  'Noche': 'bg-indigo-100 text-indigo-700',
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'Confirmada': 'bg-green-100 text-green-700',
  'Cancelada': 'bg-red-100 text-red-700',
  'Completada': 'bg-slate-100 text-slate-700',
}

const tipoEspacios = [
  'Quincho', 'Cancha Futbolito', 'Multicancha', 'Club House', 
  'Estacionamiento', 'Jacuzzi', 'Sauna'
]

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

export function ReservasModule() {
  const [espacios, setEspacios] = useState<EspacioComun[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [espacioDialogOpen, setEspacioDialogOpen] = useState(false)
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null)
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null)
  const [editingEspacio, setEditingEspacio] = useState<EspacioComun | null>(null)
  
  // Current month for calendar
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Selected space filter
  const [selectedEspacioFilter, setSelectedEspacioFilter] = useState<string>('all')
  
  // Form state for reserva
  const [formData, setFormData] = useState({
    espacioId: '',
    residenteId: '',
    nombreResidente: '',
    unidadResidente: '',
    telefonoResidente: '',
    emailResidente: '',
    fechaReserva: new Date().toISOString().split('T')[0],
    horario: 'Mañana',
    horaInicio: '',
    horaFin: '',
    estado: 'Pendiente',
    estadoPago: 'Pendiente',
    numeroPersonas: 0,
    motivoEvento: '',
    observaciones: '',
    descuento: 0,
    correoRespaldo: '',
    nombreCorreoRespaldo: '',
  })
  
  // Form state for espacio
  const [espacioFormData, setEspacioFormData] = useState({
    nombre: '',
    tipo: 'Quincho',
    capacidad: 0,
    ubicacion: '',
    descripcion: '',
    precioHora: 0,
    precioDia: 0,
    requierePago: false,
    notas: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [espaciosRes, reservasRes, residentesRes] = await Promise.all([
        fetch('/api/espacios-comunes'),
        fetch(`/api/reservas?month=${currentMonth}`),
        fetch('/api/residentes'),
      ])
      const espaciosData = await espaciosRes.json()
      const reservasData = await reservasRes.json()
      const residentesData = await residentesRes.json()
      
      setEspacios(espaciosData)
      setReservas(reservasData)
      setResidentes(residentesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [currentMonth])

  const openReservaDialog = (reserva?: Reserva) => {
    if (reserva) {
      setEditingReserva(reserva)
      setFormData({
        espacioId: reserva.espacioId,
        residenteId: reserva.residenteId || '',
        nombreResidente: reserva.nombreResidente,
        unidadResidente: reserva.unidadResidente || '',
        telefonoResidente: reserva.telefonoResidente || '',
        emailResidente: reserva.emailResidente || '',
        fechaReserva: reserva.fechaReserva,
        horario: reserva.horario,
        horaInicio: reserva.horaInicio || '',
        horaFin: reserva.horaFin || '',
        estado: reserva.estado,
        estadoPago: reserva.estadoPago,
        numeroPersonas: reserva.numeroPersonas,
        motivoEvento: reserva.motivoEvento || '',
        observaciones: reserva.observaciones || '',
        descuento: reserva.descuento,
        correoRespaldo: '',
        nombreCorreoRespaldo: '',
      })
    } else {
      setEditingReserva(null)
      setFormData({
        espacioId: espacios[0]?.id || '',
        residenteId: '',
        nombreResidente: '',
        unidadResidente: '',
        telefonoResidente: '',
        emailResidente: '',
        fechaReserva: new Date().toISOString().split('T')[0],
        horario: 'Mañana',
        horaInicio: '',
        horaFin: '',
        estado: 'Pendiente',
        estadoPago: 'Pendiente',
        numeroPersonas: 0,
        motivoEvento: '',
        observaciones: '',
        descuento: 0,
        correoRespaldo: '',
        nombreCorreoRespaldo: '',
      })
    }
    setDialogOpen(true)
  }

  const openEspacioDialog = (espacio?: EspacioComun) => {
    if (espacio) {
      setEditingEspacio(espacio)
      setEspacioFormData({
        nombre: espacio.nombre,
        tipo: espacio.tipo,
        capacidad: espacio.capacidad,
        ubicacion: '',
        descripcion: '',
        precioHora: espacio.precioHora,
        precioDia: espacio.precioDia,
        requierePago: espacio.requierePago,
        notas: '',
      })
    } else {
      setEditingEspacio(null)
      setEspacioFormData({
        nombre: '',
        tipo: 'Quincho',
        capacidad: 0,
        ubicacion: '',
        descripcion: '',
        precioHora: 0,
        precioDia: 0,
        requierePago: false,
        notas: '',
      })
    }
    setEspacioDialogOpen(true)
  }

  const handleSaveReserva = async () => {
    if (!formData.espacioId || !formData.nombreResidente) return
    
    try {
      if (editingReserva) {
        await fetch(`/api/reservas/${editingReserva.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving reserva:', error)
    }
  }

  const handleSaveEspacio = async () => {
    if (!espacioFormData.nombre.trim()) return
    
    try {
      if (editingEspacio) {
        await fetch(`/api/espacios-comunes/${editingEspacio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(espacioFormData),
        })
      } else {
        await fetch('/api/espacios-comunes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(espacioFormData),
        })
      }
      setEspacioDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving espacio:', error)
    }
  }

  const handleDeleteReserva = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva?')) return
    try {
      await fetch(`/api/reservas/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting reserva:', error)
    }
  }

  const handleDeleteEspacio = async (id: string) => {
    if (!confirm('¿Eliminar este espacio?')) return
    try {
      await fetch(`/api/espacios-comunes/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting espacio:', error)
    }
  }

  // Handle resident selection
  const handleResidenteSelect = (residenteId: string) => {
    setFormData(prev => ({ ...prev, residenteId }))
    if (residenteId) {
      const residente = residentes.find(r => r.id === residenteId)
      if (residente) {
        setFormData(prev => ({
          ...prev,
          nombreResidente: residente.nombre,
          unidadResidente: residente.unidad || '',
          telefonoResidente: residente.telefono || '',
        }))
      }
    }
  }

  // Handle file upload for correo respaldo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          correoRespaldo: reader.result as string,
          nombreCorreoRespaldo: file.name,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Generate calendar days
  const generateCalendarDays = (): ({ date: number; dateStr: string; reservas: Reserva[] } | null)[] => {
    const [year, month] = currentMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekday = firstDay.getDay()
    
    const days: ({ date: number; dateStr: string; reservas: Reserva[] } | null)[] = []
    // Empty cells for days before start
    for (let i = 0; i < startWeekday; i++) {
      days.push(null)
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayReservas = reservas.filter(r => 
        r.fechaReserva === dateStr && 
        (selectedEspacioFilter === 'all' || r.espacioId === selectedEspacioFilter)
      )
      days.push({ date: d, dateStr, reservas: dayReservas })
    }
    return days
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  // Navigate months
  const prevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }
  
  const nextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  // Get selected space for price calculation
  const selectedEspacio = espacios.find(e => e.id === formData.espacioId)

  return (
    <div className="space-y-5">
      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-9">
          <TabsTrigger value="calendario" className="text-xs">Calendario</TabsTrigger>
          <TabsTrigger value="reservas" className="text-xs">Reservas</TabsTrigger>
          <TabsTrigger value="espacios" className="text-xs">Espacios</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>←</Button>
              <span className="font-semibold text-sm min-w-[120px] text-center">
                {new Date(currentMonth + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>→</Button>
            </div>
            
            <Select value={selectedEspacioFilter} onValueChange={setSelectedEspacioFilter}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Filtrar espacio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los espacios</SelectItem>
                {espacios.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button size="sm" onClick={() => openReservaDialog()}>
              <Plus className="w-4 h-4 mr-1" /> Nueva Reserva
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Calendar header */}
              <div className="grid grid-cols-7 border-b bg-slate-50">
                {weekDays.map(day => (
                  <div key={day} className="p-2 text-center text-[10px] font-bold text-slate-500 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[80px] border-b border-r p-1 ${!day ? 'bg-slate-50' : 'hover:bg-slate-50 cursor-pointer'}`}
                    onClick={() => day && setFormData(prev => ({ ...prev, fechaReserva: day.dateStr }))}
                  >
                    {day && (
                      <>
                        <div className="text-xs font-semibold text-slate-600 mb-1">{day.date}</div>
                        <div className="space-y-0.5">
                          {day.reservas.slice(0, 3).map(r => (
                            <div 
                              key={r.id}
                              className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer ${
                                r.estado === 'Confirmada' ? 'bg-green-100 text-green-700' :
                                r.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}
                              title={`${r.espacio.nombre} - ${r.nombreResidente}`}
                            >
                              {r.espacio.nombre.substring(0, 8)}
                            </div>
                          ))}
                          {day.reservas.length > 3 && (
                            <div className="text-[8px] text-slate-500">+{day.reservas.length - 3} más</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservas List Tab */}
        <TabsContent value="reservas" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar reserva..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => openReservaDialog()}>
              <Plus className="w-4 h-4 mr-1" /> Nueva Reserva
            </Button>
          </div>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Reservas ({reservas.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Código</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Espacio</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Residente</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Horario</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Morosidad</th>
                      <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Monto</th>
                      <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                    ) : reservas.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin reservas</td></tr>
                    ) : (
                      reservas.map((reserva) => (
                        <tr key={reserva.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs font-bold text-[#0f2040]">{reserva.codigo}</td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold">{reserva.espacio.nombre}</span>
                              <span className="text-[10px] text-slate-500">{reserva.espacio.tipo}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold">{reserva.nombreResidente}</span>
                              {reserva.unidadResidente && (
                                <span className="text-[10px] text-slate-500">U: {reserva.unidadResidente}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-xs">{formatDate(reserva.fechaReserva)}</td>
                          <td className="p-3">
                            <Badge className={horarioColors[reserva.horario]}>{reserva.horario}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={estadoColors[reserva.estado]}>{reserva.estado}</Badge>
                          </td>
                          <td className="p-3">
                            {reserva.verificacionMorosidad === 'Moroso' ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-xs font-semibold">Moroso</span>
                              </div>
                            ) : reserva.verificacionMorosidad === 'Al Día' ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span className="text-xs">Al día</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Sin verificar</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-green-600">{formatCLP(reserva.montoFinal)}</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openReservaDialog(reserva)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDeleteReserva(reserva.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Espacios Tab */}
        <TabsContent value="espacios" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Espacios Comunes Disponibles</h3>
            <Button size="sm" onClick={() => openEspacioDialog()}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo Espacio
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {espacios.map(espacio => (
              <Card key={espacio.id} className={espacio.activo ? '' : 'opacity-50'}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{espacio.nombre}</CardTitle>
                      <span className="text-[10px] text-slate-500 font-mono">{espacio.codigo}</span>
                    </div>
                    <Badge variant="outline">{espacio.tipo}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>Capacidad: {espacio.capacidad} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Hora: {formatCLP(espacio.precioHora)} | Día: {formatCLP(espacio.precioDia)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {espacio.requierePago ? (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]">Requiere pago</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">Gratuito</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEspacioDialog(espacio)}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleDeleteEspacio(espacio.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reserva Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingReserva ? 'Editar' : 'Nueva'} Reserva
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Selección de espacio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Espacio Común *</Label>
                <Select value={formData.espacioId} onValueChange={(v) => setFormData({...formData, espacioId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {espacios.filter(e => e.activo).map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.tipo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Buscar Residente (opcional)</Label>
                <Select value={formData.residenteId} onValueChange={handleResidenteSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar residente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {residentes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre} {r.unidad ? `(${r.unidad})` : ''} 
                        {r.estado === 'Moroso' ? ' ⚠️' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Datos del residente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Nombre del Residente *</Label>
                <Input 
                  value={formData.nombreResidente} 
                  onChange={(e) => setFormData({...formData, nombreResidente: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unidad / Casa</Label>
                <Input 
                  value={formData.unidadResidente} 
                  onChange={(e) => setFormData({...formData, unidadResidente: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Teléfono</Label>
                <Input 
                  value={formData.telefonoResidente} 
                  onChange={(e) => setFormData({...formData, telefonoResidente: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input 
                  type="email"
                  value={formData.emailResidente} 
                  onChange={(e) => setFormData({...formData, emailResidente: e.target.value})} 
                />
              </div>
            </div>

            {/* Fechas y horario */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Fecha de Reserva *</Label>
                <Input 
                  type="date" 
                  value={formData.fechaReserva} 
                  onChange={(e) => setFormData({...formData, fechaReserva: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Horario *</Label>
                <Select value={formData.horario} onValueChange={(v) => setFormData({...formData, horario: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {horarios.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">N° Personas</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={formData.numeroPersonas} 
                  onChange={(e) => setFormData({...formData, numeroPersonas: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>

            {/* Estado y Pago */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Estado de Pago</Label>
                <Select value={formData.estadoPago} onValueChange={(v) => setFormData({...formData, estadoPago: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                    <SelectItem value="Exento">Exento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Descuento</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={formData.descuento} 
                  onChange={(e) => setFormData({...formData, descuento: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>

            {/* Monto info */}
            {selectedEspacio && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Monto base:</span>
                  <span className="font-semibold">
                    {formatCLP(formData.horario === 'Noche' ? selectedEspacio.precioDia : selectedEspacio.precioHora * 4)}
                  </span>
                </div>
                {formData.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>- {formatCLP(formData.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCLP(
                      (formData.horario === 'Noche' ? selectedEspacio.precioDia : selectedEspacio.precioHora * 4) - formData.descuento
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Motivo y observaciones */}
            <div className="space-y-2">
              <Label className="text-xs">Motivo del Evento</Label>
              <Input 
                value={formData.motivoEvento} 
                onChange={(e) => setFormData({...formData, motivoEvento: e.target.value})} 
                placeholder="Cumpleaños, reunión, etc."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Observaciones</Label>
              <Textarea 
                value={formData.observaciones} 
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})} 
                rows={2}
              />
            </div>

            {/* Correo de respaldo */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Correo de Respaldo (PDF/Imagen)
              </Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="h-9" />
                {formData.nombreCorreoRespaldo && (
                  <span className="text-xs text-green-600">{formData.nombreCorreoRespaldo}</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveReserva}>Guardar Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Espacio Dialog */}
      <Dialog open={espacioDialogOpen} onOpenChange={setEspacioDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEspacio ? 'Editar' : 'Nuevo'} Espacio Común</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input 
                  value={espacioFormData.nombre} 
                  onChange={(e) => setEspacioFormData({...espacioFormData, nombre: e.target.value})} 
                  placeholder="Quincho 1, Multicancha..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={espacioFormData.tipo} onValueChange={(v) => setEspacioFormData({...espacioFormData, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoEspacios.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={espacioFormData.capacidad} 
                  onChange={(e) => setEspacioFormData({...espacioFormData, capacidad: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Requiere Pago</Label>
                <Select 
                  value={espacioFormData.requierePago ? 'si' : 'no'} 
                  onValueChange={(v) => setEspacioFormData({...espacioFormData, requierePago: v === 'si'})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Gratuito</SelectItem>
                    <SelectItem value="si">Con costo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio por Hora</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={espacioFormData.precioHora} 
                  onChange={(e) => setEspacioFormData({...espacioFormData, precioHora: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Precio por Día</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={espacioFormData.precioDia} 
                  onChange={(e) => setEspacioFormData({...espacioFormData, precioDia: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea 
                value={espacioFormData.notas} 
                onChange={(e) => setEspacioFormData({...espacioFormData, notas: e.target.value})} 
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEspacioDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEspacio}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
