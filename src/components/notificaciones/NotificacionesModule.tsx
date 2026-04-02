
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
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Bell,
  BellRing,
  Info,
  AlertTriangle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  categoria: string
  destino: string
  destinoId?: string
  leido: boolean
  fechaEnvio?: string
  fechaLeido?: string
  createdAt: string
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const tipoColors: Record<string, string> = {
  'Info': 'bg-blue-100 text-blue-700',
  'Alerta': 'bg-amber-100 text-amber-700',
  'Urgente': 'bg-red-100 text-red-700',
  'Recordatorio': 'bg-purple-100 text-purple-700',
}

const tipoIcons: Record<string, React.ReactNode> = {
  'Info': <Info className="w-4 h-4" />,
  'Alerta': <AlertTriangle className="w-4 h-4" />,
  'Urgente': <AlertCircle className="w-4 h-4" />,
  'Recordatorio': <Clock className="w-4 h-4" />,
}

const TIPOS_NOTIFICACION = ['Info', 'Alerta', 'Urgente', 'Recordatorio']
const CATEGORIAS_NOTIFICACION = ['General', 'Finanzas', 'Mantenimiento', 'Seguridad', 'Eventos']
const DESTINOS_NOTIFICACION = ['Todos', 'Residentes', 'Personal', 'Unidad']

