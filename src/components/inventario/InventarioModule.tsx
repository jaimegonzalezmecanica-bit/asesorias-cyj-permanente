
'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Pencil, Search, AlertTriangle, Package,
  TrendingDown, TrendingUp, Minus, History, Download,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Upload, FileText, X, Loader2
} from 'lucide-react'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface Material {
  id: string
  codigo: string | null
  nombre: string
  unidad: string
  precioUnit: number
  categoria: string
  stockMinimo: number
  stockActual: number
  ubicacion: string | null
  descripcion: string | null
  centroCosto?: {
    id: string
    codigo: string
    nombre: string
  } | null
}

interface Movimiento {
  id: string
  tipo: string
  materialId: string | null
  materialCodigo: string | null
  materialNombre: string
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  motivo: string | null
  referencia: string | null
  observaciones: string | null
  usuarioId: string | null
  usuarioNombre: string | null
  createdAt: string
}

interface MovimientosStats {
  movimientosHoy: number
  entradasMes: number
  salidasMes: number
  ajustesMes: number
}

const formatCLP = (n: number) =>
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const categoriaColors: Record<string, string> = {
  'Eléctrico': 'bg-yellow-100 text-yellow-700',
  'Fontanería': 'bg-blue-100 text-blue-700',
  'Ferretería': 'bg-orange-100 text-orange-700',
  'Pintura': 'bg-purple-100 text-purple-700',
  'Jardinería': 'bg-green-100 text-green-700',
  'Limpieza': 'bg-cyan-100 text-cyan-700',
  'Seguridad': 'bg-red-100 text-red-700',
  'General': 'bg-slate-100 text-slate-700',
}

const tipoMovimientoColors: Record<string, string> = {
  'Entrada': 'bg-green-100 text-green-700 border-green-200',
  'Salida': 'bg-red-100 text-red-700 border-red-200',
  'Ajuste': 'bg-amber-100 text-amber-700 border-amber-200',
  'Transferencia': 'bg-blue-100 text-blue-700 border-blue-200',
}

const MOTIVOS_OPTIONS = [
  'Compra',
  'Uso en OT',
  'Ajuste de Inventario',
  'Merma',
  'Devolución',
  'Transferencia',
  'Otro'
]

