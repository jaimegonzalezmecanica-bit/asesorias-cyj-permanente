'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { 
  Plus, Pencil, Trash2, Search, Eye, FileDown, Camera, 
  Save, X, AlertTriangle, CheckCircle, Clock, User, MapPin
} from 'lucide-react'

interface Observacion {
  id: string
  area: string
  equipo: string
  material: string
  lugar: string
  observacion: string
}

interface Inspeccion {
  id: string
  titulo: string
  tipo: string
  estado: string
  fecha: string | null
  hora: string | null
  ubicacion: string | null
  asignado: string | null
  descripcion: string | null
  recurrente: boolean
  notas: string | null
  observaciones: Observacion[]
  recomendaciones: Observacion[]
  firmaInspector: string | null
  firmaSupervisor: string | null
  nombreInspector: string | null
  nombreSupervisor: string | null
  fotosAntes: string[]
  fotosDurante: string[]
  fotosDespues: string[]
  createdAt: string
}

const tiposInspeccion = [
  'SST', 'Medio Ambiente', 'Seguridad', 'Orden y Aseo', 
  'Mantenimiento', 'Eléctrica', 'Sanitaria', 'Estructural', 'General'
]

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

const tipoColors: Record<string, string> = {
  'SST': 'bg-red-100 text-red-700',
  'Medio Ambiente': 'bg-green-100 text-green-700',
  'Seguridad': 'bg-purple-100 text-purple-700',
  'Orden y Aseo': 'bg-cyan-100 text-cyan-700',
  'Mantenimiento': 'bg-orange-100 text-orange-700',
  'Eléctrica': 'bg-yellow-100 text-yellow-700',
  'Sanitaria': 'bg-blue-100 text-blue-700',
  'Estructural': 'bg-slate-100 text-slate-700',
  'General': 'bg-gray-100 text-gray-700',
}

