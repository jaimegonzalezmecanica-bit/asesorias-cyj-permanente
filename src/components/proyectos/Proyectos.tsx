
'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Hammer,
  Package,
  ListTodo,
  Paperclip,
  Trash2,
  ChevronRight,
  X
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FileUpload from '@/components/shared/FileUpload'

interface Project {
  id: string
  nombre: string
  categoria: string
  estado: 'Planificado' | 'En Ejecución' | 'Completado' | 'Pausado'
  progreso: number
  fechaInicio: string
  fechaFin?: string
  presupuesto: number
  descripcion?: string
  materiales: { id: string; nombre: string; cantidad: number; unidad: string }[]
  tareas: { id: string; descripcion: string; completada: boolean }[]
  herramientas: { id: string; nombre: string; cantidad: number }[]
  adjuntos: string[] // URLs de archivos adjuntos
}

const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    nombre: 'Remodelación de Fachada Principal',
    categoria: 'Infraestructura',
    estado: 'En Ejecución',
    progreso: 65,
    fechaInicio: '2026-03-01',
    presupuesto: 4500000,
    materiales: [{ id: 'M1', nombre: 'Cemento', cantidad: 10, unidad: 'sacos' }],
    tareas: [{ id: 'T1', descripcion: 'Demoler muro', completada: true }],
    herramientas: [{ id: 'H1', nombre: 'Martillo', cantidad: 2 }],
    adjuntos: []
  },
  {
    id: 'PRJ-002',
    nombre: 'Actualización de Sistema de Cámaras',
    categoria: 'Seguridad',
    estado: 'Planificado',
    progreso: 0,
    fechaInicio: '2026-04-15',
    presupuesto: 2800000,
    materiales: [],
    tareas: [],
    herramientas: [],
    adjuntos: []
  }
]

