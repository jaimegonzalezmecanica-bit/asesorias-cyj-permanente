
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Home,
  FileText,
  Calendar,
  Wrench,
  CreditCard,
  LogOut,
  Bell,
  User,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Download,
  ChevronRight,
  Wallet,
  CalendarDays,
  Loader2,
  Upload
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

// ============================================
// INTERFACES
// ============================================
interface Residente {
  id: string
  nombre: string
  apellido?: string | null
  unidad: string | null
  email?: string | null
  telefono?: string | null
  etapa?: string | null
}

interface EstadoCuenta {
  id: string
  periodo: string
  saldoAnterior: number
  cargosMes: number
  pagosMes: number
  saldoActual: number
  interesesMora: number
  totalPagar: number
  fechaVencimiento?: string | null
  estado: string
}

interface Deuda {
  id: string
  periodo: string
  concepto: string
  montoOriginal: number
  montoInteres: number
  montoTotal: number
  diasMora: number
  estado: string
}

interface Reserva {
  id: string
  titulo: string
  espacio: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
  pagado: boolean
  monto: number
  notas?: string | null
}

interface Solicitud {
  id: string
  titulo: string
  descripcion?: string | null
  tipo: string
  prioridad: string
  estado: string
  ubicacion?: string | null
  fechaSolicitud: string
  respuesta?: string | null
  fechaRespuesta?: string | null
  conversacion?: string | null
}

