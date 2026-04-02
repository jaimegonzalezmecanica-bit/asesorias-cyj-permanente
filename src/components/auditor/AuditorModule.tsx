
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield,
  Activity,
  AlertTriangle,
  FileSearch,
  Download,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  Calendar,
  BarChart3,
  Upload,
  Loader2
} from 'lucide-react'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface Auditoria {
  id: string
  tipoAccion: string
  modulo: string
  descripcion: string
  entidad?: string | null
  entidadId?: string | null
  datosAntes?: string | null
  datosDespues?: string | null
  usuarioId?: string | null
  usuarioNombre?: string | null
  ip?: string | null
  userAgent?: string | null
  resultado: string
  mensajeError?: string | null
  createdAt: string
}

interface Stats {
  total: number
  accionesHoy: number
  accionesSemana: number
  accionesPorModulo: { modulo: string; count: number }[]
  erroresRecientes: Auditoria[]
}

interface Filtros {
  modulos: string[]
  usuarios: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const TIPOS_ACCION = [
  { value: 'Acceso', label: 'Acceso', color: 'bg-blue-100 text-blue-700', icon: <Eye className="w-3 h-3" /> },
  { value: 'Modificación', label: 'Modificación', color: 'bg-amber-100 text-amber-700', icon: <Edit className="w-3 h-3" /> },
  { value: 'Eliminación', label: 'Eliminación', color: 'bg-red-100 text-red-700', icon: <Trash2 className="w-3 h-3" /> },
  { value: 'Exportación', label: 'Exportación', color: 'bg-green-100 text-green-700', icon: <Download className="w-3 h-3" /> },
  { value: 'Backup', label: 'Backup', color: 'bg-purple-100 text-purple-700', icon: <Database className="w-3 h-3" /> },
  { value: 'Login', label: 'Login', color: 'bg-emerald-100 text-emerald-700', icon: <LogIn className="w-3 h-3" /> },
  { value: 'Logout', label: 'Logout', color: 'bg-slate-100 text-slate-700', icon: <LogOut className="w-3 h-3" /> },
]

const getTipoAccionConfig = (tipo: string) => {
  return TIPOS_ACCION.find(t => t.value === tipo) || { 
    value: tipo, 
    label: tipo, 
    color: 'bg-slate-100 text-slate-700', 
    icon: <Activity className="w-3 h-3" /> 
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatJSON = (jsonStr: string | null | undefined): string => {
  if (!jsonStr) return '-'
  try {
    const parsed = JSON.parse(jsonStr)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return jsonStr
  }
}

export function AuditorModule() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    accionesHoy: 0,
    accionesSemana: 0,
    accionesPorModulo: [],
    erroresRecientes: []
  })
  const [filtros, setFiltros] = useState<Filtros>({
    modulos: [],
    usuarios: []
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Filter state
  const [filterTipoAccion, setFilterTipoAccion] = useState('todos')
  const [filterModulo, setFilterModulo] = useState('todos')
  const [filterUsuario, setFilterUsuario] = useState('todos')
  const [filterResultado, setFilterResultado] = useState('todos')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'createdAt', label: 'Fecha', defaultVisible: true },
    { key: 'tipoAccion', label: 'Tipo Acción', defaultVisible: true },
    { key: 'modulo', label: 'Módulo', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'entidad', label: 'Entidad', defaultVisible: false },
    { key: 'entidadId', label: 'Entidad ID', defaultVisible: false },
    { key: 'usuarioNombre', label: 'Usuario', defaultVisible: true },
    { key: 'ip', label: 'IP', defaultVisible: false },
    { key: 'resultado', label: 'Resultado', defaultVisible: true },
    { key: 'mensajeError', label: 'Mensaje Error', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipoAccion', label: 'Tipo Acción', type: 'select', options: TIPOS_ACCION.map(t => t.value) },
    { key: 'modulo', label: 'Módulo', type: 'select', options: filtros.modulos },
    { key: 'usuario', label: 'Usuario', type: 'select', options: filtros.usuarios },
    { key: 'resultado', label: 'Resultado', type: 'select', options: ['Exitoso', 'Fallido'] },
    { key: 'fechaDesde', label: 'Fecha Desde', type: 'date' },
    { key: 'fechaHasta', label: 'Fecha Hasta', type: 'date' },
  ], [filtros])

