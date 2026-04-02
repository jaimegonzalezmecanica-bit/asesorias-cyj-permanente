'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Plus, Pencil, Trash2, Search, Download, Package, Wrench, 
  CheckSquare, Users, FileText, Upload, Eye, X, Paperclip, ListTodo
} from 'lucide-react'
import { formatCLP, formatDate } from '@/lib/format'

// Interfaces
interface ProyectoMaterial {
  id: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnit: number
  total: number
}

interface ProyectoHerramienta {
  id: string
  nombre: string
  cantidad: number
}

interface ProyectoTarea {
  id: string
  descripcion: string
  cantidad: number
  estado: string
}

interface ProyectoPersonal {
  id: string
  nombre: string
  tipo: string
  cantidad: number
  precioUnit: number
  total: number
}

interface ProyectoDocumento {
  id: string
  nombre: string
  tipo: string
  descripcion: string | null
  archivo: string
  fechaDoc: string | null
  createdAt: string
}

interface Proyecto {
  id: string
  nombre: string
  categoria: string
  estado: string
  ubicacion: string | null
  fechaInicio: string | null
  fechaFin: string | null
  presProg: number
  presUsado: number
  avance: number
  descripcion: string | null
  notas: string | null
  materiales: ProyectoMaterial[]
  herramientas: ProyectoHerramienta[]
  tareas: ProyectoTarea[]
  personal: ProyectoPersonal[]
  documentos: ProyectoDocumento[]
}

const categoriaColors: Record<string, string> = {
  'Áreas Verdes': 'bg-green-100 text-green-700',
  'Eléctrico': 'bg-yellow-100 text-yellow-700',
  'Sanitario': 'bg-blue-100 text-blue-700',
  'Infraestructura': 'bg-slate-100 text-slate-700',
  'Seguridad': 'bg-purple-100 text-purple-700',
  'Administración': 'bg-cyan-100 text-cyan-700',
}

const estadoColors: Record<string, string> = {
  'Planificado': 'bg-blue-100 text-blue-700',
  'En Ejecución': 'bg-yellow-100 text-yellow-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
  'Pausado': 'bg-slate-100 text-slate-700',
}

const documentoTipoColors: Record<string, string> = {
  'cotizacion': 'bg-blue-100 text-blue-700',
  'respaldo': 'bg-green-100 text-green-700',
  'contrato': 'bg-purple-100 text-purple-700',
  'factura': 'bg-orange-100 text-orange-700',
  'otro': 'bg-slate-100 text-slate-700',
}

