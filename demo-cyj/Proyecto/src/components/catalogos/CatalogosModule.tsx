'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CatMaterial {
  id: string
  nombre: string
  unidad: string
  precioUnit: number
  categoria: string
}

interface CatHerramienta {
  id: string
  nombre: string
  cantidad: number
  ubicacion: string | null
}

interface CatTarea {
  id: string
  nombre: string
  categoria: string
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

export function CatalogosModule() {
  const [materiales, setMateriales] = useState<CatMaterial[]>([])
  const [herramientas, setHerramientas] = useState<CatHerramienta[]>([])
  const [tareas, setTareas] = useState<CatTarea[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [matDialogOpen, setMatDialogOpen] = useState(false)
  const [herDialogOpen, setHerDialogOpen] = useState(false)
  const [tarDialogOpen, setTarDialogOpen] = useState(false)
  const [editingMat, setEditingMat] = useState<CatMaterial | null>(null)
  const [editingHer, setEditingHer] = useState<CatHerramienta | null>(null)
  const [editingTar, setEditingTar] = useState<CatTarea | null>(null)

  // Forms
  const [matForm, setMatForm] = useState({ nombre: '', unidad: 'unidad', precioUnit: 0, categoria: 'General' })
  const [herForm, setHerForm] = useState({ nombre: '', cantidad: 1, ubicacion: '' })
  const [tarForm, setTarForm] = useState({ nombre: '', categoria: 'General' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [matRes, herRes, tarRes] = await Promise.all([
        fetch('/api/catalogos/materiales'),
        fetch('/api/catalogos/herramientas'),
        fetch('/api/catalogos/tareas'),
      ])
      setMateriales(await matRes.json())
      setHerramientas(await herRes.json())
      setTareas(await tarRes.json())
    } catch (error) {
      console.error('Error fetching catalogos:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [])

  // Materials
  const openMatDialog = (mat?: CatMaterial) => {
    if (mat) {
      setEditingMat(mat)
      setMatForm({ nombre: mat.nombre, unidad: mat.unidad, precioUnit: mat.precioUnit, categoria: mat.categoria })
    } else {
      setEditingMat(null)
      setMatForm({ nombre: '', unidad: 'unidad', precioUnit: 0, categoria: 'General' })
    }
    setMatDialogOpen(true)
  }

  const saveMat = async () => {
    if (!matForm.nombre.trim()) return
    try {
      if (editingMat) {
        await fetch(`/api/catalogos/materiales/${editingMat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matForm),
        })
      } else {
        await fetch('/api/catalogos/materiales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matForm),
        })
      }
      setMatDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving material:', error)
    }
  }

  const deleteMat = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return
    try {
      await fetch(`/api/catalogos/materiales/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  // Tools
  const openHerDialog = (her?: CatHerramienta) => {
    if (her) {
      setEditingHer(her)
      setHerForm({ nombre: her.nombre, cantidad: her.cantidad, ubicacion: her.ubicacion || '' })
    } else {
      setEditingHer(null)
      setHerForm({ nombre: '', cantidad: 1, ubicacion: '' })
    }
    setHerDialogOpen(true)
  }

  const saveHer = async () => {
    if (!herForm.nombre.trim()) return
    try {
      if (editingHer) {
        await fetch(`/api/catalogos/herramientas/${editingHer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(herForm),
        })
      } else {
        await fetch('/api/catalogos/herramientas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(herForm),
        })
      }
      setHerDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving herramienta:', error)
    }
  }

  const deleteHer = async (id: string) => {
    if (!confirm('¿Eliminar esta herramienta?')) return
    try {
      await fetch(`/api/catalogos/herramientas/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting herramienta:', error)
    }
  }

  // Tasks
  const openTarDialog = (tar?: CatTarea) => {
    if (tar) {
      setEditingTar(tar)
      setTarForm({ nombre: tar.nombre, categoria: tar.categoria })
    } else {
      setEditingTar(null)
      setTarForm({ nombre: '', categoria: 'General' })
    }
    setTarDialogOpen(true)
  }

  const saveTar = async () => {
    if (!tarForm.nombre.trim()) return
    try {
      if (editingTar) {
        await fetch(`/api/catalogos/tareas/${editingTar.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tarForm),
        })
      } else {
        await fetch('/api/catalogos/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tarForm),
        })
      }
      setTarDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving tarea:', error)
    }
  }

  const deleteTar = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      await fetch(`/api/catalogos/tareas/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting tarea:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando catálogos...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Materials */}
      <Card>
        <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">🧱 Catálogo de Materiales ({materiales.length})</CardTitle>
          <Button size="sm" onClick={() => openMatDialog()}><Plus className="w-3.5 h-3.5 mr-1" /> Agregar</Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Unidad</th>
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">P.Unit.</th>
                <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {materiales.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Sin materiales</td></tr>
              ) : (
                materiales.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-3 font-semibold">{m.nombre}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{m.categoria}</Badge></td>
                    <td className="p-3 text-xs">{m.unidad}</td>
                    <td className="p-3 font-mono text-xs">{formatCLP(m.precioUnit)}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openMatDialog(m)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => deleteMat(m.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">🔨 Catálogo de Herramientas ({herramientas.length})</CardTitle>
          <Button size="sm" onClick={() => openHerDialog()}><Plus className="w-3.5 h-3.5 mr-1" /> Agregar</Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Cantidad</th>
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Ubicación</th>
                <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {herramientas.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-xs">Sin herramientas</td></tr>
              ) : (
                herramientas.map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-3 font-semibold">{h.nombre}</td>
                    <td className="p-3 text-center font-mono">{h.cantidad}</td>
                    <td className="p-3 text-xs">{h.ubicacion || '–'}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openHerDialog(h)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => deleteHer(h.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tasks - Full width */}
      <Card className="lg:col-span-2">
        <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">✅ Catálogo de Tareas ({tareas.length})</CardTitle>
          <Button size="sm" onClick={() => openTarDialog()}><Plus className="w-3.5 h-3.5 mr-1" /> Agregar</Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {tareas.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-slate-400 text-xs">Sin tareas</td></tr>
              ) : (
                tareas.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-3 font-semibold">{t.nombre}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{t.categoria}</Badge></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openTarDialog(t)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => deleteTar(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Material Dialog */}
      <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMat ? 'Editar' : 'Nuevo'} Material</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={matForm.nombre} onChange={(e) => setMatForm({...matForm, nombre: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Categoría</Label><Input value={matForm.categoria} onChange={(e) => setMatForm({...matForm, categoria: e.target.value})} /></div>
              <div className="space-y-2"><Label>Unidad</Label>
                <Select value={matForm.unidad} onValueChange={(v) => setMatForm({...matForm, unidad: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['unidad', 'metro', 'm²', 'm³', 'kilo', 'saco', 'litro', 'galón', 'caja', 'rollo'].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Precio Unitario ($)</Label><Input type="number" value={matForm.precioUnit} onChange={(e) => setMatForm({...matForm, precioUnit: parseFloat(e.target.value) || 0})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMat}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Herramienta Dialog */}
      <Dialog open={herDialogOpen} onOpenChange={setHerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingHer ? 'Editar' : 'Nueva'} Herramienta</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={herForm.nombre} onChange={(e) => setHerForm({...herForm, nombre: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cantidad</Label><Input type="number" value={herForm.cantidad} onChange={(e) => setHerForm({...herForm, cantidad: parseInt(e.target.value) || 1})} /></div>
              <div className="space-y-2"><Label>Ubicación</Label><Input value={herForm.ubicacion} onChange={(e) => setHerForm({...herForm, ubicacion: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHerDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveHer}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tarea Dialog */}
      <Dialog open={tarDialogOpen} onOpenChange={setTarDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingTar ? 'Editar' : 'Nueva'} Tarea</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={tarForm.nombre} onChange={(e) => setTarForm({...tarForm, nombre: e.target.value})} /></div>
            <div className="space-y-2"><Label>Categoría</Label><Input value={tarForm.categoria} onChange={(e) => setTarForm({...tarForm, categoria: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