export function NotificacionesModule() {
  const { currentCondominio } = useAppStore()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotificacion, setSelectedNotificacion] = useState<Notificacion | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    noLeidas: 0,
    urgentes: 0,
    enviadas: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'Info',
    categoria: 'General',
    destino: 'Todos',
    destinoId: '',
  })

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'titulo', label: 'Título', defaultVisible: true },
    { key: 'mensaje', label: 'Mensaje', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'categoria', label: 'Categoría', defaultVisible: true },
    { key: 'destino', label: 'Destino', defaultVisible: true },
    { key: 'destinoId', label: 'ID Destino', defaultVisible: false },
    { key: 'leido', label: 'Leído', defaultVisible: true },
    { key: 'fechaEnvio', label: 'Fecha Envío', defaultVisible: true },
    { key: 'fechaLeido', label: 'Fecha Leído', defaultVisible: false },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_NOTIFICACION },
    { key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS_NOTIFICACION },
    { key: 'destino', label: 'Destino', type: 'select', options: DESTINOS_NOTIFICACION },
    { key: 'leido', label: 'Leído', type: 'boolean' },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'notificaciones',
    moduleLabel: 'Notificaciones',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => notificaciones
  })

  const fetchData = async () => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/notificaciones?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      setNotificaciones(data.notificaciones || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching notificaciones:', error)
      toast.error('Error al cargar las notificaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentCondominio])

  const handleSubmit = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para enviar la notificación.')
      return
    }
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      toast.error('El título y el mensaje son obligatorios.')
      return
    }

    try {
      const payload = {
        ...formData,
        condominioId: currentCondominio.id,
      }
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      setDialogOpen(false)
      resetForm()
      fetchData()
      toast.success('Notificación enviada con éxito.')
    } catch (error) {
      console.error('Error saving notificacion:', error)
      toast.error('Error al enviar la notificación.')
    }
  }

  const handleDelete = async () => {
    if (!selectedNotificacion) return
    try {
      await fetch(`/api/notificaciones/${selectedNotificacion.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedNotificacion(null)
      fetchData()
      toast.success('Notificación eliminada con éxito.')
    } catch (error) {
      console.error('Error deleting notificacion:', error)
      toast.error('Error al eliminar la notificación.')
    }
  }

  const marcarLeida = async (id: string, leido: boolean) => {
    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido })
      })
      fetchData()
      toast.success(`Notificación marcada como ${leido ? 'leída' : 'no leída'}.`)
    } catch (error) {
      console.error('Error updating notificacion:', error)
      toast.error('Error al actualizar la notificación.')
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'Info',
      categoria: 'General',
      destino: 'Todos',
      destinoId: '',
    })
    setSelectedNotificacion(null)
  }

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  const handleMassImport = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar notificaciones.')
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
          mensaje: item.Mensaje || '',
          tipo: item.Tipo || 'Info',
          categoria: item.Categoria || 'General',
          destino: item.Destino || 'Todos',
          destinoId: item['ID Destino'] || null,
          leido: item.Leido === 'TRUE',
          fechaEnvio: item['Fecha Envío'] ? new Date(item['Fecha Envío']).toISOString().split('T')[0] : null,
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/notificaciones/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Notificaciones importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar notificaciones. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando notificaciones...</div>
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar las notificaciones.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">No Leídas</p>
                <p className="text-2xl font-bold text-amber-600">{stats.noLeidas}</p>
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
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Enviadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.enviadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Centro de Notificaciones</h2>
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
            Nueva Notificación
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Estado</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Tipo</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Título</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Categoría</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Destino</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Fecha Envío</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No hay notificaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                notificaciones.map((notif) => (
                  <TableRow 
                    key={notif.id} 
                    className={`hover:bg-slate-50 ${!notif.leido ? 'bg-blue-50/50' : ''}`}
                  >
                    <TableCell>
                      {notif.leido ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={tipoColors[notif.tipo] || 'bg-slate-100'}>
                        <span className="flex items-center gap-1">
                          {tipoIcons[notif.tipo]}
                          {notif.tipo}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{notif.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{notif.categoria}</Badge>
                    </TableCell>
                    <TableCell>{notif.destino}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {notif.fechaEnvio || 'Pendiente'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedNotificacion(notif); setDetalleDialogOpen(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => marcarLeida(notif.id, !notif.leido)}
                        >
                          {notif.leido ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedNotificacion(notif); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Dialogo Nueva Notificación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nueva Notificación</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_NOTIFICACION.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_NOTIFICACION.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destino">Destino</Label>
                <Select value={formData.destino} onValueChange={(v) => setFormData({ ...formData, destino: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DESTINOS_NOTIFICACION.map(dest => <SelectItem key={dest} value={dest}>{dest}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formData.destino !== 'Todos' && (
                <div className="space-y-2">
                  <Label htmlFor="destinoId">ID de Destino (Opcional)</Label>
                  <Input id="destinoId" value={formData.destinoId} onChange={(e) => setFormData({ ...formData, destinoId: e.target.value })} placeholder="ID de Residente/Personal/Unidad" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Enviar Notificación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Detalle Notificación */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de Notificación</DialogTitle>
          </DialogHeader>
          {selectedNotificacion && (
            <div className="grid gap-4 py-4 text-sm">
              <p><strong>Título:</strong> {selectedNotificacion.titulo}</p>
              <p><strong>Mensaje:</strong> {selectedNotificacion.mensaje}</p>
              <p><strong>Tipo:</strong> <Badge className={tipoColors[selectedNotificacion.tipo]}>{selectedNotificacion.tipo}</Badge></p>
              <p><strong>Categoría:</strong> {selectedNotificacion.categoria}</p>
              <p><strong>Destino:</strong> {selectedNotificacion.destino} {selectedNotificacion.destinoId ? `(ID: ${selectedNotificacion.destinoId})` : ''}</p>
              <p><strong>Estado:</strong> {selectedNotificacion.leido ? 'Leída' : 'No Leída'}</p>
              <p><strong>Fecha Envío:</strong> {selectedNotificacion.fechaEnvio || 'N/A'}</p>
              <p><strong>Fecha Leído:</strong> {selectedNotificacion.fechaLeido || 'N/A'}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalleDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la notificación seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Notificaciones Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las notificaciones. Asegúrate de que las columnas coincidan con los campos (Título, Mensaje, Tipo, Categoría, Destino, ID Destino, Leído, Fecha Envío).</p>
            <FileUpload
              label="Archivo de Notificaciones"
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