export function ProyectosModule() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editingProy, setEditingProy] = useState<Proyecto | null>(null)
  const [selectedProy, setSelectedProy] = useState<Proyecto | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'General',
    estado: 'Planificado',
    ubicacion: '',
    fechaInicio: '',
    fechaFin: '',
    presProg: 0,
    presUsado: 0,
    avance: 0,
    descripcion: '',
    notas: '',
  })
  
  // Resources state
  const [materiales, setMateriales] = useState<ProyectoMaterial[]>([])
  const [herramientas, setHerramientas] = useState<ProyectoHerramienta[]>([])
  const [tareas, setTareas] = useState<ProyectoTarea[]>([])
  const [personal, setPersonal] = useState<ProyectoPersonal[]>([])
  const [documentos, setDocumentos] = useState<ProyectoDocumento[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProyectos = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/proyectos?search=${encodeURIComponent(searchTerm)}` : '/api/proyectos'
      const res = await fetch(url)
      const data = await res.json()
      setProyectos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching proyectos:', error)
      setProyectos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProyectos()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchProyectos(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (proy?: Proyecto) => {
    if (proy) {
      setEditingProy(proy)
      setFormData({
        nombre: proy.nombre,
        categoria: proy.categoria,
        estado: proy.estado,
        ubicacion: proy.ubicacion || '',
        fechaInicio: proy.fechaInicio || '',
        fechaFin: proy.fechaFin || '',
        presProg: proy.presProg,
        presUsado: proy.presUsado,
        avance: proy.avance,
        descripcion: proy.descripcion || '',
        notas: proy.notas || '',
      })
      setMateriales(proy.materiales || [])
      setHerramientas(proy.herramientas || [])
      setTareas(proy.tareas || [])
      setPersonal(proy.personal || [])
      setDocumentos(proy.documentos || [])
    } else {
      setEditingProy(null)
      setFormData({
        nombre: '',
        categoria: 'General',
        estado: 'Planificado',
        ubicacion: '',
        fechaInicio: '',
        fechaFin: '',
        presProg: 0,
        presUsado: 0,
        avance: 0,
        descripcion: '',
        notas: '',
      })
      setMateriales([])
      setHerramientas([])
      setTareas([])
      setPersonal([])
      setDocumentos([])
    }
    setActiveTab('general')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return

    const costoMateriales = materiales.reduce((sum, m) => sum + (m.total || m.cantidad * m.precioUnit), 0)
    const costoPersonal = personal.reduce((sum, p) => sum + (p.total || p.precioUnit * p.cantidad), 0)
    const presUsadoCalculado = costoMateriales + costoPersonal

    const dataToSend = {
      ...formData,
      presUsado: presUsadoCalculado,
      materiales,
      herramientas,
      tareas,
      personal,
      documentos,
    }

    try {
      const method = editingProy ? 'PUT' : 'POST'
      const url = editingProy ? `/api/proyectos/${editingProy.id}` : '/api/proyectos'
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })
      
      setDialogOpen(false)
      fetchProyectos(search)
    } catch (error) {
      console.error('Error saving proyecto:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const newDoc: ProyectoDocumento = {
        id: `temp-${Date.now()}`,
        nombre: file.name,
        tipo: 'respaldo',
        descripcion: '',
        archivo: base64,
        fechaDoc: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      }
      setDocumentos([...documentos, newDoc])
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Proyecto
        </Button>
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : proyectos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay proyectos</div>
        ) : (
          proyectos.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDialog(p)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={estadoColors[p.estado]}>{p.estado}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(p.fechaInicio)}</span>
                </div>
                <CardTitle className="text-base mt-2">{p.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Presupuesto: {formatCLP(p.presProg)}</span>
                  <span>Avance: {p.avance}%</span>
                </div>
                <Progress value={p.avance} className="h-1.5" />
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" /> {p.tareas?.length || 0}</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {p.materiales?.length || 0}</span>
                  <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {p.documentos?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Detalle/Edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingProy ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6">
                <TabsTrigger value="general" className="rounded-none bg-transparent px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">General</TabsTrigger>
                <TabsTrigger value="tareas" className="rounded-none bg-transparent px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Tareas</TabsTrigger>
                <TabsTrigger value="materiales" className="rounded-none bg-transparent px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Materiales</TabsTrigger>
                <TabsTrigger value="herramientas" className="rounded-none bg-transparent px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Herramientas</TabsTrigger>
                <TabsTrigger value="adjuntos" className="rounded-none bg-transparent px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">Adjuntos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="general" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nombre</Label>
                    <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(estadoColors).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Presupuesto</Label>
                    <Input type="number" value={formData.presProg} onChange={(e) => setFormData({...formData, presProg: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Descripción</Label>
                    <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tareas" className="m-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Plan de Trabajo</h4>
                  <Button size="sm" variant="outline" onClick={() => setTareas([...tareas, { id: `t-${Date.now()}`, descripcion: '', cantidad: 1, estado: 'Pendiente' }])}>
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                </div>
                {tareas.map((t, i) => (
                  <div key={t.id} className="flex gap-2 items-start border p-3 rounded-md">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Descripción de la tarea" value={t.descripcion} onChange={(e) => {
                        const n = [...tareas]; n[i].descripcion = e.target.value; setTareas(n);
                      }} />
                    </div>
                    <Select value={t.estado} onValueChange={(v) => {
                      const n = [...tareas]; n[i].estado = v; setTareas(n);
                    }}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="En Progreso">En Progreso</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setTareas(tareas.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="materiales" className="m-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Materiales</h4>
                  <Button size="sm" variant="outline" onClick={() => setMateriales([...materiales, { id: `m-${Date.now()}`, descripcion: '', cantidad: 1, unidad: 'un', precioUnit: 0, total: 0 }])}>
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                </div>
                <div className="space-y-2">
                  {materiales.map((m, i) => (
                    <div key={m.id} className="grid grid-cols-5 gap-2 border p-2 rounded-md">
                      <Input className="col-span-2" placeholder="Material" value={m.descripcion} onChange={(e) => {
                        const n = [...materiales]; n[i].descripcion = e.target.value; setMateriales(n);
                      }} />
                      <Input type="number" placeholder="Cant" value={m.cantidad} onChange={(e) => {
                        const n = [...materiales]; n[i].cantidad = Number(e.target.value); n[i].total = n[i].cantidad * n[i].precioUnit; setMateriales(n);
                      }} />
                      <Input type="number" placeholder="Precio" value={m.precioUnit} onChange={(e) => {
                        const n = [...materiales]; n[i].precioUnit = Number(e.target.value); n[i].total = n[i].cantidad * n[i].precioUnit; setMateriales(n);
                      }} />
                      <Button variant="ghost" size="icon" className="text-red-500 ml-auto" onClick={() => setMateriales(materiales.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="adjuntos" className="m-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Documentos y Respaldos</h4>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Subir
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {documentos.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 border rounded-md">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.nombre}</p>
                        <p className="text-[10px] text-slate-500">{formatDate(d.fechaDoc)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDocumentos(documentos.filter((_, idx) => idx !== i))}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="p-6 border-t bg-slate-50">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar Proyecto</Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
