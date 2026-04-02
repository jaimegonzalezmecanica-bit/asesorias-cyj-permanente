
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Upload, Download, AlertCircle, CheckCircle, Search, Printer, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface CatMaterial {
  id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  unidad: string
  precioUnit: number
  stockActual: number
  stockMinimo: number
  categoria: string
  ubicacion: string | null
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const CATEGORIAS = [
  'Construcción',
  'Electricidad',
  'Fontanería',
  'Ferretería',
  'Pintura',
  'Jardinería',
  'Limpieza',
  'Seguridad',
  'General'
]

const UNIDADES = [
  'unidad',
  'saco',
  'kg',
  'litro',
  'galón',
  'metro',
  'm²',
  'm³',
  'caja',
  'rollo',
  'tubo',
  'lata',
  'bolsa',
  'pie'
]

const UBICACIONES = [
  'Bodega A',
  'Bodega B',
  'Bodega C',
  'Almacén Principal',
  'Container 1',
  'Container 2',
  'Patio',
  'Oficina'
]

export function MaterialesModule() {
  const [materiales, setMateriales] = useState<CatMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatMaterial | null>(null)

  // Form
  const [form, setForm] = useState({ 
    codigo: '', 
    nombre: '', 
    descripcion: '', 
    unidad: 'unidad', 
    precioUnit: 0, 
    stockActual: 0, 
    stockMinimo: 0, 
    categoria: 'General',
    ubicacion: ''
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'unidad', label: 'Unidad', defaultVisible: true },
    { key: 'precioUnit', label: 'Precio Unitario', defaultVisible: true },
    { key: 'stockActual', label: 'Stock Actual', defaultVisible: true },
    { key: 'stockMinimo', label: 'Stock Mínimo', defaultVisible: true },
    { key: 'categoria', label: 'Categoría', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS },
    { key: 'unidad', label: 'Unidad', type: 'select', options: UNIDADES },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'materiales',
    moduleLabel: 'Materiales',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => materiales
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/catalogos/materiales')
      setMateriales(await res.json())
    } catch (error) {
      console.error('Error fetching materiales:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [])

  // Filter by search and categoria
  const filteredMateriales = materiales.filter(m => {
    const matchesSearch = 
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (m.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesCategoria = !categoriaFilter || m.categoria === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  const openDialog = (item?: CatMaterial) => {
    if (item) {
      setEditingItem(item)
      setForm({ 
        codigo: item.codigo || '', 
        nombre: item.nombre, 
        descripcion: item.descripcion || '', 
        unidad: item.unidad, 
        precioUnit: item.precioUnit, 
        stockActual: item.stockActual, 
        stockMinimo: item.stockMinimo, 
        categoria: item.categoria,
        ubicacion: item.ubicacion || ''
      })
    } else {
      setEditingItem(null)
      setForm({ 
        codigo: '', 
        nombre: '', 
        descripcion: '', 
        unidad: 'unidad', 
        precioUnit: 0, 
        stockActual: 0, 
        stockMinimo: 0, 
        categoria: 'General',
        ubicacion: ''
      })
    }
    setDialogOpen(true)
  }

  const saveItem = async () => {
    if (!form.nombre.trim()) return
    try {
      const payload = {
        ...form,
        codigo: form.codigo || null,
        descripcion: form.descripcion || null,
        ubicacion: form.ubicacion || null
      }
      
      if (editingItem) {
        await fetch(`/api/catalogos/materiales/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Material actualizado con éxito')
      } else {
        await fetch('/api/catalogos/materiales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Material creado con éxito')
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Error al guardar material')
    }
  }

  const deleteItem = async (id: string) => {
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
          descripcion: item.Descripcion || null,
          unidad: item.Unidad || 'unidad',
          precioUnit: Number(item['Precio Unitario']) || 0,
          stockActual: Number(item['Stock Actual']) || 0,
          stockMinimo: Number(item['Stock Mínimo']) || 0,
          categoria: item.Categoria || 'General',
          ubicacion: item.Ubicacion || null,
        }))

        const res = await fetch('/api/catalogos/materiales/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Materiales importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar materiales. Verifica el formato del archivo.')
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
        <title>Catálogo de Materiales - Asesorías Integrales CyJ</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0f2040; margin-bottom: 5px; }
          h2 { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background: #0f2040; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .badge { 
            display: inline-block; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: bold; 
            color: white; 
            background-color: #6c757d; /* Default grey */
          }
          .badge-construccion { background-color: #007bff; } /* Blue */
          .badge-electricidad { background-color: #ffc107; } /* Yellow */
          .badge-fontaneria { background-color: #28a745; } /* Green */
          .badge-ferreteria { background-color: #dc3545; } /* Red */
          .badge-pintura { background-color: #6f42c1; } /* Purple */
          .badge-jardineria { background-color: #20c997; } /* Teal */
          .badge-limpieza { background-color: #17a2b8; } /* Cyan */
          .badge-seguridad { background-color: #fd7e14; } /* Orange */
          .badge-general { background-color: #6c757d; } /* Grey */
        </style>
      </head>
      <body>
        <h1>Catálogo de Materiales</h1>
        <p>Fecha de impresión: ${new Date().toLocaleDateString('es-CL')}</p>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Precio Unitario</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Categoría</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMateriales.map(m => `
              <tr>
                <td>${m.codigo || 'N/A'}</td>
                <td>${m.nombre}</td>
                <td>${m.descripcion || 'N/A'}</td>
                <td>${m.unidad}</td>
                <td>${formatCLP(m.precioUnit)}</td>
                <td>${m.stockActual}</td>
                <td>${m.stockMinimo}</td>
                <td><span class="badge badge-${m.categoria.toLowerCase().replace(/ /g, '-')}">${m.categoria}</span></td>
                <td>${m.ubicacion || 'N/A'}</td>
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
    return <div className="p-8 text-center text-slate-400">Cargando materiales...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Package className="w-5 h-5 text-purple-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Catálogo de Materiales</h2>
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
            <Plus className="w-4 h-4 mr-1" /> Nuevo Material
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiales.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(materiales.reduce((sum, m) => sum + (m.stockActual * m.precioUnit), 0))}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiales.filter(m => m.stockActual <= m.stockMinimo).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar material..."
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
            {CATEGORIAS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando materiales...</div>
        ) : filteredMateriales.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay materiales que coincidan con la búsqueda.</div>
        ) : (
          filteredMateriales.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                <div>
                  <Badge variant="outline" className={`
                    ${m.categoria === 'Construcción' && 'bg-blue-100 text-blue-700'}
                    ${m.categoria === 'Electricidad' && 'bg-yellow-100 text-yellow-700'}
                    ${m.categoria === 'Fontanería' && 'bg-green-100 text-green-700'}
                    ${m.categoria === 'Ferretería' && 'bg-red-100 text-red-700'}
                    ${m.categoria === 'Pintura' && 'bg-purple-100 text-purple-700'}
                    ${m.categoria === 'Jardinería' && 'bg-teal-100 text-teal-700'}
                    ${m.categoria === 'Limpieza' && 'bg-cyan-100 text-cyan-700'}
                    ${m.categoria === 'Seguridad' && 'bg-orange-100 text-orange-700'}
                    ${m.categoria === 'General' && 'bg-slate-100 text-slate-700'}
                  `}>{m.categoria}</Badge>
                  <CardTitle className="text-base mt-2 truncate max-w-[150px]">{m.nombre}</CardTitle>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{m.codigo || 'N/A'}</span>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Unidad: {m.unidad}</span>
                  <span>Stock: {m.stockActual}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                  <span>Ubicación: {m.ubicacion || 'N/A'}</span>
                  <span className="text-slate-900 font-mono">{formatCLP(m.precioUnit)}</span>
                </div>
                {m.stockActual <= m.stockMinimo && (
                  <div className="flex items-center gap-2 text-[10px] text-red-500 font-semibold">
                    <AlertCircle className="w-3 h-3" /> Stock bajo: {m.stockMinimo} {m.unidad}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(m); }}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={(e) => { e.stopPropagation(); deleteItem(m.id); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogo Nueva/Editar Material */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Nuevo'} Material</DialogTitle>
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
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Select value={form.unidad} onValueChange={(v) => setForm({ ...form, unidad: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una unidad" /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioUnit">Precio Unitario</Label>
              <Input id="precioUnit" type="number" value={form.precioUnit} onChange={(e) => setForm({ ...form, precioUnit: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockActual">Stock Actual</Label>
              <Input id="stockActual" type="number" value={form.stockActual} onChange={(e) => setForm({ ...form, stockActual: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock Mínimo</Label>
              <Input id="stockMinimo" type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Guardar Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Materiales Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los materiales. Asegúrate de que las columnas coincidan con los campos (Código, Nombre, Descripción, Unidad, Precio Unitario, Stock Actual, Stock Mínimo, Categoría, Ubicación).</p>
            <FileUpload
              label="Archivo de Materiales"
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
