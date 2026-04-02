'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

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
}

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

export function ProyectosModule() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProy, setEditingProy] = useState<Proyecto | null>(null)
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

  const fetchProyectos = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/proyectos?search=${encodeURIComponent(searchTerm)}` : '/api/proyectos'
      const res = await fetch(url)
      const data = await res.json()
      setProyectos(data)
    } catch (error) {
      console.error('Error fetching proyectos:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchProyectos()
    })()
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
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return

    try {
      if (editingProy) {
        await fetch(`/api/proyectos/${editingProy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/proyectos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      setDialogOpen(false)
      fetchProyectos(search)
    } catch (error) {
      console.error('Error saving proyecto:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    try {
      await fetch(`/api/proyectos/${id}`, { method: 'DELETE' })
      fetchProyectos(search)
    } catch (error) {
      console.error('Error deleting proyecto:', error)
    }
  }

  return (
    <div className="space-y-5">
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
          <Plus className="w-4 h-4 mr-1" /> Nuevo Proyecto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Proyectos ({proyectos.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Inicio</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fin</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Pres. Prog.</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Pres. Usado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Avance</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : proyectos.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin proyectos</td></tr>
                ) : (
                  proyectos.map((proy) => (
                    <tr key={proy.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">{proy.nombre}</td>
                      <td className="p-3">
                        <Badge className={categoriaColors[proy.categoria] || 'bg-slate-100'}>{proy.categoria}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[proy.estado] || 'bg-slate-100'}>{proy.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs">{formatDate(proy.fechaInicio)}</td>
                      <td className="p-3 text-xs">{formatDate(proy.fechaFin)}</td>
                      <td className="p-3 font-mono text-xs">{formatCLP(proy.presProg)}</td>
                      <td className="p-3 font-mono text-xs text-red-600">{formatCLP(proy.presUsado)}</td>
                      <td className="p-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={proy.avance} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-slate-500">{proy.avance}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(proy)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(proy.id)}>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingProy ? 'Editar' : 'Nuevo'} Proyecto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Áreas Verdes', 'Eléctrico', 'Sanitario', 'Infraestructura', 'Seguridad', 'Administración', 'Otro'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Planificado', 'En Ejecución', 'Completado', 'Cancelado', 'Pausado'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Presupuesto Programado ($)</Label>
                <Input type="number" value={formData.presProg} onChange={(e) => setFormData({...formData, presProg: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Presupuesto Utilizado ($)</Label>
                <Input type="number" value={formData.presUsado} onChange={(e) => setFormData({...formData, presUsado: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avance: {formData.avance}%</Label>
              <input type="range" min="0" max="100" value={formData.avance} onChange={(e) => setFormData({...formData, avance: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input type="date" value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Proyecto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