  const { ExportButton } = useExport({
    moduleName: 'auditoria',
    moduleLabel: 'Registros de Auditoría',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => auditorias // This will export the currently filtered data
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTipoAccion !== 'todos') params.append('tipoAccion', filterTipoAccion)
      if (filterModulo !== 'todos') params.append('modulo', filterModulo)
      if (filterUsuario !== 'todos') params.append('usuario', filterUsuario)
      if (filterResultado !== 'todos') params.append('resultado', filterResultado)
      if (filterFechaDesde) params.append('fechaDesde', filterFechaDesde)
      if (filterFechaHasta) params.append('fechaHasta', filterFechaHasta)
      if (searchText) params.append('search', searchText)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const res = await fetch(`/api/auditoria?${params.toString()}`)
      const data = await res.json()
      setAuditorias(data.auditorias || [])
      setStats(data.stats || stats)
      setFiltros(data.filtros || filtros)
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching auditoria:', error)
      toast.error('Error al cargar registros de auditoría.')
    } finally {
      setLoading(false)
    }
  }, [filterTipoAccion, filterModulo, filterUsuario, filterResultado, filterFechaDesde, filterFechaHasta, searchText, pagination.page, pagination.limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setFilterTipoAccion('todos')
    setFilterModulo('todos')
    setFilterUsuario('todos')
    setFilterResultado('todos')
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setSearchText('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = () => {
    return filterTipoAccion !== 'todos' ||
           filterModulo !== 'todos' ||
           filterUsuario !== 'todos' ||
           filterResultado !== 'todos' ||
           filterFechaDesde !== '' ||
           filterFechaHasta !== '' ||
           searchText !== ''
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
          tipoAccion: item['Tipo Acción'] || 'Desconocido',
          modulo: item.Modulo || 'Desconocido',
          descripcion: item.Descripción || 'Sin descripción',
          entidad: item.Entidad || null,
          entidadId: item['Entidad ID'] || null,
          datosAntes: item['Datos Antes'] ? JSON.stringify(item['Datos Antes']) : null,
          datosDespues: item['Datos Después'] ? JSON.stringify(item['Datos Después']) : null,
          usuarioId: item['Usuario ID'] || null,
          usuarioNombre: item.Usuario || 'Sistema',
          ip: item.IP || null,
          userAgent: item['User Agent'] || null,
          resultado: item.Resultado || 'Exitoso',
          mensajeError: item['Mensaje Error'] || null,
          createdAt: item.Fecha ? new Date(item.Fecha).toISOString() : new Date().toISOString(),
        }))

        const res = await fetch('/api/auditoria/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Registros de auditoría importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar registros de auditoría. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  const exportToPDF = () => {
    // Generate HTML table for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Auditoría del Sistema</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #0f2040; margin-bottom: 10px; }
          .subtitle { color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #0f2040; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .exitoso { color: #16a34a; }
          .fallido { color: #dc2626; }
          .summary { margin-bottom: 20px; display: flex; gap: 20px; }
          .summary-item { background: #f8fafc; padding: 10px 20px; border-radius: 8px; }
          .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #0f2040; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Auditoría del Sistema</h1>
        <p class="subtitle">Generado el ${new Date().toLocaleString('es-CL')}</p>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Registros</div>
            <div class="summary-value">${stats.total}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Acciones Hoy</div>
            <div class="summary-value">${stats.accionesHoy}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Acciones Semana</div>
            <div class="summary-value">${stats.accionesSemana}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo Acción</th>
              <th>Módulo</th>
              <th>Descripción</th>
              <th>Usuario</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            ${auditorias.map(a => `
              <tr>
                <td>${formatDate(a.createdAt)}</td>
                <td>${a.tipoAccion}</td>
                <td>${a.modulo}</td>
                <td>${a.descripcion}</td>
                <td>${a.usuarioNombre || 'N/A'}</td>
                <td class="${a.resultado === 'Exitoso' ? 'exitoso' : 'fallido'}">${a.resultado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando registros de auditoría...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Shield className="w-5 h-5 text-blue-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Auditoría del Sistema</h2>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acciones Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accionesHoy}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acciones Semana</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accionesSemana}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores Recientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.erroresRecientes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por descripción, entidad, usuario..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipoAccion} onValueChange={setFilterTipoAccion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las acciones</SelectItem>
            {TIPOS_ACCION.map(tipo => <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterModulo} onValueChange={setFilterModulo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los módulos</SelectItem>
            {filtros.modulos.map(mod => <SelectItem key={mod} value={mod}>{mod}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterUsuario} onValueChange={setFilterUsuario}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por usuario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los usuarios</SelectItem>
            {filtros.usuarios.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterResultado} onValueChange={setFilterResultado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los resultados</SelectItem>
            <SelectItem value="Exitoso">Exitoso</SelectItem>
            <SelectItem value="Fallido">Fallido</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} placeholder="Fecha Desde" className="w-[150px]" />
        <Input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} placeholder="Fecha Hasta" className="w-[150px]" />
        {hasActiveFilters() && (
          <Button variant="outline" onClick={clearFilters}><X className="w-4 h-4 mr-1" /> Limpiar Filtros</Button>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead className="w-[120px]">Acción</TableHead>
                  <TableHead className="w-[120px]">Módulo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[150px]">Usuario</TableHead>
                  <TableHead className="w-[100px]">Resultado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
                ) : auditorias.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No hay registros de auditoría que coincidan con los filtros.</TableCell></TableRow>
                ) : (
                  auditorias.map((auditoria) => {
                    const tipoConfig = getTipoAccionConfig(auditoria.tipoAccion)
                    return (
                      <TableRow key={auditoria.id}>
                        <TableCell className="text-xs">{formatDate(auditoria.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${tipoConfig.color} flex items-center gap-1`}>
                            {tipoConfig.icon} {tipoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{auditoria.modulo}</TableCell>
                        <TableCell className="text-xs">{auditoria.descripcion}</TableCell>
                        <TableCell className="text-xs">{auditoria.usuarioNombre || 'Sistema'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={auditoria.resultado === 'Exitoso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {auditoria.resultado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedAuditoria(auditoria); setDetalleDialogOpen(true); }}>
                            <FileSearch className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="flex-1 text-sm text-muted-foreground">
          Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Detalle Dialog */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Registro de Auditoría</DialogTitle>
          </DialogHeader>
          {selectedAuditoria && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha:</Label>
                <span className="col-span-3">{formatDate(selectedAuditoria.createdAt)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Tipo Acción:</Label>
                <span className="col-span-3">{getTipoAccionConfig(selectedAuditoria.tipoAccion).label}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Módulo:</Label>
                <span className="col-span-3">{selectedAuditoria.modulo}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Descripción:</Label>
                <span className="col-span-3">{selectedAuditoria.descripcion}</span>
              </div>
              {selectedAuditoria.entidad && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Entidad:</Label>
                  <span className="col-span-3">{selectedAuditoria.entidad}</span>
                </div>
              )}
              {selectedAuditoria.entidadId && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">ID Entidad:</Label>
                  <span className="col-span-3">{selectedAuditoria.entidadId}</span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Usuario:</Label>
                <span className="col-span-3">{selectedAuditoria.usuarioNombre || 'Sistema'}</span>
              </div>
              {selectedAuditoria.ip && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">IP:</Label>
                  <span className="col-span-3">{selectedAuditoria.ip}</span>
                </div>
              )}
              {selectedAuditoria.userAgent && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">User Agent:</Label>
                  <span className="col-span-3 break-all">{selectedAuditoria.userAgent}</span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Resultado:</Label>
                <span className={`col-span-3 font-semibold ${selectedAuditoria.resultado === 'Exitoso' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAuditoria.resultado}
                </span>
              </div>
              {selectedAuditoria.mensajeError && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold">Error:</Label>
                  <pre className="col-span-3 bg-red-50 p-2 rounded-md text-xs overflow-auto">{selectedAuditoria.mensajeError}</pre>
                </div>
              )}
              {selectedAuditoria.datosAntes && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold">Datos Antes:</Label>
                  <pre className="col-span-3 bg-slate-50 p-2 rounded-md text-xs overflow-auto">{formatJSON(selectedAuditoria.datosAntes)}</pre>
                </div>
              )}
              {selectedAuditoria.datosDespues && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold">Datos Después:</Label>
                  <pre className="col-span-3 bg-slate-50 p-2 rounded-md text-xs overflow-auto">{formatJSON(selectedAuditoria.datosDespues)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Registros de Auditoría Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los registros de auditoría. Asegúrate de que las columnas coincidan con los campos (Fecha, Tipo Acción, Módulo, Descripción, Entidad, Entidad ID, Datos Antes, Datos Después, Usuario ID, Usuario, IP, User Agent, Resultado, Mensaje Error).</p>
            <FileUpload
              label="Archivo de Auditoría"
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
