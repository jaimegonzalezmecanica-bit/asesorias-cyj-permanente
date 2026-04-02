
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  Plus,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Calendar,
  FileText,
  Shield,
  Play,
  Pause,
  Archive,
  Info,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface Backup {
  id: string
  tipo: string
  estado: string
  fechaInicio: string | null
  fechaFin: string | null
  tamano: number
  ubicacion: string | null
  archivo: string | null
  incluyeBase64: boolean
  mensajeError: string | null
  verificado: boolean
  fechaVerificacion: string | null
  totalTablas: number
  totalRegistros: number
  createdAt: string
}

interface Stats {
  total: number
  completados: number
  fallidos: number
  backupsEsteMes: number
  ultimoBackup: string | null
  tamanoTotal: number
}

interface Config {
  frecuencia: string
  hora: string
  retencionDias: number
  incluyeBase64: boolean
  ultimoEjecutado: string | null
  activo: boolean
}

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-slate-100 text-slate-700', icon: <Clock className="w-3 h-3" /> },
  { value: 'EnProgreso', label: 'En Progreso', color: 'bg-blue-100 text-blue-700', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  { value: 'Completado', label: 'Completado', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  { value: 'Fallido', label: 'Fallido', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
]

const TIPOS = [
  { value: 'Automatico', label: 'Automático', color: 'bg-purple-100 text-purple-700' },
  { value: 'Manual', label: 'Manual', color: 'bg-amber-100 text-amber-700' },
]

const FRECUENCIAS = ['Diario', 'Semanal', 'Mensual']

const getEstadoConfig = (estado: string) => {
  return ESTADOS.find(e => e.value === estado) || ESTADOS[0]
}

const getTipoConfig = (tipo: string) => {
  return TIPOS.find(t => t.value === tipo) || TIPOS[1]
}

const formatDate = (date: string | Date | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSize = (mb: number) => {
  if (mb < 1) return `${(mb * 1024).toFixed(1)} KB`
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(2)} MB`
}

export function BackupsModule() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completados: 0,
    fallidos: 0,
    backupsEsteMes: 0,
    ultimoBackup: null,
    tamanoTotal: 0
  })
  const [config, setConfig] = useState<Config>({
    frecuencia: 'Diario',
    hora: '02:00',
    retencionDias: 30,
    incluyeBase64: false,
    ultimoEjecutado: null,
    activo: true
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)

  // Filters
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')

  // Dialogs
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)

  // Config form
  const [configForm, setConfigForm] = useState(config)

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'fechaInicio', label: 'Fecha Inicio', defaultVisible: true },
    { key: 'fechaFin', label: 'Fecha Fin', defaultVisible: true },
    { key: 'tamano', label: 'Tamaño (MB)', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: false },
    { key: 'archivo', label: 'Nombre Archivo', defaultVisible: false },
    { key: 'incluyeBase64', label: 'Incluye Base64', defaultVisible: false },
    { key: 'mensajeError', label: 'Mensaje Error', defaultVisible: false },
    { key: 'verificado', label: 'Verificado', defaultVisible: false },
    { key: 'fechaVerificacion', label: 'Fecha Verificación', defaultVisible: false },
    { key: 'totalTablas', label: 'Total Tablas', defaultVisible: false },
    { key: 'totalRegistros', label: 'Total Registros', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS.map(e => e.value) },
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS.map(t => t.value) },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'backups',
    moduleLabel: 'Respaldos',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => backups
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterEstado !== 'todos') params.append('estado', filterEstado)
      if (filterTipo !== 'todos') params.append('tipo', filterTipo)

      const [backupsRes, configRes] = await Promise.all([
        fetch(`/api/backups?${params.toString()}`),
        fetch('/api/backups/config')
      ])

      const backupsData = await backupsRes.json()
      const configData = await configRes.json()

      setBackups(backupsData.backups || [])
      setStats(backupsData.stats || stats)
      setConfig(configData)
      setConfigForm(configData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos de respaldos.')
    } finally {
      setLoading(false)
    }
  }, [filterEstado, filterTipo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Poll for updates if there's a backup in progress
  useEffect(() => {
    const inProgress = backups.some(b => b.estado === 'EnProgreso' || b.estado === 'Pendiente')
    if (inProgress) {
      const interval = setInterval(fetchData, 2000)
      return () => clearInterval(interval)
    }
  }, [backups, fetchData])

  const createBackup = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'Manual', incluyeBase64: false })
      })
      
      if (res.ok) {
        fetchData()
        toast.success('Respaldo manual iniciado con éxito.')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al crear respaldo')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Error al crear respaldo')
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      const res = await fetch(`/api/backups/${backup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' })
      })
      
      const data = await res.json()
      
      if (data.base64) {
        // Create download link
        const link = document.createElement('a')
        link.href = `data:application/octet-stream;base64,${data.base64}`
        link.download = data.archivo || `backup_${backup.id}.db`
        link.click()
        toast.success('Respaldo descargado con éxito.')
      } else {
        toast.error('No se pudo obtener el archivo de respaldo para descargar.')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Error al descargar respaldo')
    }
  }

  const restoreBackup = async () => {
    if (!selectedBackup) return
    
    setRestoreProgress(10)
    try {
      setRestoreProgress(30)
      const res = await fetch(`/api/backups/restore/${selectedBackup.id}`, {
        method: 'POST'
      })
      
      setRestoreProgress(70)
      
      if (res.ok) {
        setRestoreProgress(100)
        setTimeout(() => {
          setRestoreDialogOpen(false)
          setRestoreProgress(0)
          fetchData()
          toast.success('Base de datos restaurada correctamente')
        }, 500)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al restaurar respaldo')
        setRestoreProgress(0)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Error al restaurar respaldo')
      setRestoreProgress(0)
    }
  }

  const deleteBackup = async () => {
    if (!selectedBackup) return
    
    try {
      const res = await fetch(`/api/backups/${selectedBackup.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setDeleteDialogOpen(false)
        setSelectedBackup(null)
        fetchData()
        toast.success('Respaldo eliminado con éxito.')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al eliminar respaldo')
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Error al eliminar respaldo')
    }
  }

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/backups/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      })
      
      if (res.ok) {
        setConfig(configForm)
        setConfigDialogOpen(false)
        toast.success('Configuración de respaldos guardada con éxito.')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar configuración')
    }
  }

  const cleanOldBackups = async () => {
    try {
      const res = await fetch('/api/backups/config', {
        method: 'DELETE'
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(`Limpieza completada: ${data.eliminados} respaldos eliminados`)
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al limpiar respaldos antiguos')
      }
    } catch (error) {
      console.error('Error cleaning backups:', error)
      toast.error('Error al limpiar respaldos antiguos')
    }
  }

  const openRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup)
    setRestoreDialogOpen(true)
  }

  const openDeleteDialog = (backup: Backup) => {
    setSelectedBackup(backup)
    setDeleteDialogOpen(true)
  }

  const openDetailDialog = (backup: Backup) => {
    setSelectedBackup(backup)
    setDetailDialogOpen(true)
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
          tipo: item.Tipo || 'Manual',
          estado: item.Estado || 'Completado',
          fechaInicio: item['Fecha Inicio'] ? new Date(item['Fecha Inicio']).toISOString() : null,
          fechaFin: item['Fecha Fin'] ? new Date(item['Fecha Fin']).toISOString() : null,
          tamano: Number(item.Tamaño) || 0,
          ubicacion: item.Ubicacion || null,
          archivo: item.Archivo || null,
          incluyeBase64: item['Incluye Base64'] === 'TRUE',
          mensajeError: item['Mensaje Error'] || null,
          verificado: item.Verificado === 'TRUE',
          fechaVerificacion: item['Fecha Verificación'] ? new Date(item['Fecha Verificación']).toISOString() : null,
          totalTablas: Number(item['Total Tablas']) || 0,
          totalRegistros: Number(item['Total Registros']) || 0,
          createdAt: item['Fecha Creación'] ? new Date(item['Fecha Creación']).toISOString() : new Date().toISOString(),
        }))

        const res = await fetch('/api/backups/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Respaldos importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar respaldos. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando respaldos...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Database className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Gestión de Respaldos</h2>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={createBackup} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Crear Respaldo Manual
          </Button>
          <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-1" /> Configuración
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Respaldos</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fallidos}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamaño Total</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(stats.tamanoTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map(estado => <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map(tipo => <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Fecha Creación</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="w-[100px]">Tamaño</TableHead>
                  <TableHead className="w-[100px]">Verificado</TableHead>
                  <TableHead className="w-[150px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No hay respaldos disponibles.</TableCell></TableRow>
                ) : (
                  backups.map((backup) => {
                    const estadoConfig = getEstadoConfig(backup.estado)
                    const tipoConfig = getTipoConfig(backup.tipo)
                    return (
                      <TableRow key={backup.id}>
                        <TableCell className="text-xs">{formatDate(backup.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${tipoConfig.color}`}>
                            {tipoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${estadoConfig.color} flex items-center gap-1`}>
                            {estadoConfig.icon} {estadoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{backup.archivo || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{formatSize(backup.tamano)}</TableCell>
                        <TableCell>
                          {backup.verificado ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openDetailDialog(backup)} title="Ver Detalle">
                              <Info className="w-4 h-4" />
                            </Button>
                            {backup.estado === 'Completado' && (
                              <Button variant="ghost" size="sm" onClick={() => downloadBackup(backup)} title="Descargar">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {backup.estado === 'Completado' && (
                              <Button variant="ghost" size="sm" onClick={() => openRestoreDialog(backup)} title="Restaurar">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(backup)} title="Eliminar">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
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

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de Respaldos Automáticos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia</Label>
              <Select value={configForm.frecuencia} onValueChange={(v) => setConfigForm({ ...configForm, frecuencia: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona frecuencia" /></SelectTrigger>
                <SelectContent>
                  {FRECUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora de Ejecución</Label>
              <Input id="hora" type="time" value={configForm.hora} onChange={(e) => setConfigForm({ ...configForm, hora: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retencionDias">Días de Retención</Label>
              <Input id="retencionDias" type="number" value={configForm.retencionDias} onChange={(e) => setConfigForm({ ...configForm, retencionDias: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="incluyeBase64">Incluir Base64 en Respaldo</Label>
              <Switch
                id="incluyeBase64"
                checked={configForm.incluyeBase64}
                onCheckedChange={(checked) => setConfigForm({ ...configForm, incluyeBase64: checked })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="activo">Respaldos Automáticos Activos</Label>
              <Switch
                id="activo"
                checked={configForm.activo}
                onCheckedChange={(checked) => setConfigForm({ ...configForm, activo: checked })}
              />
            </div>
            {config.ultimoEjecutado && (
              <p className="text-sm text-slate-500">Última ejecución: {formatDate(config.ultimoEjecutado)}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveConfig}>Guardar Configuración</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauración de Respaldo</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de restaurar la base de datos a partir del respaldo <span className="font-bold">{selectedBackup?.archivo}</span>. Esta acción sobrescribirá los datos actuales y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {restoreProgress > 0 && (
              <div className="space-y-2">
                <Label>Progreso de Restauración</Label>
                <Progress value={restoreProgress} className="w-full" />
                <p className="text-center text-sm text-slate-500">{restoreProgress}% completado</p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreProgress > 0}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restoreBackup} disabled={restoreProgress > 0}>
              {restoreProgress > 0 ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el respaldo <span className="font-bold">{selectedBackup?.archivo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBackup}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Respaldo</DialogTitle>
          </DialogHeader>
          {selectedBackup && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">ID:</Label>
                <span className="col-span-3">{selectedBackup.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Tipo:</Label>
                <span className="col-span-3">{getTipoConfig(selectedBackup.tipo).label}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Estado:</Label>
                <span className="col-span-3">
                  <Badge variant="outline" className={`${getEstadoConfig(selectedBackup.estado).color} flex items-center gap-1`}>
                    {getEstadoConfig(selectedBackup.estado).icon} {getEstadoConfig(selectedBackup.estado).label}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha Inicio:</Label>
                <span className="col-span-3">{formatDate(selectedBackup.fechaInicio)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Fecha Fin:</Label>
                <span className="col-span-3">{formatDate(selectedBackup.fechaFin)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Tamaño:</Label>
                <span className="col-span-3">{formatSize(selectedBackup.tamano)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Ubicación:</Label>
                <span className="col-span-3">{selectedBackup.ubicacion || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Archivo:</Label>
                <span className="col-span-3">{selectedBackup.archivo || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Incluye Base64:</Label>
                <span className="col-span-3">{selectedBackup.incluyeBase64 ? 'Sí' : 'No'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Verificado:</Label>
                <span className="col-span-3">{selectedBackup.verificado ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
              </div>
              {selectedBackup.fechaVerificacion && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Fecha Verificación:</Label>
                  <span className="col-span-3">{formatDate(selectedBackup.fechaVerificacion)}</span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Total Tablas:</Label>
                <span className="col-span-3">{selectedBackup.totalTablas}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Total Registros:</Label>
                <span className="col-span-3">{selectedBackup.totalRegistros}</span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">Mensaje Error:</Label>
                <pre className="col-span-3 bg-red-50 p-2 rounded-md text-xs overflow-auto">{selectedBackup.mensajeError || 'N/A'}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Respaldos Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los respaldos. Asegúrate de que las columnas coincidan con los campos (Tipo, Estado, Fecha Inicio, Fecha Fin, Tamaño, Ubicación, Archivo, Incluye Base64, Mensaje Error, Verificado, Fecha Verificación, Total Tablas, Total Registros, Fecha Creación).</p>
            <FileUpload
              label="Archivo de Respaldos"
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