// ============================================
// PORTAL MODULE COMPONENT
// ============================================
export function PortalModule() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [residente, setResidente] = useState<Residente | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Login form
  const [loginForm, setLoginForm] = useState({
    rut: '',
    email: '',
    unidad: '',
  })

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard')

  // Data states
  const [estadosCuenta, setEstadosCuenta] = useState<EstadoCuenta[]>([])
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(false)

  // Resumen
  const [resumen, setResumen] = useState({
    totalDeuda: 0,
    totalIntereses: 0,
    cantidadDeudas: 0,
    deudasVencidas: 0,
  })

  // Dialogs
  const [reservaDialogOpen, setReservaDialogOpen] = useState(false)
  const [solicitudDialogOpen, setSolicitudDialogOpen] = useState(false)
  const [detalleSolicitudOpen, setDetalleSolicitudOpen] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null)

  // Form states
  const [nuevaReserva, setNuevaReserva] = useState({
    espacio: 'Quincho',
    fecha: '',
    horaInicio: '10:00',
    horaFin: '14:00',
    titulo: '',
    numPersonas: 1,
    notas: '',
  })

  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Mantenimiento',
    prioridad: 'Normal',
    ubicacion: '',
  })

  const [nuevoMensaje, setNuevoMensaje] = useState('')

  // Import states for Solicitudes
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Espacios comunes
  const espaciosComunes = [
    'Quincho',
    'Sala de Eventos',
    'Piscina',
    'Estacionamiento Visita',
    'Cancha Deportiva',
    'Gimnasio',
    'Sala de Reuniones',
    'Parrilla',
    'Juegos Infantiles',
  ]

  const TIPOS_SOLICITUD = ['Mantenimiento', 'Reclamo', 'Sugerencia', 'Consulta']
  const PRIORIDADES_SOLICITUD = ['Baja', 'Normal', 'Alta', 'Urgente']
  const ESTADOS_SOLICITUD = ['Pendiente', 'En Progreso', 'Resuelta', 'Cerrada']

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'titulo', label: 'Título', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'prioridad', label: 'Prioridad', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'fechaSolicitud', label: 'Fecha Solicitud', defaultVisible: true },
    { key: 'respuesta', label: 'Respuesta', defaultVisible: false },
    { key: 'fechaRespuesta', label: 'Fecha Respuesta', defaultVisible: false },
    { key: 'conversacion', label: 'Conversación', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_SOLICITUD },
    { key: 'prioridad', label: 'Prioridad', type: 'select', options: PRIORIDADES_SOLICITUD },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_SOLICITUD },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'solicitudes-portal',
    moduleLabel: 'Solicitudes del Portal',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => solicitudes
  })

  // ============================================
  // AUTH FUNCTIONS
  // ============================================
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/auth')
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setResidente(data.residente)
          setLoginForm(prev => ({ ...prev, unidad: data.residente.unidad || '' }))
        }
      }
    } catch {
      console.error('Error checking session')
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await res.json()

      if (res.ok) {
        setIsAuthenticated(true)
        setResidente(data.residente)
        toast.success('Inicio de sesión exitoso.')
      } else {
        setLoginError(data.error || 'Error al iniciar sesión')
        toast.error(data.error || 'Error al iniciar sesión.')
      }
    } catch {
      setLoginError('Error de conexión')
      toast.error('Error de conexión.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth', { method: 'DELETE' })
      setIsAuthenticated(false)
      setResidente(null)
      toast.info('Sesión cerrada.')
    } catch {
      console.error('Error al cerrar sesión')
      toast.error('Error al cerrar sesión.')
    }
  }

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchEstadoCuenta = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/estado-cuenta')
      if (res.ok) {
        const data = await res.json()
        setEstadosCuenta(data.estadosCuenta || [])
        setDeudas(data.deudas || [])
        setResumen(data.resumen || resumen)
      }
    } catch {
      console.error('Error fetching estado cuenta')
      toast.error('Error al cargar el estado de cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservas = async () => {
    try {
      const res = await fetch('/api/portal/reservas')
      if (res.ok) {
        const data = await res.json()
        setReservas(data.reservas || [])
      }
    } catch {
      console.error('Error fetching reservas')
      toast.error('Error al cargar las reservas.')
    }
  }

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch('/api/portal/solicitudes')
      if (res.ok) {
        const data = await res.json()
        setSolicitudes(data.solicitudes || [])
      }
    } catch {
      console.error('Error fetching solicitudes')
      toast.error('Error al cargar las solicitudes.')
    }
  }

  // Cargar datos cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      void fetchEstadoCuenta()
      void fetchReservas()
      void fetchSolicitudes()
    }
  }, [isAuthenticated])

  // ============================================
  // HANDLERS
  // ============================================
  const handleCrearReserva = async () => {
    if (!nuevaReserva.titulo.trim() || !nuevaReserva.fecha) {
      toast.error('El título y la fecha de la reserva son obligatorios.')
      return
    }

    try {
      const res = await fetch('/api/portal/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaReserva),
      })

      if (res.ok) {
        setReservaDialogOpen(false)
        setNuevaReserva({
          espacio: 'Quincho',
          fecha: '',
          horaInicio: '10:00',
          horaFin: '14:00',
          titulo: '',
          numPersonas: 1,
          notas: '',
        })
        void fetchReservas()
        toast.success('Reserva creada con éxito.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear la reserva.')
      }
    } catch {
      console.error('Error creando reserva')
      toast.error('Error de conexión al crear la reserva.')
    }
  }

  const handleCancelarReserva = async (id: string) => {
    if (!confirm('¿Desea cancelar esta reserva?')) return

    try {
      const res = await fetch('/api/portal/reservas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'cancelar' }),
      })

      if (res.ok) {
        void fetchReservas()
        toast.success('Reserva cancelada con éxito.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cancelar la reserva.')
      }
    } catch {
      console.error('Error cancelando reserva')
      toast.error('Error de conexión al cancelar la reserva.')
    }
  }

  const handleCrearSolicitud = async () => {
    if (!nuevaSolicitud.titulo.trim()) {
      toast.error('El título de la solicitud es obligatorio.')
      return
    }

    try {
      const res = await fetch('/api/portal/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaSolicitud,
          ubicacion: nuevaSolicitud.ubicacion || residente?.unidad || '',
        }),
      })

      if (res.ok) {
        setSolicitudDialogOpen(false)
        setNuevaSolicitud({
          titulo: '',
          descripcion: '',
          tipo: 'Mantenimiento',
          prioridad: 'Normal',
          ubicacion: '',
        })
        void fetchSolicitudes()
        toast.success('Solicitud creada con éxito.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear la solicitud.')
      }
    } catch {
      console.error('Error creando solicitud')
      toast.error('Error de conexión al crear la solicitud.')
    }
  }

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !solicitudSeleccionada) {
      toast.error('El mensaje no puede estar vacío.')
      return
    }

    try {
      const res = await fetch('/api/portal/solicitudes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitudSeleccionada.id,
          conversacion: (solicitudSeleccionada.conversacion || '') + `\nResidente: ${nuevoMensaje}`,
        }),
      })

      if (res.ok) {
        setNuevoMensaje('')
        void fetchSolicitudes()
        toast.success('Mensaje enviado.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al enviar el mensaje.')
      }
    } catch {
      console.error('Error enviando mensaje')
      toast.error('Error de conexión al enviar el mensaje.')
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
    if (!residente?.id) {
      toast.error('Debe iniciar sesión como residente para importar solicitudes.')
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
          titulo: item.Titulo || '',
          descripcion: item.Descripcion || null,
          tipo: item.Tipo || 'Mantenimiento',
          prioridad: item.Prioridad || 'Normal',
          estado: item.Estado || 'Pendiente',
          ubicacion: item.Ubicacion || residente.unidad || null,
          fechaSolicitud: item['Fecha Solicitud'] ? new Date(item['Fecha Solicitud']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          residenteId: residente.id,
        }))

        const res = await fetch('/api/portal/solicitudes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Solicitudes importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchSolicitudes()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar solicitudes. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Cargando portal...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="text-center">
            <Image src="/logo.png" alt="Logo" width={100} height={100} className="mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Acceso al Portal de Residentes</CardTitle>
            <p className="text-slate-500">Ingresa tus credenciales para acceder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  type="text"
                  placeholder="12.345.678-9"
                  value={loginForm.rut}
                  onChange={(e) => setLoginForm({ ...loginForm, rut: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidad">Número de Unidad</Label>
                <Input
                  id="unidad"
                  type="text"
                  placeholder="Ej: 101, A-5"
                  value={loginForm.unidad}
                  onChange={(e) => setLoginForm({ ...loginForm.unidad, unidad: e.target.value })}
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <Button type="submit" className="w-full bg-[#0f2040] hover:bg-[#1a3155]" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f2040] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo-white.png" alt="Logo" width={40} height={40} />
            <h1 className="text-xl font-bold">Portal de Residentes</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Hola, {residente?.nombre} ({residente?.unidad})</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-[#1a3155]">
              <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-200">
            <TabsTrigger value="dashboard"><Home className="w-4 h-4 mr-2" /> Dashboard</TabsTrigger>
            <TabsTrigger value="estado-cuenta"><CreditCard className="w-4 h-4 mr-2" /> Estado de Cuenta</TabsTrigger>
            <TabsTrigger value="reservas"><Calendar className="w-4 h-4 mr-2" /> Reservas</TabsTrigger>
            <TabsTrigger value="solicitudes"><Wrench className="w-4 h-4 mr-2" /> Solicitudes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                  <Wallet className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCLP(resumen.totalDeuda)}</div>
                  <p className="text-xs text-slate-500">Incluye intereses de mora</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deudas Vencidas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{resumen.deudasVencidas}</div>
                  <p className="text-xs text-slate-500">{resumen.cantidadDeudas} deudas en total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próxima Reserva</CardTitle>
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  {reservas.length > 0 ? (
                    <div className="text-2xl font-bold">{reservas[0].espacio}</div>
                  ) : (
                    <div className="text-2xl font-bold">No hay reservas</div>
                  )}
                  <p className="text-xs text-slate-500">{reservas.length > 0 ? `El ${formatDate(reservas[0].fecha)}` : 'Crea una nueva reserva'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Mis Solicitudes Recientes</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudes.slice(0, 5).map(sol => (
                        <TableRow key={sol.id}>
                          <TableCell>{sol.titulo}</TableCell>
                          <TableCell><Badge variant="outline">{sol.tipo}</Badge></TableCell>
                          <TableCell><Badge className={sol.estado === 'Resuelta' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{sol.estado}</Badge></TableCell>
                          <TableCell>{formatDate(sol.fechaSolicitud)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => { setSolicitudSeleccionada(sol); setDetalleSolicitudOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="estado-cuenta" className="mt-4">
            <h2 className="text-xl font-bold mb-4">Estado de Cuenta</h2>
            {loading ? (
              <div className="text-center text-slate-500">Cargando estado de cuenta...</div>
            ) : ( 
              <div className="space-y-4">
                {estadosCuenta.map(ec => (
                  <Card key={ec.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Período: {ec.periodo}</span>
                        <Badge className={ec.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{ec.estado}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <p>Saldo Anterior: {formatCLP(ec.saldoAnterior)}</p>
                      <p>Cargos del Mes: {formatCLP(ec.cargosMes)}</p>
                      <p>Pagos del Mes: {formatCLP(ec.pagosMes)}</p>
                      <p>Saldo Actual: {formatCLP(ec.saldoActual)}</p>
                      <p>Intereses por Mora: {formatCLP(ec.interesesMora)}</p>
                      <p>Total a Pagar: <span className="font-bold">{formatCLP(ec.totalPagar)}</span></p>
                      <p className="col-span-2">Vencimiento: {ec.fechaVencimiento ? formatDate(ec.fechaVencimiento) : 'N/A'}</p>
                    </CardContent>
                  </Card>
                ))}
                {estadosCuenta.length === 0 && <p className="text-center text-slate-500">No hay estados de cuenta disponibles.</p>}
              </div>
            )}

            <h3 className="text-xl font-bold mt-6 mb-4">Detalle de Deudas</h3>
            {loading ? (
              <div className="text-center text-slate-500">Cargando deudas...</div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Monto Original</TableHead>
                        <TableHead>Intereses</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Días Mora</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deudas.map(deuda => (
                        <TableRow key={deuda.id}>
                          <TableCell>{deuda.periodo}</TableCell>
                          <TableCell>{deuda.concepto}</TableCell>
                          <TableCell>{formatCLP(deuda.montoOriginal)}</TableCell>
                          <TableCell>{formatCLP(deuda.montoInteres)}</TableCell>
                          <TableCell>{formatCLP(deuda.montoTotal)}</TableCell>
                          <TableCell>{deuda.diasMora}</TableCell>
                          <TableCell><Badge className={deuda.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{deuda.estado}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {deudas.length === 0 && !loading && <p className="text-center text-slate-500 mt-4">No hay deudas pendientes.</p>}
          </TabsContent>

          <TabsContent value="reservas" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mis Reservas</h2>
              <Button onClick={() => setReservaDialogOpen(true)} className="bg-[#0f2040] hover:bg-[#1a3155]">
                <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
              </Button>
            </div>
            {loading ? (
              <div className="text-center text-slate-500">Cargando reservas...</div>
            ) : (
              <div className="space-y-4">
                {reservas.map(reserva => (
                  <Card key={reserva.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{reserva.titulo} - {reserva.espacio}</span>
                        <Badge className={reserva.estado === 'Confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{reserva.estado}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <p>Fecha: {formatDate(reserva.fecha)}</p>
                      <p>Hora: {reserva.horaInicio} - {reserva.horaFin}</p>
                      <p>Monto: {formatCLP(reserva.monto)}</p>
                      <p>Pagado: {reserva.pagado ? 'Sí' : 'No'}</p>
                      <p className="col-span-2">Notas: {reserva.notas || 'N/A'}</p>
                      {reserva.estado === 'Pendiente' && (
                        <div className="col-span-2 flex justify-end">
                          <Button variant="destructive" size="sm" onClick={() => handleCancelarReserva(reserva.id)}>
                            Cancelar Reserva
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {reservas.length === 0 && <p className="text-center text-slate-500">No tienes reservas realizadas.</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="solicitudes" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mis Solicitudes</h2>
              <div className="flex gap-2">
                <ExportButton />
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-1" /> Importar
                </Button>
                <Button onClick={() => setSolicitudDialogOpen(true)} className="bg-[#0f2040] hover:bg-[#1a3155]">
                  <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="text-center text-slate-500">Cargando solicitudes...</div>
            ) : (
              <div className="space-y-4">
                {solicitudes.map(sol => (
                  <Card key={sol.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{sol.titulo}</span>
                        <Badge className={sol.estado === 'Resuelta' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{sol.estado}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <p>Tipo: <Badge variant="outline">{sol.tipo}</Badge></p>
                      <p>Prioridad: <Badge variant="outline">{sol.prioridad}</Badge></p>
                      <p>Fecha Solicitud: {formatDate(sol.fechaSolicitud)}</p>
                      <p>Ubicación: {sol.ubicacion || 'N/A'}</p>
                      <div className="col-span-2 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setSolicitudSeleccionada(sol); setDetalleSolicitudOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" /> Ver Detalle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {solicitudes.length === 0 && <p className="text-center text-slate-500">No tienes solicitudes realizadas.</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogo Nueva Reserva */}
      <Dialog open={reservaDialogOpen} onOpenChange={setReservaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Reserva de Espacio Común</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reservaTitulo">Título de la Reserva</Label>
              <Input id="reservaTitulo" value={nuevaReserva.titulo} onChange={(e) => setNuevaReserva({ ...nuevaReserva, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="espacio">Espacio</Label>
              <Select value={nuevaReserva.espacio} onValueChange={(v) => setNuevaReserva({ ...nuevaReserva, espacio: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {espaciosComunes.map(esp => <SelectItem key={esp} value={esp}>{esp}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input type="date" id="fecha" value={nuevaReserva.fecha} onChange={(e) => setNuevaReserva({ ...nuevaReserva, fecha: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora Inicio</Label>
                <Input type="time" id="horaInicio" value={nuevaReserva.horaInicio} onChange={(e) => setNuevaReserva({ ...nuevaReserva, horaInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFin">Hora Fin</Label>
                <Input type="time" id="horaFin" value={nuevaReserva.horaFin} onChange={(e) => setNuevaReserva({ ...nuevaReserva, horaFin: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numPersonas">Número de Personas</Label>
              <Input type="number" id="numPersonas" value={nuevaReserva.numPersonas} onChange={(e) => setNuevaReserva({ ...nuevaReserva, numPersonas: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas Adicionales</Label>
              <Textarea id="notas" value={nuevaReserva.notas} onChange={(e) => setNuevaReserva({ ...nuevaReserva, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReservaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrearReserva}>Crear Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Nueva Solicitud */}
      <Dialog open={solicitudDialogOpen} onOpenChange={setSolicitudDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="solicitudTitulo">Título</Label>
              <Input id="solicitudTitulo" value={nuevaSolicitud.titulo} onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitudDescripcion">Descripción</Label>
              <Textarea id="solicitudDescripcion" value={nuevaSolicitud.descripcion} onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitudTipo">Tipo</Label>
              <Select value={nuevaSolicitud.tipo} onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SOLICITUD.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitudPrioridad">Prioridad</Label>
              <Select value={nuevaSolicitud.prioridad} onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, prioridad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES_SOLICITUD.map(prio => <SelectItem key={prio} value={prio}>{prio}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitudUbicacion">Ubicación (Opcional)</Label>
              <Input id="solicitudUbicacion" value={nuevaSolicitud.ubicacion} onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, ubicacion: e.target.value })} placeholder={residente?.unidad || ''} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSolicitudDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrearSolicitud}>Enviar Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Detalle Solicitud */}
      <Dialog open={detalleSolicitudOpen} onOpenChange={setDetalleSolicitudOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de Solicitud: {solicitudSeleccionada?.titulo}</DialogTitle>
          </DialogHeader>
          {solicitudSeleccionada && (
            <div className="grid gap-4 py-4 text-sm">
              <p><strong>Tipo:</strong> <Badge variant="outline">{solicitudSeleccionada.tipo}</Badge></p>
              <p><strong>Prioridad:</strong> <Badge variant="outline">{solicitudSeleccionada.prioridad}</Badge></p>
              <p><strong>Estado:</strong> <Badge className={solicitudSeleccionada.estado === 'Resuelta' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{solicitudSeleccionada.estado}</Badge></p>
              <p><strong>Fecha Solicitud:</strong> {formatDate(solicitudSeleccionada.fechaSolicitud)}</p>
              <p><strong>Ubicación:</strong> {solicitudSeleccionada.ubicacion || 'N/A'}</p>
              <p className="col-span-2"><strong>Descripción:</strong> {solicitudSeleccionada.descripcion || 'N/A'}</p>

              <Separator className="my-2 col-span-2" />
              <h4 className="font-semibold col-span-2">Conversación</h4>
              <ScrollArea className="h-40 w-full rounded-md border p-4 col-span-2">
                <p className="whitespace-pre-wrap">{solicitudSeleccionada.conversacion || 'No hay conversación.'}</p>
              </ScrollArea>
              <div className="col-span-2 flex gap-2">
                <Input
                  placeholder="Escribe tu mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEnviarMensaje()
                    }
                  }}
                />
                <Button onClick={handleEnviarMensaje}><Send className="w-4 h-4" /></Button>
              </div>

              {solicitudSeleccionada.respuesta && (
                <div className="col-span-2 mt-2">
                  <h4 className="font-semibold">Respuesta Administración:</h4>
                  <p>{solicitudSeleccionada.respuesta}</p>
                  <p className="text-xs text-slate-500">({formatDate(solicitudSeleccionada.fechaRespuesta)})</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalleSolicitudOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva de Solicitudes */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Solicitudes Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las solicitudes. Asegúrate de que las columnas coincidan con los campos (Título, Descripción, Tipo, Prioridad, Estado, Ubicación, Fecha Solicitud).</p>
            <FileUpload
              label="Archivo de Solicitudes"
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
