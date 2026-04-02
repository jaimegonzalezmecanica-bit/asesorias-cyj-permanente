
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Pencil,
  Trash2,
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Eye,
  Upload,
  Download,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface AsientoContable {
  id: string
  numero: string
  fecha: string
  glosa: string
  tipo: string
  estado: string
  totalDebe: number
  totalHaber: number
  documento?: string
  documentoId?: string
  notas?: string
  createdAt: string
  detalles?: DetalleAsiento[]
}

interface DetalleAsiento {
  id: string
  glosa?: string
  debe: number
  haber: number
  cuenta: {
    codigo: string
    nombre: string
  }
}

interface CuentaContable {
  id: string
  codigo: string
  nombre: string
  tipo: string
  nivel: number
  saldo: number
  estado: string
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-amber-100 text-amber-700',
  'Aprobado': 'bg-green-100 text-green-700',
  'Anulado': 'bg-red-100 text-red-700',
}

const tipoColors: Record<string, string> = {
  'Normal': 'bg-slate-100 text-slate-700',
  'Apertura': 'bg-blue-100 text-blue-700',
  'Cierre': 'bg-purple-100 text-purple-700',
  'Ajuste': 'bg-orange-100 text-orange-700',
}

const TIPOS_ASIENTO = ['Normal', 'Apertura', 'Cierre', 'Ajuste']
const ESTADOS_ASIENTO = ['Pendiente', 'Aprobado', 'Anulado']