const estadoColors: Record<string, string> = {
  'Planificado': 'bg-blue-100 text-blue-700',
  'En Progreso': 'bg-yellow-100 text-yellow-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

const estadoIcons: Record<string, React.ReactNode> = {
  'Planificado': <Clock className="w-3 h-3" />,
  'En Progreso': <AlertTriangle className="w-3 h-3" />,
  'Completado': <CheckCircle className="w-3 h-3" />,
  'Cancelado': <X className="w-3 h-3" />,
}

export function InspeccionesModule() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [personal, setPersonal] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingInsp, setEditingInsp] = useState<Inspeccion | null>(null)
  const [viewingInsp, setViewingInsp] = useState<Inspeccion | null>(null)
  
  const firmaInspectorRef = useRef<HTMLCanvasElement>(null)
  const firmaSupervisorRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingInspector, setIsDrawingInspector] = useState(false)
  const [isDrawingSupervisor, setIsDrawingSupervisor] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'SST',
    estado: 'Planificado',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    ubicacion: '',
    asignado: 'none',
    descripcion: '',
    recurrente: false,
    notas: '',
    nombreInspector: '',
    nombreSupervisor: '',
  })
  
  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [recomendaciones, setRecomendaciones] = useState<Observacion[]>([])
  const [fotosAntes, setFotosAntes] = useState<string[]>([])
  const [fotosDurante, setFotosDurante] = useState<string[]>([])
  const [fotosDespues, setFotosDespues] = useState<string[]>([])

  const fetchInspecciones = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/inspecciones?search=${encodeURIComponent(searchTerm)}` : '/api/inspecciones'
      const res = await fetch(url)
      const data = await res.json()
      // Parse JSON fields
      const parsed = data.map((insp: any) => ({
        ...insp,
        observaciones: insp.observaciones ? JSON.parse(insp.observaciones) : [],
        recomendaciones: insp.recomendaciones ? JSON.parse(insp.recomendaciones) : [],
        fotosAntes: insp.fotosAntes ? JSON.parse(insp.fotosAntes) : [],
        fotosDurante: insp.fotosDurante ? JSON.parse(insp.fotosDurante) : [],
        fotosDespues: insp.fotosDespues ? JSON.parse(insp.fotosDespues) : [],
      }))
      setInspecciones(parsed)
    } catch (error) {
      console.error('Error fetching inspecciones:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchInspecciones()
    })()
    fetch('/api/personal').then(res => res.json()).then(setPersonal)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchInspecciones(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  // Initialize signature canvas
  useEffect(() => {
    if (dialogOpen) {
      setTimeout(() => {
        if (firmaInspectorRef.current) {
          const ctx = firmaInspectorRef.current.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, firmaInspectorRef.current.width, firmaInspectorRef.current.height)
          }
        }
        if (firmaSupervisorRef.current) {
          const ctx = firmaSupervisorRef.current.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, firmaSupervisorRef.current.width, firmaSupervisorRef.current.height)
          }
        }
      }, 100)
    }
  }, [dialogOpen])

  const openDialog = (insp?: Inspeccion) => {
    if (insp) {
      setEditingInsp(insp)
      setFormData({
        titulo: insp.titulo,
        tipo: insp.tipo,
        estado: insp.estado,
        fecha: insp.fecha || new Date().toISOString().split('T')[0],
        hora: insp.hora || '',
        ubicacion: insp.ubicacion || '',
        asignado: insp.asignado || 'none',
        descripcion: insp.descripcion || '',
        recurrente: insp.recurrente,
        notas: insp.notas || '',
        nombreInspector: insp.nombreInspector || '',
        nombreSupervisor: insp.nombreSupervisor || '',
      })
      setObservaciones(insp.observaciones || [])
      setRecomendaciones(insp.recomendaciones || [])
      setFotosAntes(insp.fotosAntes || [])
      setFotosDurante(insp.fotosDurante || [])
      setFotosDespues(insp.fotosDespues || [])
    } else {
      setEditingInsp(null)
      setFormData({
        titulo: '',
        tipo: 'SST',
        estado: 'Planificado',
        fecha: new Date().toISOString().split('T')[0],
        hora: '',
        ubicacion: '',
        asignado: 'none',
        descripcion: '',
        recurrente: false,
        notas: '',
        nombreInspector: '',
        nombreSupervisor: '',
      })
      setObservaciones([])
      setRecomendaciones([])
      setFotosAntes([])
      setFotosDurante([])
      setFotosDespues([])
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim()) return

    const firmaInspector = firmaInspectorRef.current?.toDataURL('image/png') || null
    const firmaSupervisor = firmaSupervisorRef.current?.toDataURL('image/png') || null

    const dataToSend = {
      ...formData,
      asignado: formData.asignado === 'none' ? null : formData.asignado,
      observaciones: JSON.stringify(observaciones),
      recomendaciones: JSON.stringify(recomendaciones),
      fotosAntes: JSON.stringify(fotosAntes),
      fotosDurante: JSON.stringify(fotosDurante),
      fotosDespues: JSON.stringify(fotosDespues),
      firmaInspector,
      firmaSupervisor,
    }

    try {
      if (editingInsp) {
        await fetch(`/api/inspecciones/${editingInsp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      } else {
        await fetch('/api/inspecciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      }
      setDialogOpen(false)
      fetchInspecciones(search)
    } catch (error) {
      console.error('Error saving inspeccion:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta inspección?')) return
    try {
      await fetch(`/api/inspecciones/${id}`, { method: 'DELETE' })
      fetchInspecciones(search)
    } catch (error) {
      console.error('Error deleting inspeccion:', error)
    }
  }

  // Add/remove observation
  const addObservacion = () => {
    setObservaciones([...observaciones, {
      id: `temp-${Date.now()}`,
      area: '',
      equipo: '',
      material: '',
      lugar: '',
      observacion: ''
    }])
  }

  const updateObservacion = (index: number, field: string, value: string) => {
    const updated = [...observaciones]
    updated[index] = { ...updated[index], [field]: value }
    setObservaciones(updated)
  }

  const removeObservacion = (index: number) => {
    setObservaciones(observaciones.filter((_, i) => i !== index))
  }

  // Add/remove recommendation
  const addRecomendacion = () => {
    setRecomendaciones([...recomendaciones, {
      id: `temp-${Date.now()}`,
      area: '',
      equipo: '',
      material: '',
      lugar: '',
      observacion: ''
    }])
  }

  const updateRecomendacion = (index: number, field: string, value: string) => {
    const updated = [...recomendaciones]
    updated[index] = { ...updated[index], [field]: value }
    setRecomendaciones(updated)
  }

  const removeRecomendacion = (index: number) => {
    setRecomendaciones(recomendaciones.filter((_, i) => i !== index))
  }

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'antes' | 'durante' | 'despues') => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        if (type === 'antes') setFotosAntes(prev => [...prev, base64])
        else if (type === 'durante') setFotosDurante(prev => [...prev, base64])
        else setFotosDespues(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (type: 'antes' | 'durante' | 'despues', index: number) => {
    if (type === 'antes') setFotosAntes(fotosAntes.filter((_, i) => i !== index))
    else if (type === 'durante') setFotosDurante(fotosDurante.filter((_, i) => i !== index))
    else setFotosDespues(fotosDespues.filter((_, i) => i !== index))
  }

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, isInspector: boolean) => {
    const canvas = isInspector ? firmaInspectorRef.current : firmaSupervisorRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    
    if (isInspector) setIsDrawingInspector(true)
    else setIsDrawingSupervisor(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, isInspector: boolean) => {
    const isDrawing = isInspector ? isDrawingInspector : isDrawingSupervisor
    if (!isDrawing) return

    const canvas = isInspector ? firmaInspectorRef.current : firmaSupervisorRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = (isInspector: boolean) => {
    if (isInspector) setIsDrawingInspector(false)
    else setIsDrawingSupervisor(false)
  }

  const clearSignature = (isInspector: boolean) => {
    const canvas = isInspector ? firmaInspectorRef.current : firmaSupervisorRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Export to PDF
  const exportPDF = async (insp: Inspeccion) => {
    window.open(`/api/pdf/inspeccion/${insp.id}`, '_blank')
  }

  const stats = {
    Planificado: inspecciones.filter(i => i.estado === 'Planificado').length,
    'En Progreso': inspecciones.filter(i => i.estado === 'En Progreso').length,
    Completado: inspecciones.filter(i => i.estado === 'Completado').length,
    Cancelado: inspecciones.filter(i => i.estado === 'Cancelado').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(stats).map(([estado, count]) => (
          <Card key={estado} className="p-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${estadoColors[estado]}`}>
                {estadoIcons[estado]}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">{estado}</div>
                <div className="text-xl font-bold text-[#0f2040]">{count}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Inspección
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Inspecciones ({inspecciones.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Título</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Ubicación</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Inspector</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Obs/Rec</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : inspecciones.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Sin inspecciones</td></tr>
                ) : (
                  inspecciones.map((insp) => (
                    <tr key={insp.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">{insp.titulo}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[insp.tipo] || 'bg-slate-100'}>{insp.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[insp.estado] || 'bg-slate-100'}>{insp.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs">{insp.ubicacion || '–'}</td>
                      <td className="p-3 text-xs">{insp.nombreInspector || insp.asignado || '–'}</td>
                      <td className="p-3 text-xs">{formatDate(insp.fecha)}</td>
                      <td className="p-3 text-xs">
                        <span className="text-orange-600">{insp.observaciones?.length || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-green-600">{insp.recomendaciones?.length || 0}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-blue-600" 
                            onClick={() => exportPDF(insp)}
                            title="Exportar PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setViewingInsp(insp); setViewDialogOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(insp)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(insp.id)}>
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

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingInsp ? 'Editar' : 'Nueva'} Inspección</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-9">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="observaciones" className="text-xs">Observaciones</TabsTrigger>
              <TabsTrigger value="recomendaciones" className="text-xs">Recomendaciones</TabsTrigger>
              <TabsTrigger value="firmas" className="text-xs">Firmas</TabsTrigger>
            </TabsList>

            <div className="py-4">
              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Título *</Label>
                    <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tiposInspeccion.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Estado</Label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Planificado', 'En Progreso', 'Completado', 'Cancelado'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Fecha</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Hora</Label>
                    <Input type="time" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Ubicación</Label>
                    <Input value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} placeholder="Área, sector, edificio..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Asignado a</Label>
                    <Select value={formData.asignado} onValueChange={(v) => setFormData({...formData, asignado: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {personal.map(p => (
                          <SelectItem key={p.id} value={p.nombre}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Descripción</Label>
                  <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Notas adicionales</Label>
                  <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} rows={2} />
                </div>
                
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formData.recurrente} onChange={(e) => setFormData({...formData, recurrente: e.target.checked})} className="rounded" />
                  Inspección recurrente
                </label>
              </TabsContent>

              {/* Observaciones Tab */}
              <TabsContent value="observaciones" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Observaciones</h4>
                  <Button size="sm" variant="outline" onClick={addObservacion}>
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </div>
                
                {observaciones.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Sin observaciones. Click "Agregar" para añadir una.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {observaciones.map((obs, index) => (
                      <Card key={obs.id} className="p-3">
                        <div className="grid grid-cols-5 gap-2 mb-2">
                          <Input 
                            placeholder="Área" 
                            value={obs.area} 
                            onChange={(e) => updateObservacion(index, 'area', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Equipo" 
                            value={obs.equipo} 
                            onChange={(e) => updateObservacion(index, 'equipo', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Material" 
                            value={obs.material} 
                            onChange={(e) => updateObservacion(index, 'material', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Lugar" 
                            value={obs.lugar} 
                            onChange={(e) => updateObservacion(index, 'lugar', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-red-600" 
                            onClick={() => removeObservacion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea 
                          placeholder="Observación..."
                          value={obs.observacion}
                          onChange={(e) => updateObservacion(index, 'observacion', e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Recomendaciones Tab */}
              <TabsContent value="recomendaciones" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Recomendaciones</h4>
                  <Button size="sm" variant="outline" onClick={addRecomendacion}>
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </div>
                
                {recomendaciones.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Sin recomendaciones. Click "Agregar" para añadir una.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recomendaciones.map((rec, index) => (
                      <Card key={rec.id} className="p-3">
                        <div className="grid grid-cols-5 gap-2 mb-2">
                          <Input 
                            placeholder="Área" 
                            value={rec.area} 
                            onChange={(e) => updateRecomendacion(index, 'area', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Equipo" 
                            value={rec.equipo} 
                            onChange={(e) => updateRecomendacion(index, 'equipo', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Material" 
                            value={rec.material} 
                            onChange={(e) => updateRecomendacion(index, 'material', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Input 
                            placeholder="Lugar" 
                            value={rec.lugar} 
                            onChange={(e) => updateRecomendacion(index, 'lugar', e.target.value)} 
                            className="h-8 text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-red-600" 
                            onClick={() => removeRecomendacion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea 
                          placeholder="Recomendación..."
                          value={rec.observacion}
                          onChange={(e) => updateRecomendacion(index, 'observacion', e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Firmas Tab */}
              <TabsContent value="firmas" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  {/* Inspector */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre del Inspector</Label>
                      <Input 
                        value={formData.nombreInspector}
                        onChange={(e) => setFormData({...formData, nombreInspector: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Firma del Inspector</Label>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearSignature(true)}>
                          Limpiar
                        </Button>
                      </div>
                      <canvas
                        ref={firmaInspectorRef}
                        width={300}
                        height={120}
                        className="border border-slate-300 rounded cursor-crosshair w-full"
                        onMouseDown={(e) => startDrawing(e, true)}
                        onMouseMove={(e) => draw(e, true)}
                        onMouseUp={() => stopDrawing(true)}
                        onMouseLeave={() => stopDrawing(true)}
                      />
                    </div>
                  </div>
                  
                  {/* Supervisor */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre del Supervisor</Label>
                      <Input 
                        value={formData.nombreSupervisor}
                        onChange={(e) => setFormData({...formData, nombreSupervisor: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Firma del Supervisor</Label>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearSignature(false)}>
                          Limpiar
                        </Button>
                      </div>
                      <canvas
                        ref={firmaSupervisorRef}
                        width={300}
                        height={120}
                        className="border border-slate-300 rounded cursor-crosshair w-full"
                        onMouseDown={(e) => startDrawing(e, false)}
                        onMouseMove={(e) => draw(e, false)}
                        onMouseUp={() => stopDrawing(false)}
                        onMouseLeave={() => stopDrawing(false)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Inspección: {viewingInsp?.titulo}</DialogTitle>
          </DialogHeader>
          {viewingInsp && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Tipo</div>
                  <Badge className={tipoColors[viewingInsp.tipo]}>{viewingInsp.tipo}</Badge>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Estado</div>
                  <Badge className={estadoColors[viewingInsp.estado]}>{viewingInsp.estado}</Badge>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Fecha/Hora</div>
                  <div className="text-sm font-semibold">{formatDate(viewingInsp.fecha)} {viewingInsp.hora || ''}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Ubicación</div>
                  <div className="text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{viewingInsp.ubicacion || '–'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Asignado</div>
                  <div className="text-sm flex items-center gap-1"><User className="w-3 h-3" />{viewingInsp.asignado || '–'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Recurrente</div>
                  <div className="text-sm">{viewingInsp.recurrente ? 'Sí' : 'No'}</div>
                </div>
              </div>

              {viewingInsp.descripcion && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Descripción</div>
                  <p className="text-sm text-slate-600 bg-white p-3 border rounded">{viewingInsp.descripcion}</p>
                </div>
              )}

              {/* Observaciones */}
              {viewingInsp.observaciones && viewingInsp.observaciones.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Observaciones ({viewingInsp.observaciones.length})</div>
                  <div className="space-y-2">
                    {viewingInsp.observaciones.map((obs, i) => (
                      <div key={i} className="bg-orange-50 border border-orange-200 p-3 rounded text-sm">
                        <div className="flex gap-2 text-xs text-orange-700 mb-1">
                          {obs.area && <span className="font-semibold">{obs.area}</span>}
                          {obs.equipo && <span>• {obs.equipo}</span>}
                          {obs.lugar && <span>• {obs.lugar}</span>}
                        </div>
                        <div className="text-slate-700">{obs.observacion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {viewingInsp.recomendaciones && viewingInsp.recomendaciones.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Recomendaciones ({viewingInsp.recomendaciones.length})</div>
                  <div className="space-y-2">
                    {viewingInsp.recomendaciones.map((rec, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 p-3 rounded text-sm">
                        <div className="flex gap-2 text-xs text-green-700 mb-1">
                          {rec.area && <span className="font-semibold">{rec.area}</span>}
                          {rec.equipo && <span>• {rec.equipo}</span>}
                          {rec.lugar && <span>• {rec.lugar}</span>}
                        </div>
                        <div className="text-slate-700">{rec.observacion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Firma Inspector</div>
                  {viewingInsp.firmaInspector ? (
                    <img src={viewingInsp.firmaInspector} alt="Firma Inspector" className="h-20 mx-auto border rounded" />
                  ) : (
                    <div className="h-20 border rounded flex items-center justify-center text-slate-400 text-xs">Sin firma</div>
                  )}
                  <div className="text-xs mt-1 font-semibold">{viewingInsp.nombreInspector || '–'}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Firma Supervisor</div>
                  {viewingInsp.firmaSupervisor ? (
                    <img src={viewingInsp.firmaSupervisor} alt="Firma Supervisor" className="h-20 mx-auto border rounded" />
                  ) : (
                    <div className="h-20 border rounded flex items-center justify-center text-slate-400 text-xs">Sin firma</div>
                  )}
                  <div className="text-xs mt-1 font-semibold">{viewingInsp.nombreSupervisor || '–'}</div>
                </div>
              </div>

              {viewingInsp.notas && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Notas</div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{viewingInsp.notas}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
            {viewingInsp && (
              <Button onClick={() => exportPDF(viewingInsp)}>
                <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