export function InventarioModule() {
  // Materials state
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [filterStock, setFilterStock] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    stockActual: 0,
    stockMinimo: 0,
    ubicacion: '',
  })
  
  // Movement adjustment form
  const [adjustFormData, setAdjustFormData] = useState({
    stockNuevo: 0,
    motivo: '',
    referencia: '',
    observaciones: '',
  })
  
  // Movements state
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [movimientosStats, setMovimientosStats] = useState<MovimientosStats>({
    movimientosHoy: 0,
    entradasMes: 0,
    salidasMes: 0,
    ajustesMes: 0
  })
  const [movimientosLoading, setMovimientosLoading] = useState(true)
  const [movimientosTotal, setMovimientosTotal] = useState(0)
  const [movimientosPage, setMovimientosPage] = useState(1)
  
  // Movement filters
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterMaterialId, setFilterMaterialId] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'categoria', label: 'Categoría', defaultVisible: true },
    { key: 'unidad', label: 'Unidad', defaultVisible: true },
    { key: 'precioUnit', label: 'Precio Unitario', defaultVisible: true },
    { key: 'stockActual', label: 'Stock Actual', defaultVisible: true },
    { key: 'stockMinimo', label: 'Stock Mínimo', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'categoria', label: 'Categoría', type: 'select', options: [...new Set(materiales.map(m => m.categoria))] },
    { key: 'stockStatus', label: 'Estado de Stock', type: 'select', options: ['bajo', 'normal'] },
  ], [materiales])

  const { ExportButton } = useExport({
    moduleName: 'inventario_materiales',
    moduleLabel: 'Materiales de Inventario',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => materiales
  })

  const fetchMateriales = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/catalogos/materiales')
      const data = await res.json()
      setMateriales(data)
    } catch (error) {
      console.error('Error fetching materiales:', error)
    }
    setLoading(false)
  }

  const fetchMovimientos = async () => {
    setMovimientosLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTipo && filterTipo !== 'todos') params.append('tipo', filterTipo)
      if (filterMaterialId) params.append('materialId', filterMaterialId)
      if (filterFechaDesde) params.append('fechaDesde', filterFechaDesde)
      if (filterFechaHasta) params.append('fechaHasta', filterFechaHasta)
      params.append('page', movimientosPage.toString())
      params.append('limit', '20')
      
      const res = await fetch(`/api/inventario/movimientos?${params.toString()}`)
      const data = await res.json()
      setMovimientos(data.movimientos || [])
      setMovimientosTotal(data.total || 0)
      setMovimientosStats(data.stats || {
        movimientosHoy: 0,
        entradasMes: 0,
        salidasMes: 0,
        ajustesMes: 0
      })
    } catch (error) {
      console.error('Error fetching movimientos:', error)
    }
    setMovimientosLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchMateriales()
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      await fetchMovimientos()
    })()
  }, [filterTipo, filterMaterialId, filterFechaDesde, filterFechaHasta, movimientosPage])

  // Filtrar materiales
  const filteredMateriales = materiales.filter(m => {
    const matchSearch = !search ||
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (m.codigo && m.codigo.toLowerCase().includes(search.toLowerCase()))
    
    const matchCategoria = filterCategoria === 'todas' || m.categoria === filterCategoria
    
    let matchStock = true
    if (filterStock === 'bajo') {
      matchStock = m.stockActual <= m.stockMinimo
    } else if (filterStock === 'normal') {
      matchStock = m.stockActual > m.stockMinimo
    }
    
    return matchSearch && matchCategoria && matchStock
  })

  // Estadísticas de materiales
  const stats = {
    total: materiales.length,
    stockBajo: materiales.filter(m => m.stockActual <= m.stockMinimo).length,
    stockNormal: materiales.filter(m => m.stockActual > m.stockMinimo).length,
    valorTotal: materiales.reduce((sum, m) => sum + (m.stockActual * m.precioUnit), 0),
  }

  const openDialog = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({
      stockActual: material.stockActual,
      stockMinimo: material.stockMinimo,
      ubicacion: material.ubicacion || '',
    })
    setDialogOpen(true)
  }

  const openAdjustDialog = (material: Material) => {
    setSelectedMaterial(material)
    setAdjustFormData({
      stockNuevo: material.stockActual,
      motivo: '',
      referencia: '',
      observaciones: '',
    })
    setAdjustDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedMaterial) return

    try {
      await fetch(`/api/catalogos/materiales/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setDialogOpen(false)
      fetchMateriales()
      toast.success('Material actualizado con éxito')
    } catch (error) {
      console.error('Error updating material:', error)
      toast.error('Error al actualizar material')
    }
  }

  const handleAdjustSave = async () => {
    if (!selectedMaterial) return

    try {
      await fetch(`/api/inventario/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          tipo: 'Ajuste',
          cantidad: adjustFormData.stockNuevo - selectedMaterial.stockActual,
          motivo: adjustFormData.motivo,
          referencia: adjustFormData.referencia,
          observaciones: adjustFormData.observaciones,
          usuarioNombre: 'Sistema', // In a real app, this would be the logged-in user
        }),
      })
      setAdjustDialogOpen(false)
      fetchMateriales()
      fetchMovimientos()
      toast.success('Stock ajustado con éxito')
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Error al ajustar stock')
    }
  }

  const adjustStock = async (material: Material, adjustment: number) => {
    const tipo = adjustment > 0 ? 'Entrada' : 'Salida'
    
    try {
      await fetch(`/api/inventario/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: material.id,
          tipo: tipo,
          cantidad: Math.abs(adjustment),
          motivo: adjustment > 0 ? 'Incremento rápido' : 'Decremento rápido',
          usuarioNombre: 'Sistema',
        }),
      })
      fetchMateriales()
      fetchMovimientos()
      toast.success('Stock ajustado rápidamente')
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Error al ajustar stock')
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
          unidad: item.Unidad || 'unidad',
          precioUnit: Number(item['Precio Unitario']) || 0,
          categoria: item.Categoria || 'General',
          stockMinimo: Number(item['Stock Mínimo']) || 0,
          stockActual: Number(item['Stock Actual']) || 0,
          ubicacion: item.Ubicacion || null,
          descripcion: item.Descripcion || null,
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
        fetchMateriales()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar materiales. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  // Obtener categorías únicas
  const categorias = [...new Set(materiales.map(m => m.categoria))].sort()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Package className="w-5 h-5 text-purple-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Gestión de Inventario</h2>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Material
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stockBajo}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Normal</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stockNormal}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(stats.valorTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materiales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>
        <TabsContent value="materiales" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los stocks</SelectItem>
                <SelectItem value="bajo">Stock Bajo</SelectItem>
                <SelectItem value="normal">Stock Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
            ) : filteredMateriales.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">No hay materiales que coincidan con la búsqueda.</div>
            ) : (
              filteredMateriales.map((m) => (
                <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                    <div>
                      <Badge variant="outline" className={categoriaColors[m.categoria]}>{m.categoria}</Badge>
                      <CardTitle className="text-base mt-2 truncate max-w-[150px]">{m.nombre}</CardTitle>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.codigo || 'N/A'}</span>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                      <span>Stock: {m.stockActual} {m.unidad}</span>
                      <span className="text-slate-900 font-mono">{formatCLP(m.precioUnit)}</span>
                    </div>
                    {m.stockActual <= m.stockMinimo && (
                      <div className="flex items-center gap-2 text-[10px] text-red-500 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Stock bajo: {m.stockMinimo} {m.unidad}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(m); }}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openAdjustDialog(m); }}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Ajustar Stock
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); adjustStock(m, 1); }}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); adjustStock(m, -1); }}>
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="movimientos" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Salida">Salida</SelectItem>
                <SelectItem value="Ajuste">Ajuste</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMaterialId} onValueChange={setFilterMaterialId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los materiales</SelectItem>
                {materiales.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} placeholder="Fecha Desde" className="w-[150px]" />
            <Input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} placeholder="Fecha Hasta" className="w-[150px]" />
            <Button variant="outline" onClick={fetchMovimientos}><Search className="w-4 h-4 mr-1" /> Buscar</Button>
          </div>

          {/* Movimientos Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Movimientos Hoy</CardTitle>
                <History className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movimientosStats.movimientosHoy}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas Mes</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movimientosStats.entradasMes}</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salidas Mes</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movimientosStats.salidasMes}</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ajustes Mes</CardTitle>
                <RefreshCw className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movimientosStats.ajustesMes}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {movimientosLoading ? (
              <div className="py-12 text-center text-slate-400">Cargando movimientos...</div>
            ) : movimientos.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No hay movimientos que coincidan con los filtros.</div>
            ) : (
              movimientos.map((mov) => (
                <Card key={mov.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={tipoMovimientoColors[mov.tipo]}>{mov.tipo}</Badge>
                        <span className="font-semibold text-slate-900 truncate">{mov.materialNombre}</span>
                      </div>
                      <p className="text-sm text-slate-500">Cantidad: {mov.cantidad} | Stock Final: {mov.stockNuevo}</p>
                      <p className="text-xs text-slate-400 mt-1">Motivo: {mov.motivo || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">{formatDate(mov.createdAt)}</p>
                      <p className="text-xs text-slate-500">Por: {mov.usuarioNombre || 'Sistema'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogo Nuevo/Editar Material */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedMaterial ? 'Editar' : 'Nuevo'} Material</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={selectedMaterial?.nombre || ''} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, nombre: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={selectedMaterial?.codigo || ''} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, codigo: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={selectedMaterial?.categoria || 'General'} onValueChange={(v) => setSelectedMaterial(prev => prev ? { ...prev, categoria: v } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(categoriaColors).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input id="unidad" value={selectedMaterial?.unidad || ''} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, unidad: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioUnit">Precio Unitario</Label>
              <Input id="precioUnit" type="number" value={selectedMaterial?.precioUnit || 0} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, precioUnit: Number(e.target.value) } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock Mínimo</Label>
              <Input id="stockMinimo" type="number" value={selectedMaterial?.stockMinimo || 0} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, stockMinimo: Number(e.target.value) } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockActual">Stock Actual</Label>
              <Input id="stockActual" type="number" value={selectedMaterial?.stockActual || 0} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, stockActual: Number(e.target.value) } : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input id="ubicacion" value={selectedMaterial?.ubicacion || ''} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, ubicacion: e.target.value } : null)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={selectedMaterial?.descripcion || ''} onChange={(e) => setSelectedMaterial(prev => prev ? { ...prev, descripcion: e.target.value } : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Ajustar Stock */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock de {selectedMaterial?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stockNuevo">Stock Nuevo</Label>
              <Input id="stockNuevo" type="number" value={adjustFormData.stockNuevo} onChange={(e) => setAdjustFormData({...adjustFormData, stockNuevo: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Select value={adjustFormData.motivo} onValueChange={(v) => setAdjustFormData({...adjustFormData, motivo: v})}>
                <SelectTrigger><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia (ej. N° Factura, OT)</Label>
              <Input id="referencia" value={adjustFormData.referencia} onChange={(e) => setAdjustFormData({...adjustFormData, referencia: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" value={adjustFormData.observaciones} onChange={(e) => setAdjustFormData({...adjustFormData, observaciones: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdjustSave}>Guardar Ajuste</Button>
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
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los materiales. Asegúrate de que las columnas coincidan con los campos (Código, Nombre, Unidad, Precio Unitario, Categoría, Stock Mínimo, Stock Actual, Ubicación, Descripción).</p>
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