export function ContabilidadModule() {
  const [asientos, setAsientos] = useState<AsientoContable[]>([])
  const [cuentas, setCuentas] = useState<CuentaContable[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAsiento, setSelectedAsiento] = useState<AsientoContable | null>(null)
  const [stats, setStats] = useState({
    totalAsientos: 0,
    totalDebe: 0,
    totalHaber: 0,
    pendientes: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    numero: '',
    fecha: '',
    glosa: '',
    tipo: 'Normal',
    documento: '',
    notas: ''
  })

  // Detalles del asiento
  const [detalles, setDetalles] = useState<DetalleAsiento[]>([])
  const [nuevoDetalle, setNuevoDetalle] = useState({
    cuentaId: '',
    glosa: '',
    debe: 0,
    haber: 0
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumnsAsientos: ColumnConfig[] = useMemo(() => [
    { key: 'numero', label: 'Nº Asiento', defaultVisible: true },
    { key: 'fecha', label: 'Fecha', defaultVisible: true },
    { key: 'glosa', label: 'Glosa', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'totalDebe', label: 'Total Debe', defaultVisible: true },
    { key: 'totalHaber', label: 'Total Haber', defaultVisible: true },
    { key: 'documento', label: 'Documento', defaultVisible: false },
    { key: 'documentoId', label: 'ID Documento', defaultVisible: false },
    { key: 'notas', label: 'Notas', defaultVisible: false },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: false },
  ], [])

  const exportFiltersAsientos: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_ASIENTO },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_ASIENTO },
  ], [])

  const { ExportButton: ExportAsientosButton } = useExport({
    moduleName: 'contabilidad/asientos',
    moduleLabel: 'Asientos Contables',
    columns: exportColumnsAsientos,
    filters: exportFiltersAsientos,
    getData: () => asientos
  })

  const exportColumnsCuentas: ColumnConfig[] = useMemo(() => [
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'nivel', label: 'Nivel', defaultVisible: true },
    { key: 'saldo', label: 'Saldo', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
  ], [])

  const exportFiltersCuentas: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Egreso'] },
    { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] },
  ], [])

  const { ExportButton: ExportCuentasButton } = useExport({
    moduleName: 'contabilidad/cuentas',
    moduleLabel: 'Plan de Cuentas',
    columns: exportColumnsCuentas,
    filters: exportFiltersCuentas,
    getData: () => cuentas
  })

  const fetchData = async () => {
    try {
      const [asientosRes, cuentasRes] = await Promise.all([
        fetch('/api/contabilidad/asientos'),
        fetch('/api/contabilidad/cuentas')
      ])
      
      const asientosData = await asientosRes.json()
      const cuentasData = await cuentasRes.json()
      
      setAsientos(asientosData.asientos || [])
      setCuentas(cuentasData.cuentas || [])
      setStats(asientosData.stats || stats)
    } catch (error) {
      console.error('Error fetching contabilidad:', error)
      toast.error('Error al cargar los datos de contabilidad.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        detalles: detalles
      }

      if (selectedAsiento) {
        await fetch(`/api/contabilidad/asientos/${selectedAsiento.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast.success('Asiento contable actualizado con éxito.')
      } else {
        await fetch('/api/contabilidad/asientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast.success('Asiento contable creado con éxito.')
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving asiento:', error)
      toast.error('Error al guardar el asiento contable.')
    }
  }

  const handleDelete = async () => {
    if (!selectedAsiento) return
    try {
      await fetch(`/api/contabilidad/asientos/${selectedAsiento.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedAsiento(null)
      fetchData()
      toast.success('Asiento contable eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting asiento:', error)
      toast.error('Error al eliminar el asiento contable.')
    }
  }

  const resetForm = () => {
    setFormData({
      numero: '',
      fecha: '',
      glosa: '',
      tipo: 'Normal',
      documento: '',
      notas: ''
    })
    setDetalles([])
    setSelectedAsiento(null)
  }

  const agregarDetalle = () => {
    if (nuevoDetalle.cuentaId && (nuevoDetalle.debe > 0 || nuevoDetalle.haber > 0)) {
      const cuenta = cuentas.find(c => c.id === nuevoDetalle.cuentaId)
      setDetalles([...detalles, { 
        ...nuevoDetalle, 
        id: Date.now().toString(),
        cuenta: { codigo: cuenta?.codigo || '', nombre: cuenta?.nombre || '' }
      }])
      setNuevoDetalle({ cuentaId: '', glosa: '', debe: 0, haber: 0 })
    }
  }

  const eliminarDetalle = (id: string) => {
    setDetalles(detalles.filter(d => d.id !== id))
  }

  const calcularTotales = () => {
    const totalDebe = detalles.reduce((sum, d) => sum + d.debe, 0)
    const totalHaber = detalles.reduce((sum, d) => sum + d.haber, 0)
    return { totalDebe, totalHaber }
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
          numero: item.Numero || '',
          fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : '',
          glosa: item.Glosa || '',
          tipo: item.Tipo || 'Normal',
          estado: item.Estado || 'Pendiente',
          documento: item.Documento || null,
          documentoId: item.DocumentoId || null,
          notas: item.Notas || null,
          detalles: [] // Detalles se manejarían por separado o en un formato más complejo
        }))

        const res = await fetch('/api/contabilidad/asientos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Asientos contables importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar asientos contables. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  const totales = calcularTotales()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Asientos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalAsientos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Débitos</p>
                <p className="text-lg font-bold text-green-600">{formatCLP(stats.totalDebe)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Créditos</p>
                <p className="text-lg font-bold text-red-600">{formatCLP(stats.totalHaber)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="asientos" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="asientos">Asientos Contables</TabsTrigger>
          <TabsTrigger value="cuentas">Plan de Cuentas</TabsTrigger>
        </TabsList>

        <TabsContent value="asientos" className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Asientos Contables</h2>
            <div className="flex gap-2">
              <ExportAsientosButton />
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-1" /> Importar
              </Button>
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                className="bg-[#0f2040] hover:bg-[#1a3155]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Asiento
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Nº Asiento</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Fecha</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Glosa</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Tipo</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Estado</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right">Debe</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right">Haber</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asientos.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">No hay asientos contables.</TableCell></TableRow>
                  ) : (
                    asientos.map((asiento) => {
                      const estadoConfig = estadoColors[asiento.estado] || 'bg-gray-100 text-gray-700'
                      const tipoConfig = tipoColors[asiento.tipo] || 'bg-gray-100 text-gray-700'
                      return (
                        <TableRow key={asiento.id}>
                          <TableCell className="font-medium">{asiento.numero}</TableCell>
                          <TableCell>{asiento.fecha}</TableCell>
                          <TableCell className="text-xs">{asiento.glosa}</TableCell>
                          <TableCell><Badge className={tipoConfig}>{asiento.tipo}</Badge></TableCell>
                          <TableCell><Badge className={estadoConfig}>{asiento.estado}</Badge></TableCell>
                          <TableCell className="text-right font-mono text-xs text-green-600">{formatCLP(asiento.totalDebe)}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-red-600">{formatCLP(asiento.totalHaber)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedAsiento(asiento); setDetalleDialogOpen(true); }}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedAsiento(asiento); setFormData({ numero: asiento.numero, fecha: asiento.fecha, glosa: asiento.glosa, tipo: asiento.tipo, documento: asiento.documento || '', notas: asiento.notas || '' }); setDetalles(asiento.detalles || []); setDialogOpen(true); }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => { setSelectedAsiento(asiento); setDeleteDialogOpen(true); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuentas" className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Plan de Cuentas</h2>
            <ExportCuentasButton />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Código</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Nombre</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Tipo</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Nivel</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right">Saldo</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">No hay cuentas contables.</TableCell></TableRow>
                  ) : (
                    cuentas.map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">{cuenta.codigo}</TableCell>
                        <TableCell>{cuenta.nombre}</TableCell>
                        <TableCell>{cuenta.tipo}</TableCell>
                        <TableCell>{cuenta.nivel}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCLP(cuenta.saldo)}</TableCell>
                        <TableCell><Badge variant="outline">{cuenta.estado}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogo Nuevo/Editar Asiento Contable */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAsiento ? 'Editar' : 'Nuevo'} Asiento Contable</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número de Asiento</Label>
                <Input id="numero" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="glosa">Glosa</Label>
              <Textarea id="glosa" value={formData.glosa} onChange={(e) => setFormData({ ...formData, glosa: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_ASIENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Documento Asociado</Label>
                <Input id="documento" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>

            <h3 className="text-md font-semibold mt-4">Detalles del Asiento</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Glosa Detalle</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map((detalle) => (
                  <TableRow key={detalle.id}>
                    <TableCell>{detalle.cuenta.codigo} - {detalle.cuenta.nombre}</TableCell>
                    <TableCell>{detalle.glosa}</TableCell>
                    <TableCell className="text-right">{formatCLP(detalle.debe)}</TableCell>
                    <TableCell className="text-right">{formatCLP(detalle.haber)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => eliminarDetalle(detalle.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Select value={nuevoDetalle.cuentaId} onValueChange={(v) => setNuevoDetalle({ ...nuevoDetalle, cuentaId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecciona cuenta" /></SelectTrigger>
                      <SelectContent>
                        {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={nuevoDetalle.glosa} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, glosa: e.target.value })} /></TableCell>
                  <TableCell><Input type="number" value={nuevoDetalle.debe} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, debe: Number(e.target.value) })} /></TableCell>
                  <TableCell><Input type="number" value={nuevoDetalle.haber} onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, haber: Number(e.target.value) })} /></TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={agregarDetalle}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold bg-slate-50">
                  <TableCell colSpan={2} className="text-right">Totales</TableCell>
                  <TableCell className="text-right text-green-600">{formatCLP(totales.totalDebe)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCLP(totales.totalHaber)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={totales.totalDebe !== totales.totalHaber || detalles.length === 0}>Guardar Asiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Detalle de Asiento Contable */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Asiento Contable #{selectedAsiento?.numero}</DialogTitle>
          </DialogHeader>
          {selectedAsiento && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha:</Label>
                <span className="col-span-3">{selectedAsiento.fecha}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Glosa:</Label>
                <span className="col-span-3">{selectedAsiento.glosa}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Tipo:</Label>
                <span className="col-span-3"><Badge className={tipoColors[selectedAsiento.tipo]}>{selectedAsiento.tipo}</Badge></span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Estado:</Label>
                <span className="col-span-3"><Badge className={estadoColors[selectedAsiento.estado]}>{selectedAsiento.estado}</Badge></span>
              </div>
              {selectedAsiento.documento && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Documento:</Label>
                  <span className="col-span-3">{selectedAsiento.documento}</span>
                </div>
              )}
              {selectedAsiento.notas && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Notas:</Label>
                  <span className="col-span-3">{selectedAsiento.notas}</span>
                </div>
              )}

              <h3 className="text-md font-semibold mt-4">Movimientos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Glosa Detalle</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAsiento.detalles?.map((detalle) => (
                    <TableRow key={detalle.id}>
                      <TableCell>{detalle.cuenta.codigo} - {detalle.cuenta.nombre}</TableCell>
                      <TableCell>{detalle.glosa}</TableCell>
                      <TableCell className="text-right">{formatCLP(detalle.debe)}</TableCell>
                      <TableCell className="text-right">{formatCLP(detalle.haber)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-50">
                    <TableCell colSpan={2} className="text-right">Totales</TableCell>
                    <TableCell className="text-right text-green-600">{formatCLP(selectedAsiento.totalDebe)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCLP(selectedAsiento.totalHaber)}</TableCell>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el asiento contable <span className="font-bold">#{selectedAsiento?.numero}</span>.
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
            <DialogTitle>Importar Asientos Contables Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los asientos contables. Asegúrate de que las columnas coincidan con los campos (Numero, Fecha, Glosa, Tipo, Estado, Documento, DocumentoId, Notas).</p>
            <FileUpload
              label="Archivo de Asientos Contables"
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
