
'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Upload, Download, AlertCircle, CheckCircle, Search, Printer, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface CatHerramienta {
  id: string
  codigo: string | null
  nombre: string
  marca: string | null
  cantidad: number
  ubicacion: string | null
  estado: string
  precioUnitario: number
  fechaAdquisicion: string | null
  descripcion: string | null
}

const ESTADOS = ['Bueno', 'Regular', 'Malo', 'En reparación']

const MARCAS = [
  'Bosch', 'Makita', 'DeWalt', 'Stanley', 'Black+Decker',
  'Hitachi', 'Milwaukee', 'Craftsman', 'Ryobi', 'Hilti', 'Otro'
]

const UBICACIONES = [
  'Bodega A', 'Bodega B', 'Taller', 'Oficina', 'Área Común', 'Otro'
]

const formatCLP = (n: number) =>
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

// Generate next codigo
const generateCodigo = (items: CatHerramienta[]): string => {
  const existingCodes = items
    .filter(h => h.codigo && h.codigo.startsWith('HER-'))
    .map(h => parseInt(h.codigo!.replace('HER-', ''), 10))
    .filter(n => !isNaN(n))

  const maxNum = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
  return `HER-${String(maxNum + 1).padStart(3, '0')}`
}

export function HerramientasModule() {
  const [herramientas, setHerramientas] = useState<CatHerramienta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatHerramienta | null>(null)

  // Form
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    cantidad: 1,
    ubicacion: '',
    estado: 'Bueno',
    precioUnitario: 0,
    fechaAdquisicion: ''
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'marca', label: 'Marca', defaultVisible: true },
    { key: 'cantidad', label: 'Cantidad', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'precioUnitario', label: 'Precio Unitario', defaultVisible: true },
    { key: 'fechaAdquisicion', label: 'Fecha Adquisición', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS },
    { key: 'marca', label: 'Marca', type: 'select', options: MARCAS },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'herramientas',
    moduleLabel: 'Herramientas',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => herramientas
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/catalogos/herramientas')
      setHerramientas(await res.json())
    } catch (error) {
      console.error('Error fetching herramientas:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [])

  // Filter by search and estado
  const filteredHerramientas = herramientas.filter(h => {
    const matchesSearch =
      h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.codigo && h.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.marca && h.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.ubicacion && h.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesEstado = !estadoFilter || h.estado === estadoFilter

    return matchesSearch && matchesEstado
  })

  // Calculate totals
  const totalValor = filteredHerramientas.reduce((sum, h) => sum + (h.cantidad * h.precioUnitario), 0)
  const totalCantidad = filteredHerramientas.reduce((sum, h) => sum + h.cantidad, 0)

  const openDialog = (item?: CatHerramienta) => {
    if (item) {
      setEditingItem(item)
      setForm({
        codigo: item.codigo || '',
        nombre: item.nombre,
        marca: item.marca || '',
        cantidad: item.cantidad,
        ubicacion: item.ubicacion || '',
        estado: item.estado,
        precioUnitario: item.precioUnitario,
        fechaAdquisicion: item.fechaAdquisicion || ''
      })
    } else {
      setEditingItem(null)
      setForm({
        codigo: generateCodigo(herramientas),
        nombre: '',
        marca: '',
        cantidad: 1,
        ubicacion: '',
        estado: 'Bueno',
        precioUnitario: 0,
        fechaAdquisicion: new Date().toISOString().split('T')[0]
      })
    }
    setDialogOpen(true)
  }

  const saveItem = async () => {
    if (!form.nombre.trim()) return
    try {
      const payload = {
        ...form,
        codigo: form.codigo || generateCodigo(herramientas),
        cantidad: parseInt(String(form.cantidad)) || 1,
        precioUnitario: parseFloat(String(form.precioUnitario)) || 0
      }

      if (editingItem) {
        await fetch(`/api/catalogos/herramientas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Herramienta actualizada con éxito')
      } else {
        await fetch('/api/catalogos/herramientas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Herramienta creada con éxito')
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving herramienta:', error)
      toast.error('Error al guardar herramienta')
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('¿Eliminar esta herramienta?')) return
    try {
      await fetch(`/api/catalogos/herramientas/${id}`, { method: 'DELETE' })
      fetchData()
      toast.success('Herramienta eliminada con éxito')
    } catch (error) {
      console.error('Error deleting herramienta:', error)
      toast.error('Error al eliminar herramienta')
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
          marca: item.Marca || null,
          cantidad: Number(item.Cantidad) || 0,
          ubicacion: item.Ubicacion || null,
          estado: item.Estado || 'Bueno',
          precioUnitario: Number(item.PrecioUnitario) || 0,
          fechaAdquisicion: item.FechaAdquisicion || null,
          descripcion: item.Descripcion || null,
        }))

        const res = await fetch('/api/catalogos/herramientas/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Herramientas importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar herramientas. Verifica el formato del archivo.')
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
        <title>Catálogo de Herramientas - Asesorías Integrales CyJ</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0f2040; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .badge { 
            display: inline-block; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: bold; 
            color: white; 
            background-color: #6c757d; /* Default grey */
          }
          .badge-bueno { background-color: #28a745; } /* Green */
          .badge-regular { background-color: #ffc107; } /* Yellow */
          .badge-malo { background-color: #dc3545; } /* Red */
          .badge-reparacion { background-color: #007bff; } /* Blue */
        </style>
      </head>
      <body>
        <h1>Catálogo de Herramientas</h1>
        <p>Fecha de impresión: ${new Date().toLocaleDateString('es-CL')}</p>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Cantidad</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Precio Unitario</th>
              <th>Fecha Adquisición</th>
            </tr>
          </thead>
          <tbody>
            ${filteredHerramientas.map(h => `
              <tr>
                <td>${h.codigo || 'N/A'}</td>
                <td>${h.nombre}</td>
                <td>${h.marca || 'N/A'}</td>
                <td>${h.cantidad}</td>
                <td>${h.ubicacion || 'N/A'}</td>
                <td><span class="badge badge-${h.estado.toLowerCase().replace(' ', '-')}">${h.estado}</span></td>
                <td>${formatCLP(h.precioUnitario)}</td>
                <td>${h.fechaAdquisicion ? new Date(h.fechaAdquisicion).toLocaleDateString('es-CL') : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
    return <div className="p-8 text-center text-slate-400">Cargando herramientas...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Wrench className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Catálogo de Herramientas</h2>
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
            <Plus className="w-4 h-4 mr-1" /> Nueva Herramienta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Herramientas</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{herramientas.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad Total</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCantidad}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(totalValor)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar herramienta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {ESTADOS.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando herramientas...</div>
        ) : filteredHerramientas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay herramientas que coincidan con la búsqueda.</div>
        ) : (
          filteredHerramientas.map((h) => (
            <Card key={h.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                <div>
                  <Badge variant="outline" className={`
                    ${h.estado === 'Bueno' && 'bg-green-100 text-green-700'}
                    ${h.estado === 'Regular' && 'bg-yellow-100 text-yellow-700'}
                    ${h.estado === 'Malo' && 'bg-red-100 text-red-700'}
                    ${h.estado === 'En reparación' && 'bg-blue-100 text-blue-700'}
                  `}>{h.estado}</Badge>
                  <CardTitle className="text-base mt-2 truncate max-w-[150px]">{h.nombre}</CardTitle>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{h.codigo || 'N/A'}</span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Marca: {h.marca || 'N/A'}</span>
                  <span>Cantidad: {h.cantidad}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Ubicación: {h.ubicacion || 'N/A'}</span>
                  <span className="text-slate-900 font-mono">{formatCLP(h.precioUnitario)}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(h); }}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={(e) => { e.stopPropagation(); deleteItem(h.id); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogo Nueva/Editar Herramienta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Nueva'} Herramienta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Generado automáticamente si está vacío" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Select value={form.marca} onValueChange={(v) => setForm({ ...form, marca: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una marca" /></SelectTrigger>
                <SelectContent>
                  {MARCAS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Select value={form.ubicacion} onValueChange={(v) => setForm({ ...form, ubicacion: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una ubicación" /></SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioUnitario">Precio Unitario</Label>
              <Input id="precioUnitario" type="number" value={form.precioUnitario} onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaAdquisicion">Fecha de Adquisición</Label>
              <Input id="fechaAdquisicion" type="date" value={form.fechaAdquisicion} onChange={(e) => setForm({ ...form, fechaAdquisicion: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-full">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Guardar Herramienta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Herramientas Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las herramientas. Asegúrate de que las columnas coincidan con los campos (Código, Nombre, Marca, Cantidad, Ubicación, Estado, Precio Unitario, Fecha Adquisición, Descripción).</p>
            <FileUpload
              label="Archivo de Herramientas"
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
