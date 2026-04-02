
'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Pencil, Trash2, Upload, Download, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { useSession } from '@/hooks/use-session'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface CatMaterial {
  id: string
  nombre: string
  unidad: string
  precioUnit: number
  categoria: string
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
  const [tareas, setTareas] = useState<CatTarea[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [matDialogOpen, setMatDialogOpen] = useState(false)
  const [tarDialogOpen, setTarDialogOpen] = useState(false)
  const [editingMat, setEditingMat] = useState<CatMaterial | null>(null)
  const [editingTar, setEditingTar] = useState<CatTarea | null>(null)

  // Bulk upload
  const [bulkMatDialogOpen, setBulkMatDialogOpen] = useState(false)
  const [bulkTarDialogOpen, setBulkTarDialogOpen] = useState(false)
  const [bulkMatFile, setBulkMatFile] = useState<File | null>(null)
  const [bulkTarFile, setBulkTarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const { hasPermission } = useSession()
  const canEdit = hasPermission('catalogos.editar')

  // Forms
  const [matForm, setMatForm] = useState({ nombre: '', unidad: 'unidad', precioUnit: 0, categoria: 'General' })
  const [tarForm, setTarForm] = useState({ nombre: '', categoria: 'General' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [matRes, tarRes] = await Promise.all([
        fetch('/api/catalogos/materiales'),
        fetch('/api/catalogos/tareas'),
      ])
      setMateriales(await matRes.json())
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
        toast.success('Material actualizado con éxito')
      } else {
        await fetch('/api/catalogos/materiales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matForm),
        })
        toast.success('Material creado con éxito')
      }
      setMatDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Error al guardar material')
    }
  }

  const deleteMat = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return
    try {
      await fetch(`/api/catalogos/materiales/${id}`, { method: 'DELETE' })
      fetchData()
      toast.success('Material eliminado con éxito')
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Error al eliminar material')
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
        toast.success('Tarea actualizada con éxito')
      } else {
        await fetch('/api/catalogos/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tarForm),
        })
        toast.success('Tarea creada con éxito')
      }
      setTarDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving tarea:', error)
      toast.error('Error al guardar tarea')
    }
  }

  const deleteTar = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      await fetch(`/api/catalogos/tareas/${id}`, { method: 'DELETE' })
      fetchData()
      toast.success('Tarea eliminada con éxito')
    } catch (error) {
      console.error('Error deleting tarea:', error)
      toast.error('Error al eliminar tarea')
    }
  }

  // Bulk upload materials
  const handleBulkMatFileChange = (file: File | null) => {
    setBulkMatFile(file)
  }

  const handleBulkMatUpload = async () => {
    if (!bulkMatFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet) as any[]

        const transformedData = json.map(item => ({
          nombre: item.Nombre || '',
          unidad: item.Unidad || 'unidad',
          precioUnit: Number(item['Precio Unitario']) || 0,
          categoria: item.Categoria || 'General',
        }))

        const res = await fetch('/api/catalogos/materiales/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Materiales importados con éxito.')
        setBulkMatDialogOpen(false)
        setBulkMatFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(bulkMatFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar materiales. Verifica el formato del archivo.')
    } finally {
      setUploading(false)
    }
  }

  // Bulk upload tasks
  const handleBulkTarFileChange = (file: File | null) => {
    setBulkTarFile(file)
  }

  const handleBulkTarUpload = async () => {
    if (!bulkTarFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet) as any[]

        const transformedData = json.map(item => ({
          nombre: item.Nombre || '',
          categoria: item.Categoria || 'General',
        }))

        const res = await fetch('/api/catalogos/tareas/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Tareas importadas con éxito.')
        setBulkTarDialogOpen(false)
        setBulkTarFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(bulkTarFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar tareas. Verifica el formato del archivo.')
    } finally {
      setUploading(false)
    }
  }

  // Export functions
  const exportMateriales = () => {
    const ws = XLSX.utils.json_to_sheet(materiales.map(m => ({
      Nombre: m.nombre,
      Categoria: m.categoria,
      Unidad: m.unidad,
      'Precio Unitario': m.precioUnit,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Materiales')
    XLSX.writeFile(wb, 'materiales.xlsx')
    toast.success('Materiales exportados con éxito')
  }

  const exportTareas = () => {
    const ws = XLSX.utils.json_to_sheet(tareas.map(t => ({
      Nombre: t.nombre,
      Categoria: t.categoria,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tareas')
    XLSX.writeFile(wb, 'tareas.xlsx')
    toast.success('Tareas exportadas con éxito')
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando catálogos...</div>
  }

  return (
    <div className="space-y-5">
      {/* Materials Card */}
      <Card>
        <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">🧱 Catálogo de Materiales ({materiales.length})</CardTitle>
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button size="sm" variant="outline" onClick={exportMateriales}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setBulkMatFile(null); setBulkMatDialogOpen(true) }}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Carga Masiva
                </Button>
                <Button size="sm" onClick={() => openMatDialog()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Unidad</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">P.Unit.</th>
                  {canEdit && <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase"></th>}
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
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openMatDialog(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteMat(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">📋 Catálogo de Tareas ({tareas.length})</CardTitle>
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button size="sm" variant="outline" onClick={exportTareas}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Exportar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setBulkTarFile(null); setBulkTarDialogOpen(true) }}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Carga Masiva
                </Button>
                <Button size="sm" onClick={() => openTarDialog()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                  {canEdit && <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase"></th>}
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
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openTarDialog(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteTar(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogo Nuevo/Editar Material */}
      <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMat ? 'Editar' : 'Nuevo'} Material</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={matForm.nombre} onChange={(e) => setMatForm({ ...matForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input id="unidad" value={matForm.unidad} onChange={(e) => setMatForm({ ...matForm, unidad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioUnit">Precio Unitario</Label>
              <Input id="precioUnit" type="number" value={matForm.precioUnit} onChange={(e) => setMatForm({ ...matForm, precioUnit: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" value={matForm.categoria} onChange={(e) => setMatForm({ ...matForm, categoria: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMat}>Guardar Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Nuevo/Editar Tarea */}
      <Dialog open={tarDialogOpen} onOpenChange={setTarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTar ? 'Editar' : 'Nueva'} Tarea</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={tarForm.nombre} onChange={(e) => setTarForm({ ...tarForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" value={tarForm.categoria} onChange={(e) => setTarForm({ ...tarForm, categoria: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTar}>Guardar Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Carga Masiva de Materiales */}
      <Dialog open={bulkMatDialogOpen} onOpenChange={setBulkMatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carga Masiva de Materiales</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los materiales. Asegúrate de que las columnas sean: Nombre, Unidad, Precio Unitario, Categoría.</p>
            <FileUpload
              label="Archivo de Materiales"
              description="Arrastra o haz click para subir el archivo (XLSX, CSV)"
              onFileUpload={handleBulkMatFileChange}
              onFileRemove={() => handleBulkMatFileChange(null)}
              currentFiles={bulkMatFile ? [bulkMatFile.name] : []}
              maxFiles={1}
              accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMatDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkMatUpload} disabled={!bulkMatFile || uploading}>Subir Materiales</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Carga Masiva de Tareas */}
      <Dialog open={bulkTarDialogOpen} onOpenChange={setBulkTarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carga Masiva de Tareas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con las tareas. Asegúrate de que las columnas sean: Nombre, Categoría.</p>
            <FileUpload
              label="Archivo de Tareas"
              description="Arrastra o haz click para subir el archivo (XLSX, CSV)"
              onFileUpload={handleBulkTarFileChange}
              onFileRemove={() => handleBulkTarFileChange(null)}
              currentFiles={bulkTarFile ? [bulkTarFile.name] : []}
              maxFiles={1}
              accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkTarUpload} disabled={!bulkTarFile || uploading}>Subir Tareas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
