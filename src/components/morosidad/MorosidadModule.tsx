
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  FileDown,
  Phone,
  Mail,
  Eye,
  FileText,
  Send,
  Settings,
  Calculator,
  Clock,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Upload,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

// ============================================
// INTERFACES
// ============================================
interface Deuda {
  id: string
  tipo: string
  periodo: string
  concepto: string
  montoOriginal: number
  montoInteres: number
  montoTotal: number
  diasMora: number
  estado: string
  fechaVencimiento: string | null
  notas: string | null
  residenteId: string | null
  residente?: {
    id: string
    nombre: string
    apellido?: string | null
    unidad?: string | null
    etapa?: string | null
    telefono?: string | null
    email?: string | null
  }
  createdAt: string
}

interface EstadoCuenta {
  id: string
  periodo: string
  fechaGeneracion: string
  saldoAnterior: number
  cargosMes: number
  pagosMes: number
  saldoActual: number
  interesesMora: number
  totalPagar: number
  fechaVencimiento: string | null
  estado: string
  residenteId: string | null
  residente?: {
    id: string
    nombre: string
    apellido?: string | null
    unidad?: string | null
    etapa?: string | null
    telefono?: string | null
    email?: string | null
  }
  detalles?: DetalleEstadoCuenta[]
}

interface DetalleEstadoCuenta {
  id: string
  tipo: string
  concepto: string
  monto: number
  fecha: string | null
  referencia: string | null
}

interface CartaCobranza {
  id: string
  tipo: string
  numeroCarta: number
  asunto: string
  contenido: string
  fechaEnvio: string | null
  fechaGeneracion: string
  metodoEnvio: string
  estado: string
  residenteId: string | null
  residente?: {
    id: string
    nombre: string
    apellido?: string | null
    unidad?: string | null
    etapa?: string | null
    telefono?: string | null
    email?: string | null
  }
  archivoPdf?: string | null
}

interface ConfigMorosidad {
  id: string
  tasaInteresMensual: number
  tasaInteresDiario: number
  diasGracia: number
  maxDiasMora: number
  montosCartas?: string | null
  plantillasCartas?: string | null
  activo: boolean
}

interface Stats {
  totalMorosidad: number
  deudasPendientes: number
  residentesMorosos: number
  interesesMes: number
  rango130: number
  rango3160: number
  rango60mas: number
}

// ============================================
// UTILITIES
// ============================================
const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '–'
  try {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-red-100 text-red-700 border-red-200',
  'Parcial': 'bg-amber-100 text-amber-700 border-amber-200',
  'Pagado': 'bg-green-100 text-green-700 border-green-200',
  'Condonado': 'bg-blue-100 text-blue-700 border-blue-200',
}

const estadoCuentaColors: Record<string, string> = {
  'Generado': 'bg-slate-100 text-slate-700 border-slate-200',
  'Enviado': 'bg-blue-100 text-blue-700 border-blue-200',
  'Pagado': 'bg-green-100 text-green-700 border-green-200',
  'Vencido': 'bg-red-100 text-red-700 border-red-200',
}

const cartaColors: Record<string, string> = {
  'Recordatorio': 'bg-blue-100 text-blue-700 border-blue-200',
  'Aviso': 'bg-amber-100 text-amber-700 border-amber-200',
  'UltimoAviso': 'bg-orange-100 text-orange-700 border-orange-200',
  'CobroJudicial': 'bg-red-100 text-red-700 border-red-200',
}

const cartaEstadoColors: Record<string, string> = {
  'Generada': 'bg-slate-100 text-slate-700 border-slate-200',
  'Enviada': 'bg-blue-100 text-blue-700 border-blue-200',
  'Entregada': 'bg-green-100 text-green-700 border-green-200',
  'SinRespuesta': 'bg-red-100 text-red-700 border-red-200',
}

const metodoEnvioIcons: Record<string, typeof Mail> = {
  'Email': Mail,
  'WhatsApp': MessageSquare,
  'CartaFisica': FileText,
}

