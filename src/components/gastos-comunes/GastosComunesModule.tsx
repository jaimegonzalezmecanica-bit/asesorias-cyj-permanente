
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Plus,
  Pencil,
  Trash2,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface GastoComun {
  id: string
  periodo: string
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  totalGastos: number
  totalCobrar: number
  montoPorUnidad: number
  notas?: string
  createdAt: string
  detalles?: DetalleGastoComun[]
  pagos?: PagoGastoComun[]
}

interface DetalleGastoComun {
  id: string
  concepto: string
  categoria: string
  monto: number
  centroCosto?: string
  notas?: string
}

interface PagoGastoComun {
  id: string
  monto: number
  fechaPago: string
  metodo: string
  estado: string
  residente?: { nombre: string; unidad?: string }
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-amber-100 text-amber-700',
  'Pagado': 'bg-green-100 text-green-700',
  'Vencido': 'bg-red-100 text-red-700',
  'Parcial': 'bg-blue-100 text-blue-700',
}

const ESTADOS_GASTO_COMUN = ['Pendiente', 'Pagado', 'Vencido', 'Parcial']

export function GastosComunesModule() {
  const [gastos, setGastos] = useState<GastoComun[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState<GastoComun | null>(null)
  const [stats, setStats] = useState({
    totalPeriodos: 0,
    totalCobrado: 0,
    totalPendiente: 0,
    totalVencido: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    periodo: '',
    fechaEmision: '',
    fechaVencimiento: '',
    totalGastos: 0,
    totalCobrar: 0,
    montoPorUnidad: 0,
    notas: ''
  })

  // Detalle form
  const [detalles, setDetalles] = useState<DetalleGastoComun[]>([])
  const [nuevoDetalle, setNuevoDetalle] = useState({
    concepto: '',
    categoria: 'General',
    monto: 0,
    centroCosto: '',
    notas: ''
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'periodo', label: 'Período', defaultVisible: true },
    { key: 'fechaEmision', label: 'Fecha Emisión', defaultVisible: true },
    { key: 'fechaVencimiento', label: 'Fecha Vencimiento', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'totalGastos', label: 'Total Gastos', defaultVisible: true },
    { key: 'totalCobrar', label: 'Total a Cobrar', defaultVisible: true },
    { key: 'montoPorUnidad', label: 'Monto por Unidad', defaultVisible: true },
    { key: 'notas', label: 'Notas', defaultVisible: false },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_GASTO_COMUN },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'gastos-comunes',
    moduleLabel: 'Gastos Comunes',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => gastos
  })

  const fetchData = async () => {
    try {
      const res = await fetch('/api/gastos-comunes')
      const data = await res.json()
      setGastos(data.gastos || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching gastos comunes:', error)
      toast.error('Error al cargar los gastos comunes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!formData.periodo.trim() || !formData.fechaEmision || !formData.fechaVencimiento) {
      toast.error('El período, fecha de emisión y fecha de vencimiento son obligatorios.')
      return
    }

    try {
      const payload = {
        ...formData,
        detalles: detalles
      }

      if (selectedGasto) {
        await fetch(`/api/gastos-comunes/${selectedGasto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast.success('Gasto común actualizado con éxito.')
      } else {
        await fetch('/api/gastos-comunes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast.success('Gasto común creado con éxito.')
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving gasto comun:', error)
      toast.error('Error al guardar el gasto común.')
    }
  }

  const handleDelete = async () => {
    if (!selectedGasto) return
    try {
      await fetch(`/api/gastos-comunes/${selectedGasto.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedGasto(null)
      fetchData()
      toast.success('Gasto común eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting gasto comun:', error)
      toast.error('Error al eliminar el gasto común.')
    }
  }

  const resetForm = () => {
    setFormData({
      periodo: '',
      fechaEmision: '',
      fechaVencimiento: '',
      totalGastos: 0,
      totalCobrar: 0,
      montoPorUnidad: 0,
      notas: ''
    })
    setDetalles([])
    setSelectedGasto(null)
  }

  const openEditDialog = (gasto: GastoComun) => {
    setSelectedGasto(gasto)
    setFormData({
      periodo: gasto.periodo,
      fechaEmision: gasto.fechaEmision,
      fechaVencimiento: gasto.fechaVencimiento,
      totalGastos: gasto.totalGastos,
      totalCobrar: gasto.totalCobrar,
      montoPorUnidad: gasto.montoPorUnidad,
      notas: gasto.notas || ''
    })
    setDetalles(gasto.detalles || [])
    setDialogOpen(true)
  }

  const agregarDetalle = () => {
    if (nuevoDetalle.concepto && nuevoDetalle.monto > 0) {
      setDetalles([...detalles, { ...nuevoDetalle, id: Date.now().toString() }])
      const nuevoTotal = detalles.reduce((sum, d) => sum + d.monto, 0) + nuevoDetalle.monto
      setFormData(prev => ({ ...prev, totalGastos: nuevoTotal, totalCobrar: nuevoTotal }))
      setNuevoDetalle({ concepto: '', categoria: 'General', monto: 0, centroCosto: '', notas: '' })
    }
  }

  const eliminarDetalle = (id: string) => {
    const nuevosDetalles = detalles.filter(d => d.id !== id)
    setDetalles(nuevosDetalles)
    const nuevoTotal = nuevosDetalles.reduce((sum, d) => sum + d.monto, 0)
    setFormData(prev => ({ ...prev, totalGastos: nuevoTotal, totalCobrar: nuevoTotal }))
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
          periodo: item.Periodo || '',
          fechaEmision: item['Fecha Emisión'] ? new Date(item['Fecha Emisión']).toISOString().split('T')[0] : '',
          fechaVencimiento: item['Fecha Vencimiento'] ? new Date(item['Fecha Vencimiento']).toISOString().split('T')[0] : '',
          estado: item.Estado || 'Pendiente',
          totalGastos: Number(item['Total Gastos']) || 0,
          totalCobrar: Number(item['Total a Cobrar']) || 0,
          montoPorUnidad: Number(item['Monto por Unidad']) || 0,
          notas: item.Notas || null,
        }))

        const res = await fetch('/api/gastos-comunes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Gastos comunes importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar gastos comunes. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Períodos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalPeriodos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Cobrado</p>
                <p className="text-lg font-bold text-green-600">{formatCLP(stats.totalCobrado)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Pendiente</p>
                <p className="text-lg font-bold text-amber-600">{formatCLP(stats.totalPendiente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Vencido</p>
                <p className="text-lg font-bold text-red-600">{formatCLP(stats.totalVencido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Gastos Comunes Mensuales</h2>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="bg-[#0f2040] hover:bg-[#1a3155]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Período
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Período</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">F. Emisión</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">F. Vencimiento</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Total Gastos</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Monto/Unidad</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Estado</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No hay gastos comunes registrados.
                  </TableCell>
                </TableRow>
              ) : (
                gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell className="font-medium">{gasto.periodo}</TableCell>
                    <TableCell>{gasto.fechaEmision}</TableCell>
                    <TableCell>{gasto.fechaVencimiento}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCLP(gasto.totalGastos)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatCLP(gasto.montoPorUnidad)}</TableCell>
                    <TableCell>
                      <Badge className={estadoColors[gasto.estado] || 'bg-gray-100'}>{gasto.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedGasto(gasto); setDetalleDialogOpen(true); }}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(gasto)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => { setSelectedGasto(gasto); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogo Nuevo/Editar Gasto Común */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGasto ? 'Editar' : 'Nuevo'} Gasto Común</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodo">Período (YYYY-MM)</Label>
                <Input id="periodo" value={formData.periodo} onChange={(e) => setFormData({ ...formData, periodo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
                <Input id="fechaEmision" type="date" value={formData.fechaEmision} onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <Input id="fechaVencimiento" type="date" value={formData.fechaVencimiento} onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalGastos">Total Gastos</Label>
                <Input id="totalGastos" type="number" value={formData.totalGastos} onChange={(e) => setFormData({ ...formData, totalGastos: Number(e.target.value) })} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montoPorUnidad">Monto por Unidad</Label>
                <Input id="montoPorUnidad" type="number" value={formData.montoPorUnidad} onChange={(e) => setFormData({ ...formData, montoPorUnidad: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Input id="notas" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>

            <h3 className="text-md font-semibold mt-4">Detalles de Gastos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map((detalle) => (
                  <TableRow key={detalle.id}>
                    <TableCell>{detalle.concepto}</TableCell>
                    <TableCell>{detalle.categoria}</TableCell>
                    <TableCell>{formatCLP(detalle.monto)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => eliminarDetalle(detalle.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><Input value={nuevoDetalle.concepto} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, concepto: e.target.value })} placeholder="Concepto" /></TableCell>
                  <TableCell><Input value={nuevoDetalle.categoria} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, categoria: e.target.value })} placeholder="Categoría" /></TableCell>
                  <TableCell><Input type="number" value={nuevoDetalle.monto} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, monto: Number(e.target.value) })} placeholder="Monto" /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={agregarDetalle}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold bg-slate-50">
                  <TableCell colSpan={2} className="text-right">Total Gastos</TableCell>
                  <TableCell>{formatCLP(detalles.reduce((sum, d) => sum + d.monto, 0))}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar Gasto Común</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Detalle de Gasto Común */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Gasto Común: {selectedGasto?.periodo}</DialogTitle>
          </DialogHeader>
          {selectedGasto && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Período:</Label>
                <span className="col-span-3">{selectedGasto.periodo}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha Emisión:</Label>
                <span className="col-span-3">{selectedGasto.fechaEmision}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha Vencimiento:</Label>
                <span className="col-span-3">{selectedGasto.fechaVencimiento}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Estado:</Label>
                <span className="col-span-3"><Badge className={estadoColors[selectedGasto.estado]}>{selectedGasto.estado}</Badge></span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Total Gastos:</Label>
                <span className="col-span-3 font-bold text-green-600">{formatCLP(selectedGasto.totalGastos)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Monto por Unidad:</Label>
                <span className="col-span-3 font-bold">{formatCLP(selectedGasto.montoPorUnidad)}</span>
              </div>
              {selectedGasto.notas && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Notas:</Label>
                  <span className="col-span-3">{selectedGasto.notas}</span>
                </div>
              )}

              <h3 className="text-md font-semibold mt-4">Detalles de Gastos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGasto.detalles?.map((detalle) => (
                    <TableRow key={detalle.id}>
                      <TableCell>{detalle.concepto}</TableCell>
                      <TableCell>{detalle.categoria}</TableCell>
                      <TableCell className="text-right">{formatCLP(detalle.monto)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-50">
                    <TableCell colSpan={2} className="text-right">Total</TableCell>
                    <TableCell className="text-right">{formatCLP(selectedGasto.totalGastos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto común del período <span className="font-bold">{selectedGasto?.periodo}</span>.
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
            <DialogTitle>Importar Gastos Comunes Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los gastos comunes. Asegúrate de que las columnas coincidan con los campos (Período, Fecha Emisión, Fecha Vencimiento, Estado, Total Gastos, Total a Cobrar, Monto por Unidad, Notas).</p>
            <FileUpload
              label="Archivo de Gastos Comunes"
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
