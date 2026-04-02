
'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus, Pencil, Trash2, Download, Search, Upload,
  FileUp, CheckCircle, X,
  Loader2, Building2
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface CentroCosto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  responsable: string | null
  tipoGasto: string
  presupuestoMens: number
  presupuestoAnual: number
  estado: string
}

interface Gasto {
  centroCostoId: string | null
  monto: number
}

const formatCLP = (n: number) =>
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
  'Cerrado': 'bg-red-100 text-red-700',
}

const tipoGastoColors: Record<string, string> = {
  'Fijo': 'bg-blue-100 text-blue-700',
  'Variable': 'bg-purple-100 text-purple-700',
  'Contrato': 'bg-amber-100 text-amber-700',
  'Estacional': 'bg-cyan-100 text-cyan-700',
  'Fondo de Reserva': 'bg-rose-100 text-rose-700',
}

const tiposGasto = ['Fijo', 'Variable', 'Contrato', 'Estacional', 'Fondo de Reserva']
const estados = ['Activo', 'Inactivo', 'Cerrado']

export function CentroCostoModule() {
  const [centros, setCentros] = useState<CentroCosto[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCentro, setEditingCentro] = useState<CentroCosto | null>(null)
  const [deletingCentro, setDeletingCentro] = useState<CentroCosto | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    responsable: '',
    tipoGasto: 'Variable',
    presupuestoMens: 0,
    presupuestoAnual: 0,
    estado: 'Activo',
  })

  // Bulk import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'responsable', label: 'Responsable', defaultVisible: true },
    { key: 'tipoGasto', label: 'Tipo de Gasto', defaultVisible: true },
    { key: 'presupuestoMens', label: 'Presupuesto Mensual', defaultVisible: true },
    { key: 'presupuestoAnual', label: 'Presupuesto Anual', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: estados },
    { key: 'tipoGasto', label: 'Tipo de Gasto', type: 'select', options: tiposGasto },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'centros-costo',
    moduleLabel: 'Centros de Costo',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => centros
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [centrosRes, gastosRes] = await Promise.all([
        fetch('/api/centros-costo'),
        fetch('/api/gastos'),
      ])
      setCentros(await centrosRes.json())
      setGastos(await gastosRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los centros de costo.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [])

  // Filtrar centros
  const filteredCentros = centros.filter(c => {
    const matchSearch = !search ||
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(search.toLowerCase())) ||
      (c.responsable && c.responsable.toLowerCase().includes(search.toLowerCase()))
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado
    const matchTipo = filterTipo === 'todos' || c.tipoGasto === filterTipo
    return matchSearch && matchEstado && matchTipo
  })

  const openDialog = (centro?: CentroCosto) => {
    if (centro) {
      setEditingCentro(centro)
      setFormData({
        codigo: centro.codigo,
        nombre: centro.nombre,
        descripcion: centro.descripcion || '',
        responsable: centro.responsable || '',
        tipoGasto: centro.tipoGasto,
        presupuestoMens: centro.presupuestoMens,
        presupuestoAnual: centro.presupuestoAnual,
        estado: centro.estado,
      })
    } else {
      setEditingCentro(null)
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        responsable: '',
        tipoGasto: 'Variable',
        presupuestoMens: 0,
        presupuestoAnual: 0,
        estado: 'Activo',
      })
    }
    setDialogOpen(true)
  }

  const openDeleteDialog = (centro: CentroCosto) => {
    setDeletingCentro(centro)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      toast.error('El código y el nombre son obligatorios.')
      return
    }

    try {
      if (editingCentro) {
        await fetch(`/api/centros-costo/${editingCentro.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast.success('Centro de costo actualizado con éxito.')
      } else {
        await fetch('/api/centros-costo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast.success('Centro de costo creado con éxito.')
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving centro:', error)
      toast.error('Error al guardar el centro de costo.')
    }
  }

  const handleDelete = async () => {
    if (!deletingCentro) return
    try {
      await fetch(`/api/centros-costo/${deletingCentro.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setDeletingCentro(null)
      fetchData()
      toast.success('Centro de costo eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting centro:', error)
      toast.error('Error al eliminar el centro de costo.')
    }
  }

  const getGastado = (centroId: string) => {
    return gastos
      .filter(g => g.centroCostoId === centroId)
      .reduce((sum, g) => sum + g.monto, 0)
  }

  // Handle file select for mass import
  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  // Handle mass import
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
          codigo: item.Codigo || '',
          nombre: item.Nombre || '',
          descripcion: item.Descripcion || null,
          responsable: item.Responsable || null,
          tipoGasto: item.TipoGasto || 'Variable',
          presupuestoMens: Number(item.PresupuestoMensual) || 0,
          presupuestoAnual: Number(item.PresupuestoAnual) || 0,
          estado: item.Estado || 'Activo',
        }))

        const res = await fetch('/api/centros-costo/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Centros de costo importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar centros de costo. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando centros de costo...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Building2 className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Centros de Costo</h2>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Centro
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Centros</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{centros.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{centros.filter(c => c.estado === 'Activo').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{centros.filter(c => c.estado === 'Cerrado').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar centro de costo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {estados.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposGasto.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCentros.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay centros de costo que coincidan con la búsqueda.</div>
        ) : (
          filteredCentros.map((centro) => {
            const gastado = getGastado(centro.id)
            const porcentaje = centro.presupuestoMens > 0 ? (gastado / centro.presupuestoMens) * 100 : 0
            const estadoColor = estadoColors[centro.estado] || 'bg-gray-100 text-gray-700'
            const tipoColor = tipoGastoColors[centro.tipoGasto] || 'bg-gray-100 text-gray-700'

            return (
              <Card key={centro.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                  <div>
                    <Badge variant="outline" className={`${tipoColor}`}>{centro.tipoGasto}</Badge>
                    <CardTitle className="text-base mt-2 truncate max-w-[150px]">{centro.nombre}</CardTitle>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{centro.codigo}</span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <p className="text-sm text-slate-500 line-clamp-2">{centro.descripcion || 'Sin descripción'}</p>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Responsable: {centro.responsable || 'N/A'}</span>
                    <Badge variant="outline" className={`${estadoColor}`}>{centro.estado}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Presupuesto Mensual: {formatCLP(centro.presupuestoMens)}</span>
                      <span>Gastado: {formatCLP(gastado)}</span>
                    </div>
                    <Progress value={porcentaje} className="h-2" indicatorColor={porcentaje > 100 ? 'bg-red-500' : 'bg-blue-500'} />
                    {porcentaje > 100 && (
                      <p className="text-xs text-red-500">¡Presupuesto excedido en {formatCLP(gastado - centro.presupuestoMens)}!</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(centro); }}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={(e) => { e.stopPropagation(); openDeleteDialog(centro); }}>
                      <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialogo Nuevo/Editar Centro de Costo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCentro ? 'Editar' : 'Nuevo'} Centro de Costo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" value={formData.descripcion || ''} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input id="responsable" value={formData.responsable || ''} onChange={(e) => setFormData({ ...formData, responsable: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoGasto">Tipo de Gasto</Label>
              <Select value={formData.tipoGasto} onValueChange={(v) => setFormData({ ...formData, tipoGasto: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  {tiposGasto.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="presupuestoMens">Presupuesto Mensual</Label>
              <Input id="presupuestoMens" type="number" value={formData.presupuestoMens} onChange={(e) => setFormData({ ...formData, presupuestoMens: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presupuestoAnual">Presupuesto Anual</Label>
              <Input id="presupuestoAnual" type="number" value={formData.presupuestoAnual} onChange={(e) => setFormData({ ...formData, presupuestoAnual: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                <SelectContent>
                  {estados.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Centro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el centro de costo <span className="font-bold">{deletingCentro?.nombre}</span> y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Centros de Costo Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los centros de costo. Asegúrate de que las columnas coincidan con los campos (Código, Nombre, Descripción, Responsable, TipoGasto, PresupuestoMensual, PresupuestoAnual, Estado).</p>
            <FileUpload
              label="Archivo de Centros de Costo"
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