// ============================================
// MAIN COMPONENT
// ============================================
export function MorosidadModule() {
  const { currentCondominio } = useAppStore()

  // States for Deudas
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [deudasLoading, setDeudasLoading] = useState(true)
  const [deudaDialogOpen, setDeudaDialogOpen] = useState(false)
  const [selectedDeuda, setSelectedDeuda] = useState<Deuda | null>(null)
  const [deudaFormMode, setDeudaFormMode] = useState<'create' | 'edit'>('create')
  const [deudaFormData, setDeudaFormData] = useState({
    tipo: 'GastoComun',
    periodo: '',
    concepto: '',
    montoOriginal: 0,
    residenteId: '',
    fechaVencimiento: '',
    notas: ''
  })
  const [deleteDeudaDialog, setDeleteDeudaDialog] = useState(false)
  const [deudaToDelete, setDeudaToDelete] = useState<Deuda | null>(null)

  // States for Estados de Cuenta
  const [estadosCuenta, setEstadosCuenta] = useState<EstadoCuenta[]>([])
  const [estadosLoading, setEstadosLoading] = useState(false)
  const [estadoCuentaDialogOpen, setEstadoCuentaDialogOpen] = useState(false)
  const [selectedEstadoCuenta, setSelectedEstadoCuenta] = useState<EstadoCuenta | null>(null)
  const [generarEstadoDialog, setGenerarEstadoDialog] = useState(false)

  // States for Cartas
  const [cartas, setCartas] = useState<CartaCobranza[]>([])
  const [cartasLoading, setCartasLoading] = useState(false)
  const [cartaDialogOpen, setCartaDialogOpen] = useState(false)
  const [selectedCarta, setSelectedCarta] = useState<CartaCobranza | null>(null)
  const [generarCartaDialog, setGenerarCartaDialog] = useState(false)
  const [cartaFormData, setCartaFormData] = useState({
    tipo: 'Recordatorio',
    residenteId: '',
    deudasIncluidas: [] as string[],
    metodoEnvio: 'Email'
  })

  // States for Config
  const [config, setConfig] = useState<ConfigMorosidad | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configFormData, setConfigFormData] = useState({
    tasaInteresMensual: 1.5,
    tasaInteresDiario: 0.05,
    diasGracia: 10,
    maxDiasMora: 90
  })

  // States for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [filtroResidente, setFiltroResidente] = useState('')

  // States for residentes list
  const [residentes, setResidentes] = useState<Array<{id: string; nombre: string; apellido?: string | null; unidad?: string | null}>>([])

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalMorosidad: 0,
    deudasPendientes: 0,
    residentesMorosos: 0,
    interesesMes: 0,
    rango130: 0,
    rango3160: 0,
    rango60mas: 0
  })

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Export configuration for Deudas
  const exportColumnsDeudas: ColumnConfig[] = useMemo(() => [
    { key: 'residente.nombre', label: 'Residente', defaultVisible: true },
    { key: 'residente.unidad', label: 'Unidad', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'periodo', label: 'Período', defaultVisible: true },
    { key: 'concepto', label: 'Concepto', defaultVisible: true },
    { key: 'montoOriginal', label: 'Monto Original', defaultVisible: true },
    { key: 'montoInteres', label: 'Intereses', defaultVisible: true },
    { key: 'montoTotal', label: 'Monto Total', defaultVisible: true },
    { key: 'diasMora', label: 'Días Mora', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'fechaVencimiento', label: 'Fecha Vencimiento', defaultVisible: true },
    { key: 'notas', label: 'Notas', defaultVisible: false },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: false },
  ], [])

  const exportFiltersDeudas: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: Object.keys(estadoColors) },
    { key: 'residenteId', label: 'Residente', type: 'select', options: residentes.map(r => ({ value: r.id, label: `${r.nombre} ${r.apellido || ''} (${r.unidad || ''})` })) },
  ], [residentes])

  const { ExportButton: ExportDeudasButton } = useExport({
    moduleName: 'deudas',
    moduleLabel: 'Deudas',
    columns: exportColumnsDeudas,
    filters: exportFiltersDeudas,
    getData: () => deudas,
  })

  // Export configuration for Estados de Cuenta
  const exportColumnsEstadosCuenta: ColumnConfig[] = useMemo(() => [
    { key: 'residente.nombre', label: 'Residente', defaultVisible: true },
    { key: 'residente.unidad', label: 'Unidad', defaultVisible: true },
    { key: 'periodo', label: 'Período', defaultVisible: true },
    { key: 'fechaGeneracion', label: 'Fecha Generación', defaultVisible: true },
    { key: 'saldoAnterior', label: 'Saldo Anterior', defaultVisible: true },
    { key: 'cargosMes', label: 'Cargos Mes', defaultVisible: true },
    { key: 'pagosMes', label: 'Pagos Mes', defaultVisible: true },
    { key: 'saldoActual', label: 'Saldo Actual', defaultVisible: true },
    { key: 'interesesMora', label: 'Intereses Mora', defaultVisible: true },
    { key: 'totalPagar', label: 'Total a Pagar', defaultVisible: true },
    { key: 'fechaVencimiento', label: 'Fecha Vencimiento', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
  ], [])

  const exportFiltersEstadosCuenta: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: Object.keys(estadoCuentaColors) },
    { key: 'residenteId', label: 'Residente', type: 'select', options: residentes.map(r => ({ value: r.id, label: `${r.nombre} ${r.apellido || ''} (${r.unidad || ''})` })) },
  ], [residentes])

  const { ExportButton: ExportEstadosCuentaButton } = useExport({
    moduleName: 'estados-cuenta',
    moduleLabel: 'Estados de Cuenta',
    columns: exportColumnsEstadosCuenta,
    filters: exportFiltersEstadosCuenta,
    getData: () => estadosCuenta,
  })

  // Export configuration for Cartas de Cobranza
  const exportColumnsCartas: ColumnConfig[] = useMemo(() => [
    { key: 'residente.nombre', label: 'Residente', defaultVisible: true },
    { key: 'residente.unidad', label: 'Unidad', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'numeroCarta', label: 'Número Carta', defaultVisible: true },
    { key: 'asunto', label: 'Asunto', defaultVisible: true },
    { key: 'fechaEnvio', label: 'Fecha Envío', defaultVisible: true },
    { key: 'metodoEnvio', label: 'Método Envío', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
  ], [])

  const exportFiltersCartas: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: Object.keys(cartaColors) },
    { key: 'estado', label: 'Estado', type: 'select', options: Object.keys(cartaEstadoColors) },
    { key: 'residenteId', label: 'Residente', type: 'select', options: residentes.map(r => ({ value: r.id, label: `${r.nombre} ${r.apellido || ''} (${r.unidad || ''})` })) },
  ], [residentes])

  const { ExportButton: ExportCartasButton } = useExport({
    moduleName: 'cartas-cobranza',
    moduleLabel: 'Cartas de Cobranza',
    columns: exportColumnsCartas,
    filters: exportFiltersCartas,
    getData: () => cartas,
  })

  // Fetch data functions
  const fetchResidentes = useCallback(async () => {
    if (!currentCondominio?.id) return
    try {
      const res = await fetch(`/api/residentes?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      setResidentes(data)
    } catch (error) {
      console.error('Error fetching residentes:', error)
    }
  }, [currentCondominio])

  const fetchDeudas = useCallback(async () => {
    if (!currentCondominio?.id) {
      setDeudasLoading(false)
      return
    }
    setDeudasLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('condominioId', currentCondominio.id)
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado)
      if (filtroPeriodo !== 'todos') params.append('periodo', filtroPeriodo)
      if (filtroResidente) params.append('residenteId', filtroResidente)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/morosidad/deudas?${params.toString()}`)
      const data = await res.json()
      setDeudas(data.deudas || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching deudas:', error)
      toast.error('Error al cargar deudas.')
    } finally {
      setDeudasLoading(false)
    }
  }, [currentCondominio, filtroEstado, filtroPeriodo, filtroResidente, searchTerm])

  const fetchEstadosCuenta = useCallback(async () => {
    if (!currentCondominio?.id) {
      setEstadosLoading(false)
      return
    }
    setEstadosLoading(true)
    try {
      const res = await fetch(`/api/morosidad/estados-cuenta?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      setEstadosCuenta(data || [])
    } catch (error) {
      console.error('Error fetching estados de cuenta:', error)
      toast.error('Error al cargar estados de cuenta.')
    } finally {
      setEstadosLoading(false)
    }
  }, [currentCondominio])

  const fetchCartas = useCallback(async () => {
    if (!currentCondominio?.id) {
      setCartasLoading(false)
      return
    }
    setCartasLoading(true)
    try {
      const res = await fetch(`/api/morosidad/cartas?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      setCartas(data || [])
    } catch (error) {
      console.error('Error fetching cartas:', error)
      toast.error('Error al cargar cartas de cobranza.')
    } finally {
      setCartasLoading(false)
    }
  }, [currentCondominio])

  const fetchConfig = useCallback(async () => {
    if (!currentCondominio?.id) {
      setConfigLoading(false)
      return
    }
    setConfigLoading(true)
    try {
      const res = await fetch(`/api/morosidad/config?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      if (data) {
        setConfig(data)
        setConfigFormData({
          tasaInteresMensual: data.tasaInteresMensual,
          tasaInteresDiario: data.tasaInteresDiario,
          diasGracia: data.diasGracia,
          maxDiasMora: data.maxDiasMora,
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Error al cargar configuración de morosidad.')
    } finally {
      setConfigLoading(false)
    }
  }, [currentCondominio])

  useEffect(() => {
    fetchResidentes()
    fetchDeudas()
    fetchEstadosCuenta()
    fetchCartas()
    fetchConfig()
  }, [fetchResidentes, fetchDeudas, fetchEstadosCuenta, fetchCartas, fetchConfig])

  // CRUD operations for Deudas
  const handleOpenDeudaDialog = (mode: 'create' | 'edit', deuda?: Deuda) => {
    setDeudaFormMode(mode)
    setSelectedDeuda(deuda || null)
    if (mode === 'create') {
      setDeudaFormData({
        tipo: 'GastoComun',
        periodo: '',
        concepto: '',
        montoOriginal: 0,
        residenteId: '',
        fechaVencimiento: '',
        notas: ''
      })
    } else if (deuda) {
      setDeudaFormData({
        tipo: deuda.tipo,
        periodo: deuda.periodo,
        concepto: deuda.concepto,
        montoOriginal: deuda.montoOriginal,
        residenteId: deuda.residenteId || '',
        fechaVencimiento: deuda.fechaVencimiento || '',
        notas: deuda.notas || ''
      })
    }
    setDeudaDialogOpen(true)
  }

  const handleSaveDeuda = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio.')
      return
    }
    try {
      const method = deudaFormMode === 'create' ? 'POST' : 'PUT'
      const url = deudaFormMode === 'create' ? '/api/morosidad/deudas' : `/api/morosidad/deudas/${selectedDeuda?.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...deudaFormData, condominioId: currentCondominio.id }),
      })
      if (res.ok) {
        toast.success(`Deuda ${deudaFormMode === 'create' ? 'creada' : 'actualizada'} con éxito.`)
        fetchDeudas()
        setDeudaDialogOpen(false)
      } else {
        const error = await res.json()
        toast.error(error.message || `Error al ${deudaFormMode === 'create' ? 'crear' : 'actualizar'} deuda.`)
      }
    } catch (error) {
      console.error('Error saving deuda:', error)
      toast.error('Error de conexión.')
    }
  }

  const handleDeleteDeuda = async () => {
    if (!deudaToDelete) return
    try {
      const res = await fetch(`/api/morosidad/deudas/${deudaToDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Deuda eliminada con éxito.')
        fetchDeudas()
        setDeleteDeudaDialog(false)
        setDeudaToDelete(null)
      } else {
        const error = await res.json()
        toast.error(error.message || 'Error al eliminar deuda.')
      }
    } catch (error) {
      console.error('Error deleting deuda:', error)
      toast.error('Error de conexión.')
    }
  }

  // Mass Import for Deudas
  const handleImportFileSelected = (file: File | null) => {
    setImportFile(file)
  }

  const handleMassImport = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar deudas.')
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
          tipo: item.Tipo || 'GastoComun',
          periodo: item.Periodo || '',
          concepto: item.Concepto || '',
          montoOriginal: parseFloat(item['Monto Original']) || 0,
          residenteId: item['ID Residente'] || '', // Assuming ID Residente is provided
          fechaVencimiento: item['Fecha Vencimiento'] || '',
          notas: item.Notas || '',
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/morosidad/deudas/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Deudas importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchDeudas()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar deudas. Verifica el formato del archivo y los IDs de residente.')
    } finally {
      setImportLoading(false)
    }
  }

  // CRUD operations for Config
  const handleSaveConfig = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio.')
      return
    }
    try {
      const method = config?.id ? 'PUT' : 'POST'
      const url = config?.id ? `/api/morosidad/config/${config.id}` : '/api/morosidad/config'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...configFormData, condominioId: currentCondominio.id }),
      })
      if (res.ok) {
        toast.success('Configuración guardada con éxito.')
        fetchConfig()
        setConfigDialogOpen(false)
      } else {
        const error = await res.json()
        toast.error(error.message || 'Error al guardar configuración.')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error de conexión.')
    }
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar la morosidad.
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Morosidad</h1>
          <p className="text-sm text-slate-500">Control y seguimiento de deudas, estados de cuenta y cartas de cobranza.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-1" /> Configuración
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar Deudas
          </Button>
          <Button onClick={() => handleOpenDeudaDialog('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Deuda
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Morosidad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(stats.totalMorosidad)}</div>
            <p className="text-xs text-muted-foreground">{stats.deudasPendientes} deudas pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residentes Morosos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.residentesMorosos}</div>
            <p className="text-xs text-muted-foreground">Con al menos una deuda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intereses Generados (Mes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCLP(stats.interesesMes)}</div>
            <p className="text-xs text-muted-foreground">Estimado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rangos de Antigüedad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              1-30 días: <span className="font-bold">{stats.rango130}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              31-60 días: <span className="font-bold">{stats.rango3160}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              +60 días: <span className="font-bold">{stats.rango60mas}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deudas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deudas">Deudas</TabsTrigger>
          <TabsTrigger value="estados-cuenta">Estados de Cuenta</TabsTrigger>
          <TabsTrigger value="cartas">Cartas de Cobranza</TabsTrigger>
        </TabsList>

        <TabsContent value="deudas" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar deuda..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.keys(estadoColors).map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los períodos</SelectItem>
                {/* TODO: Fetch dynamic periods */}
                <SelectItem value="2024-03">Marzo 2024</SelectItem>
                <SelectItem value="2024-02">Febrero 2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroResidente} onValueChange={setFiltroResidente}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por residente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los residentes</SelectItem>
                {residentes.map(residente => (
                  <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchDeudas()}><RefreshCw className="w-4 h-4" /></Button>
            <ExportDeudasButton />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto Original</TableHead>
                  <TableHead>Intereses</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Días Mora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deudasLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : deudas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No hay deudas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  deudas.map((deuda) => (
                    <TableRow key={deuda.id}>
                      <TableCell className="font-medium">{deuda.residente?.nombre} {deuda.residente?.apellido}</TableCell>
                      <TableCell>{deuda.residente?.unidad}</TableCell>
                      <TableCell>{deuda.tipo}</TableCell>
                      <TableCell>{deuda.periodo}</TableCell>
                      <TableCell>{deuda.concepto}</TableCell>
                      <TableCell>{formatCLP(deuda.montoOriginal)}</TableCell>
                      <TableCell>{formatCLP(deuda.montoInteres)}</TableCell>
                      <TableCell className="font-bold">{formatCLP(deuda.montoTotal)}</TableCell>
                      <TableCell>{deuda.diasMora}</TableCell>
                      <TableCell>
                        <Badge className={estadoColors[deuda.estado]}>{deuda.estado}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(deuda.fechaVencimiento)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDeudaDialog('edit', deuda)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDeudaToDelete(deuda); setDeleteDeudaDialog(true); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="estados-cuenta" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar estado de cuenta..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.keys(estadoCuentaColors).map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por residente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los residentes</SelectItem>
                {residentes.map(residente => (
                  <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchEstadosCuenta()}><RefreshCw className="w-4 h-4" /></Button>
            <ExportEstadosCuentaButton />
            <Button onClick={() => setGenerarEstadoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Generar Estado de Cuenta
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Generación</TableHead>
                  <TableHead>Saldo Anterior</TableHead>
                  <TableHead>Cargos Mes</TableHead>
                  <TableHead>Pagos Mes</TableHead>
                  <TableHead>Saldo Actual</TableHead>
                  <TableHead>Intereses Mora</TableHead>
                  <TableHead>Total a Pagar</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estadosLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : estadosCuenta.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No hay estados de cuenta generados.
                    </TableCell>
                  </TableRow>
                ) : (
                  estadosCuenta.map((estado) => (
                    <TableRow key={estado.id}>
                      <TableCell className="font-medium">{estado.residente?.nombre} {estado.residente?.apellido}</TableCell>
                      <TableCell>{estado.residente?.unidad}</TableCell>
                      <TableCell>{estado.periodo}</TableCell>
                      <TableCell>{formatDate(estado.fechaGeneracion)}</TableCell>
                      <TableCell>{formatCLP(estado.saldoAnterior)}</TableCell>
                      <TableCell>{formatCLP(estado.cargosMes)}</TableCell>
                      <TableCell>{formatCLP(estado.pagosMes)}</TableCell>
                      <TableCell className="font-bold">{formatCLP(estado.saldoActual)}</TableCell>
                      <TableCell>{formatCLP(estado.interesesMora)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatCLP(estado.totalPagar)}</TableCell>
                      <TableCell>{formatDate(estado.fechaVencimiento)}</TableCell>
                      <TableCell>
                        <Badge className={estadoCuentaColors[estado.estado]}>{estado.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedEstadoCuenta(estado); setEstadoCuentaDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cartas" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar carta..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {Object.keys(cartaColors).map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.keys(cartaEstadoColors).map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por residente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los residentes</SelectItem>
                {residentes.map(residente => (
                  <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchCartas()}><RefreshCw className="w-4 h-4" /></Button>
            <ExportCartasButton />
            <Button onClick={() => setGenerarCartaDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Generar Carta
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Generación</TableHead>
                  <TableHead>Envío</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartasLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : cartas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No hay cartas de cobranza generadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  cartas.map((carta) => {
                    const Icon = metodoEnvioIcons[carta.metodoEnvio] || FileText
                    return (
                      <TableRow key={carta.id}>
                        <TableCell className="font-medium">{carta.residente?.nombre} {carta.residente?.apellido}</TableCell>
                        <TableCell>{carta.residente?.unidad}</TableCell>
                        <TableCell>
                          <Badge className={cartaColors[carta.tipo]}>{carta.tipo}</Badge>
                        </TableCell>
                        <TableCell>{carta.asunto}</TableCell>
                        <TableCell>{formatDate(carta.fechaGeneracion)}</TableCell>
                        <TableCell>{formatDate(carta.fechaEnvio)}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Icon className="h-4 w-4" /> {carta.metodoEnvio}
                        </TableCell>
                        <TableCell>
                          <Badge className={cartaEstadoColors[carta.estado]}>{carta.estado}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCarta(carta); setCartaDialogOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                          {carta.archivoPdf && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={carta.archivoPdf} target="_blank" rel="noopener noreferrer">
                                <FileDown className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogo de Creación/Edición de Deuda */}
      <Dialog open={deudaDialogOpen} onOpenChange={setDeudaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{deudaFormMode === 'create' ? 'Registrar Nueva Deuda' : 'Editar Deuda'}</DialogTitle>
            <DialogDescription>
              {deudaFormMode === 'create' ? 'Ingresa los detalles de la nueva deuda.' : 'Edita los detalles de la deuda seleccionada.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="residenteId">Residente</Label>
              <Select value={deudaFormData.residenteId} onValueChange={value => setDeudaFormData({...deudaFormData, residenteId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un residente" />
                </SelectTrigger>
                <SelectContent>
                  {residentes.map(residente => (
                    <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Deuda</Label>
              <Select value={deudaFormData.tipo} onValueChange={value => setDeudaFormData({...deudaFormData, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GastoComun">Gasto Común</SelectItem>
                  <SelectItem value="Multa">Multa</SelectItem>
                  <SelectItem value="FondoReserva">Fondo de Reserva</SelectItem>
                  <SelectItem value="Extraordinario">Gasto Extraordinario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodo">Período (AAAA-MM)</Label>
              <Input id="periodo" value={deudaFormData.periodo} onChange={e => setDeudaFormData({...deudaFormData, periodo: e.target.value})} placeholder="Ej: 2024-03" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input id="concepto" value={deudaFormData.concepto} onChange={e => setDeudaFormData({...deudaFormData, concepto: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="montoOriginal">Monto Original</Label>
              <Input id="montoOriginal" type="number" value={deudaFormData.montoOriginal} onChange={e => setDeudaFormData({...deudaFormData, montoOriginal: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha Vencimiento</Label>
              <Input id="fechaVencimiento" type="date" value={deudaFormData.fechaVencimiento} onChange={e => setDeudaFormData({...deudaFormData, fechaVencimiento: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-full">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={deudaFormData.notas} onChange={e => setDeudaFormData({...deudaFormData, notas: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeudaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDeuda}>Guardar Deuda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Eliminación de Deuda */}
      <AlertDialog open={deleteDeudaDialog} onOpenChange={setDeleteDeudaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la deuda <strong>{deudaToDelete?.concepto}</strong> del residente <strong>{deudaToDelete?.residente?.nombre} {deudaToDelete?.residente?.apellido}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeuda} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Detalle de Estado de Cuenta */}
      <Dialog open={estadoCuentaDialogOpen} onOpenChange={setEstadoCuentaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Estado de Cuenta</DialogTitle>
            <DialogDescription>
              Período: {selectedEstadoCuenta?.periodo} - Residente: {selectedEstadoCuenta?.residente?.nombre} {selectedEstadoCuenta?.residente?.apellido} ({selectedEstadoCuenta?.residente?.unidad})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Generación:</p>
                  <p className="font-medium">{formatDate(selectedEstadoCuenta?.fechaGeneracion)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Vencimiento:</p>
                  <p className="font-medium">{formatDate(selectedEstadoCuenta?.fechaVencimiento)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Anterior:</p>
                  <p className="font-medium">{formatCLP(selectedEstadoCuenta?.saldoAnterior || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargos del Mes:</p>
                  <p className="font-medium">{formatCLP(selectedEstadoCuenta?.cargosMes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagos del Mes:</p>
                  <p className="font-medium">{formatCLP(selectedEstadoCuenta?.pagosMes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intereses por Mora:</p>
                  <p className="font-medium">{formatCLP(selectedEstadoCuenta?.interesesMora || 0)}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Movimientos del Período</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEstadoCuenta?.detalles?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No hay movimientos para este período.</TableCell>
                      </TableRow>
                    ) : (
                      selectedEstadoCuenta?.detalles?.map((detalle, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(detalle.fecha)}</TableCell>
                          <TableCell>{detalle.tipo}</TableCell>
                          <TableCell>{detalle.concepto}</TableCell>
                          <TableCell>{detalle.referencia}</TableCell>
                          <TableCell className="text-right">{formatCLP(detalle.monto)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold text-xl">
                <span>SALDO ACTUAL:</span>
                <span>{formatCLP(selectedEstadoCuenta?.saldoActual || 0)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-xl text-red-600">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCLP(selectedEstadoCuenta?.totalPagar || 0)}</span>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEstadoCuentaDialogOpen(false)}>Cerrar</Button>
            <Button><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
            <Button><Send className="mr-2 h-4 w-4" /> Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Generar Estado de Cuenta */}
      <Dialog open={generarEstadoDialog} onOpenChange={setGenerarEstadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Estado de Cuenta</DialogTitle>
            <DialogDescription>Selecciona el residente y el período para generar un estado de cuenta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="residenteEstado">Residente</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un residente" />
                </SelectTrigger>
                <SelectContent>
                  {residentes.map(residente => (
                    <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodoEstado">Período (AAAA-MM)</Label>
              <Input id="periodoEstado" placeholder="Ej: 2024-03" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerarEstadoDialog(false)}>Cancelar</Button>
            <Button>Generar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Detalle de Carta de Cobranza */}
      <Dialog open={cartaDialogOpen} onOpenChange={setCartaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Carta de Cobranza</DialogTitle>
            <DialogDescription>
              Tipo: {selectedCarta?.tipo} - Residente: {selectedCarta?.residente?.nombre} {selectedCarta?.residente?.apellido} ({selectedCarta?.residente?.unidad})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Carta:</p>
                  <p className="font-medium">{selectedCarta?.numeroCarta}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asunto:</p>
                  <p className="font-medium">{selectedCarta?.asunto}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Generación:</p>
                  <p className="font-medium">{formatDate(selectedCarta?.fechaGeneracion)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Envío:</p>
                  <p className="font-medium">{formatDate(selectedCarta?.fechaEnvio)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Envío:</p>
                  <p className="font-medium flex items-center gap-1">
                    {selectedCarta?.metodoEnvio && metodoEnvioIcons[selectedCarta.metodoEnvio] && React.createElement(metodoEnvioIcons[selectedCarta.metodoEnvio], { className: 'h-4 w-4' })}
                    {selectedCarta?.metodoEnvio}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado:</p>
                  <p className="font-medium">
                    <Badge className={selectedCarta?.estado ? cartaEstadoColors[selectedCarta.estado] : ''}>{selectedCarta?.estado}</Badge>
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Contenido de la Carta</h3>
                <div className="border rounded-md p-4 bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedCarta?.contenido}
                </div>
              </div>
              {selectedCarta?.archivoPdf && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold mb-2">Archivo Adjunto</h3>
                  <Button variant="outline" asChild>
                    <a href={selectedCarta.archivoPdf} target="_blank" rel="noopener noreferrer">
                      <FileDown className="mr-2 h-4 w-4" /> Ver PDF
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartaDialogOpen(false)}>Cerrar</Button>
            <Button><Send className="mr-2 h-4 w-4" /> Re-enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Generar Carta de Cobranza */}
      <Dialog open={generarCartaDialog} onOpenChange={setGenerarCartaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Carta de Cobranza</DialogTitle>
            <DialogDescription>Selecciona el tipo de carta, residente y deudas a incluir.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipoCarta">Tipo de Carta</Label>
              <Select value={cartaFormData.tipo} onValueChange={value => setCartaFormData({...cartaFormData, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                  <SelectItem value="Aviso">Aviso de Morosidad</SelectItem>
                  <SelectItem value="UltimoAviso">Último Aviso</SelectItem>
                  <SelectItem value="CobroJudicial">Cobro Judicial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residenteCarta">Residente</Label>
              <Select value={cartaFormData.residenteId} onValueChange={value => setCartaFormData({...cartaFormData, residenteId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un residente" />
                </SelectTrigger>
                <SelectContent>
                  {residentes.map(residente => (
                    <SelectItem key={residente.id} value={residente.id}>{residente.nombre} {residente.apellido} ({residente.unidad})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deudasIncluidas">Deudas a Incluir</Label>
              {/* TODO: Multi-select for deudas */}
              <Input id="deudasIncluidas" placeholder="Selecciona deudas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metodoEnvio">Método de Envío</Label>
              <Select value={cartaFormData.metodoEnvio} onValueChange={value => setCartaFormData({...cartaFormData, metodoEnvio: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="CartaFisica">Carta Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerarCartaDialog(false)}>Cancelar</Button>
            <Button>Generar Carta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Configuración de Morosidad */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuración de Morosidad</DialogTitle>
            <DialogDescription>Ajusta los parámetros para el cálculo de intereses y gestión de morosidad.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tasaInteresMensual">Tasa de Interés Mensual (%)</Label>
              <Input id="tasaInteresMensual" type="number" step="0.01" value={configFormData.tasaInteresMensual} onChange={e => setConfigFormData({...configFormData, tasaInteresMensual: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasaInteresDiario">Tasa de Interés Diario (%)</Label>
              <Input id="tasaInteresDiario" type="number" step="0.001" value={configFormData.tasaInteresDiario} onChange={e => setConfigFormData({...configFormData, tasaInteresDiario: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diasGracia">Días de Gracia</Label>
              <Input id="diasGracia" type="number" value={configFormData.diasGracia} onChange={e => setConfigFormData({...configFormData, diasGracia: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiasMora">Máximo Días de Mora para Cartas</Label>
              <Input id="maxDiasMora" type="number" value={configFormData.maxDiasMora} onChange={e => setConfigFormData({...configFormData, maxDiasMora: parseInt(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig}>Guardar Configuración</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Deudas Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las deudas. Asegúrate de que las columnas coincidan con los campos (Tipo, Período, Concepto, Monto Original, ID Residente, Fecha Vencimiento, Notas).</p>
            <FileUpload
              label="Archivo de Deudas"
              onFileSelected={handleImportFileSelected}
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