export default function Proyectos() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<Project>({
    id: '',
    nombre: '',
    categoria: 'General',
    estado: 'Planificado',
    progreso: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    presupuesto: 0,
    materiales: [],
    tareas: [],
    herramientas: [],
    adjuntos: []
  })

  useEffect(() => {
    // Aquí se podría cargar los proyectos desde una API
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
      setFormData(prev => ({ ...prev, adjuntos: [...prev.adjuntos, url] }))
      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleFileRemove = async (urlToRemove: string): Promise<boolean> => {
    // Implementar lógica para eliminar archivo del servidor si es necesario
    setFormData(prev => ({ ...prev, adjuntos: prev.adjuntos.filter(url => url !== urlToRemove) }))
    return true
  }

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData(project)
    } else {
      setEditingProject(null)
      setFormData({
        id: '',
        nombre: '',
        categoria: 'General',
        estado: 'Planificado',
        progreso: 0,
        fechaInicio: new Date().toISOString().split('T')[0],
        presupuesto: 0,
        materiales: [],
        tareas: [],
        herramientas: [],
        adjuntos: []
      })
    }
    setDialogOpen(true)
  }

  const handleSaveProject = () => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? formData : p))
    } else {
      setProjects([...projects, { ...formData, id: `PRJ-${String(projects.length + 1).padStart(3, '0')}` }])
    }
    setDialogOpen(false)
  }

  const handleAddMaterial = () => {
    setFormData(prev => ({ ...prev, materiales: [...prev.materiales, { id: Date.now().toString(), nombre: '', cantidad: 0, unidad: '' }] }))
  }

  const handleUpdateMaterial = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      materiales: prev.materiales.map(mat => mat.id === id ? { ...mat, [field]: value } : mat)
    }))
  }

  const handleRemoveMaterial = (id: string) => {
    setFormData(prev => ({ ...prev, materiales: prev.materiales.filter(mat => mat.id !== id) }))
  }

  const handleAddTarea = () => {
    setFormData(prev => ({ ...prev, tareas: [...prev.tareas, { id: Date.now().toString(), descripcion: '', completada: false }] }))
  }

  const handleUpdateTarea = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tareas: prev.tareas.map(tar => tar.id === id ? { ...tar, [field]: value } : tar)
    }))
  }

  const handleRemoveTarea = (id: string) => {
    setFormData(prev => ({ ...prev, tareas: prev.tareas.filter(tar => tar.id !== id) }))
  }

  const handleAddHerramienta = () => {
    setFormData(prev => ({ ...prev, herramientas: [...prev.herramientas, { id: Date.now().toString(), nombre: '', cantidad: 0 }] }))
  }

  const handleUpdateHerramienta = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      herramientas: prev.herramientas.map(herr => herr.id === id ? { ...herr, [field]: value } : herr)
    }))
  }

  const handleRemoveHerramienta = (id: string) => {
    setFormData(prev => ({ ...prev, herramientas: prev.herramientas.filter(herr => herr.id !== id) }))
  }

  const filteredProjects = projects.filter(project =>
    project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Proyectos</h1>
          <p className="text-sm text-slate-500">Planificación y seguimiento de obras mayores</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar proyectos..."
          className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md cursor-pointer"
            onClick={() => openDialog(project)}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={cn(
                "rounded-lg p-2.5",
                project.estado === 'En Ejecución' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
              )}>
                <Briefcase className="h-5 w-5" />
              </div>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                project.estado === 'En Ejecución' ? "bg-blue-100 text-blue-700" :
                project.estado === 'Planificado' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              )}>
                {project.estado}
              </span>
            </div>

            <h3 className="mb-1 text-lg font-bold text-slate-900 line-clamp-1">{project.nombre}</h3>
            <p className="mb-4 text-sm text-slate-500">{project.categoria}</p>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Progreso</span>
                <span className="font-bold text-slate-900">{project.progreso}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${project.progreso}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t pt-4">
              <div className="text-center">
                <Package className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <span className="block text-xs font-bold text-slate-900">{project.materiales.length}</span>
                <span className="text-[10px] uppercase text-slate-500">Mat.</span>
              </div>
              <div className="text-center">
                <ListTodo className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <span className="block text-xs font-bold text-slate-900">{project.tareas.length}</span>
                <span className="text-[10px] uppercase text-slate-500">Tareas</span>
              </div>
              <div className="text-center">
                <Hammer className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <span className="block text-xs font-bold text-slate-900">{project.herramientas.length}</span>
                <span className="text-[10px] uppercase text-slate-500">Herr.</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs">
              <div className="flex items-center text-slate-500">
                <Calendar className="mr-1 h-3.5 w-3.5" />
                {new Date(project.fechaInicio).toLocaleDateString('es-CL')}
              </div>
              <div className="font-bold text-slate-900">
                {APP_CONFIG.currency.format(project.presupuesto)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Editar' : 'Nuevo'} Proyecto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nombre">Nombre del Proyecto</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input id="categoria" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as Project['estado'] })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planificado">Planificado</SelectItem>
                    <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input id="fechaInicio" type="date" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha de Fin (Opcional)</Label>
                <Input id="fechaFin" type="date" value={formData.fechaFin || ''} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presupuesto">Presupuesto</Label>
                <Input id="presupuesto" type="number" value={formData.presupuesto} onChange={(e) => setFormData({ ...formData, presupuesto: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progreso">Progreso (%)</Label>
                <Input id="progreso" type="number" value={formData.progreso} onChange={(e) => setFormData({ ...formData, progreso: Number(e.target.value) })} max={100} min={0} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
            </div>

            {/* Materiales */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-bold text-slate-900">Materiales</h3>
              {formData.materiales.map((mat, index) => (
                <div key={mat.id} className="flex items-center gap-2">
                  <Input placeholder="Nombre" value={mat.nombre} onChange={(e) => handleUpdateMaterial(mat.id, 'nombre', e.target.value)} />
                  <Input type="number" placeholder="Cantidad" value={mat.cantidad} onChange={(e) => handleUpdateMaterial(mat.id, 'cantidad', Number(e.target.value))} />
                  <Input placeholder="Unidad" value={mat.unidad} onChange={(e) => handleUpdateMaterial(mat.id, 'unidad', e.target.value)} />
                  <Button variant="destructive" size="icon" onClick={() => handleRemoveMaterial(mat.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddMaterial}><Plus className="h-4 w-4 mr-2" /> Añadir Material</Button>
            </div>

            {/* Tareas */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-bold text-slate-900">Tareas</h3>
              {formData.tareas.map((tar, index) => (
                <div key={tar.id} className="flex items-center gap-2">
                  <Input placeholder="Descripción de la tarea" value={tar.descripcion} onChange={(e) => handleUpdateTarea(tar.id, 'descripcion', e.target.value)} />
                  <input type="checkbox" checked={tar.completada} onChange={(e) => handleUpdateTarea(tar.id, 'completada', e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
                  <Button variant="destructive" size="icon" onClick={() => handleRemoveTarea(tar.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddTarea}><Plus className="h-4 w-4 mr-2" /> Añadir Tarea</Button>
            </div>

            {/* Herramientas */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-bold text-slate-900">Herramientas</h3>
              {formData.herramientas.map((herr, index) => (
                <div key={herr.id} className="flex items-center gap-2">
                  <Input placeholder="Nombre" value={herr.nombre} onChange={(e) => handleUpdateHerramienta(herr.id, 'nombre', e.target.value)} />
                  <Input type="number" placeholder="Cantidad" value={herr.cantidad} onChange={(e) => handleUpdateHerramienta(herr.id, 'cantidad', Number(e.target.value))} />
                  <Button variant="destructive" size="icon" onClick={() => handleRemoveHerramienta(herr.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddHerramienta}><Plus className="h-4 w-4 mr-2" /> Añadir Herramienta</Button>
            </div>

            {/* Adjuntos */}
            <div className="space-y-2 border-t pt-4">
              <FileUpload
                label="Documentos Adjuntos"
                description="Arrastra o haz click para subir documentos relacionados al proyecto (PDF, imágenes, etc.)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={formData.adjuntos}
                maxFiles={5} // Permitir múltiples adjuntos
                accept={{ 'image/*': ['.jpeg', '.png', '.gif'], 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }}
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProject}>Guardar Proyecto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
