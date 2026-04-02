
'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
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
import { Plus, Pencil, Trash2, Upload, Download, AlertCircle, CheckCircle, Search, Printer, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface CatTarea {
  id: string
  codigo: string | null
  nombre: string
  categoria: string
  frecuencia: string | null
  responsable: string | null
  prioridad: string
}

const categoriaOptions = [
  'Electricidad',
  'Hidráulico',
  'Ascensores',
  'Gas',
  'Climatización',
  'Seguridad',
  'Infraestructura',
  'Áreas Verdes',
  'Limpieza',
  'Pintura',
  'General'
]

const frecuenciaOptions = [
  'Diaria',
  'Semanal',
  'Quincenal',
  'Mensual',
  'Bimestral',
  'Trimestral',
  'Semestral',
  'Anual'
]

const prioridadOptions = ['Urgente', 'Alta', 'Media', 'Baja']

const prioridadColors: Record<string, string> = {
  'Urgente': 'bg-red-100 text-red-700 border-red-200',
  'Alta': 'bg-orange-100 text-orange-700 border-orange-200',
  'Media': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Baja': 'bg-green-100 text-green-700 border-green-200',
}

const categoriaColors: Record<string, string> = {
  'Electricidad': 'bg-yellow-100 text-yellow-700',
  'Hidráulico': 'bg-blue-100 text-blue-700',
  'Ascensores': 'bg-purple-100 text-purple-700',
  'Gas': 'bg-red-100 text-red-700',
  'Climatización': 'bg-cyan-100 text-cyan-700',
  'Seguridad': 'bg-slate-100 text-slate-700',
  'Infraestructura': 'bg-amber-100 text-amber-700',
  'Áreas Verdes': 'bg-green-100 text-green-700',
  'Limpieza': 'bg-teal-100 text-teal-700',
  'Pintura': 'bg-pink-100 text-pink-700',
  'General': 'bg-gray-100 text-gray-700',
}

export function TareasModule() {
  const [tareas, setTareas] = useState<CatTarea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [prioridadFilter, setPrioridadFilter] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatTarea | null>(null)

  // Form
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria: 'General',
    frecuencia: '',
    responsable: '',
    prioridad: 'Media'
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'categoria', label: 'Categoría', defaultVisible: true },
    { key: 'frecuencia', label: 'Frecuencia', defaultVisible: true },
    { key: 'responsable', label: 'Responsable', defaultVisible: true },
    { key: 'prioridad', label: 'Prioridad', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'categoria', label: 'Categoría', type: 'select', options: categoriaOptions },
    { key: 'prioridad', label: 'Prioridad', type: 'select', options: prioridadOptions },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'tareas',
    moduleLabel: 'Tareas',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => tareas
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoriaFilter) params.append('categoria', categoriaFilter)
      if (prioridadFilter) params.append('prioridad', prioridadFilter)

      const url = params.toString() ? `/api/catalogos/tareas?${params.toString()}` : '/api/catalogos/tareas'
      const res = await fetch(url)
      setTareas(await res.json())
    } catch (error) {
      console.error('Error fetching tareas:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [categoriaFilter, prioridadFilter])

  // Filter by search
  const filteredTareas = tareas.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.codigo && t.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.responsable && t.responsable.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openDialog = (item?: CatTarea) => {
    if (item) {
      setEditingItem(item)
      setForm({
        codigo: item.codigo || '',
        nombre: item.nombre,
        categoria: item.categoria,
        frecuencia: item.frecuencia || '',
        responsable: item.responsable || '',
        prioridad: item.prioridad
      })
    } else {
      setEditingItem(null)
      setForm({
        codigo: '',
        nombre: '',
        categoria: 'General',
        frecuencia: '',
        responsable: '',
        prioridad: 'Media'
      })
    }
    setDialogOpen(true)
  }

  const saveItem = async () => {
    if (!form.nombre.trim()) return
    try {
      if (editingItem) {
        await fetch(`/api/catalogos/tareas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('Tarea actualizada con éxito')
      } else {
        await fetch('/api/catalogos/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('Tarea creada con éxito')
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving tarea:', error)
      toast.error('Error al guardar tarea')
    }
  }

  const deleteItem = async (id: string) => {
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

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  const handleMassImport = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }

    setImportLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet) as any[]

        const transformedData = json.map(item => ({
          codigo: item.Codigo || null,
          nombre: item.Nombre || '',
          categoria: item.Categoria || 'General',
          frecuencia: item.Frecuencia || null,
          responsable: item.Responsable || null,
          prioridad: item.Prioridad || 'Media',
        }))

        const res = await fetch('/api/catalogos/tareas/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Tareas importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar tareas. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  // Export to printable view
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Catálogo de Tareas - Asesorías Integrales CyJ</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0f2040; margin-bottom: 10px; }
          h2 { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #0f2040; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Asesorías Integrales CyJ</h1>
        <h2>Catálogo de Tareas - ${new Date().toLocaleDateString('es-CL')}</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Frecuencia</th>
              <th>Responsable</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTareas.map(t => `
              <tr>
                <td>${t.codigo || ''}</td>
                <td>${t.nombre}</td>
                <td>${t.categoria}</td>
                <td>${t.frecuencia || ''}</td>
                <td>${t.responsable || ''}</td>
                <td>${t.prioridad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generado el ${new Date().toLocaleString('es-CL')} | Total: ${filteredTareas.length} tareas
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando tareas...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><FileSpreadsheet className="w-5 h-5 text-green-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Catálogo de Tareas</h2>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.filter(t => t.prioridad === 'Urgente' || t.prioridad === 'Alta').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas (Simulado)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.filter(t => t.prioridad === 'Baja').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar tarea..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {categoriaOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las prioridades</SelectItem>
            {prioridadOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando tareas...</div>
        ) : filteredTareas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay tareas que coincidan con la búsqueda.</div>
        ) : (
          filteredTareas.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                <div>
                  <Badge variant="outline" className={categoriaColors[t.categoria]}>{t.categoria}</Badge>
                  <CardTitle className="text-base mt-2 truncate max-w-[150px]">{t.nombre}</CardTitle>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.codigo || 'N/A'}</span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Frecuencia: {t.frecuencia || 'N/A'}</span>
                  <span>Responsable: {t.responsable || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Prioridad: <Badge variant="outline" className={prioridadColors[t.prioridad]}>{t.prioridad}</Badge></span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(t); }}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={(e) => { e.stopPropagation(); deleteItem(t.id); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogo Nueva/Editar Tarea */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Nueva'} Tarea</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categoriaOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia</Label>
              <Select value={form.frecuencia} onValueChange={(v) => setForm({ ...form, frecuencia: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una frecuencia" /></SelectTrigger>
                <SelectContent>
                  {frecuenciaOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input id="responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una prioridad" /></SelectTrigger>
                <SelectContent>
                  {prioridadOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Guardar Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Tareas Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las tareas. Asegúrate de que las columnas coincidan con los campos (Código, Nombre, Categoría, Frecuencia, Responsable, Prioridad).</p>
            <FileUpload
              label="Archivo de Tareas"
              description="Arrastra o haz click para subir el archivo (XLSX, CSV)"
              onFileUpload={handleImportFileChange}
              onFileRemove={() => handleImportFileChange(null)}
              currentFiles={importFile ? [importFile.name] : []}
              maxFiles={1}
              accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }}
            />
            {importLoading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importando...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMassImport} disabled={!importFile || importLoading}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
