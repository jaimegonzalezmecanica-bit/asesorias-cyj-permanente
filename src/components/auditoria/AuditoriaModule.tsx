
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore, type CondominioInfo } from '@/lib/store'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ClipboardCheck, Plus, Search, MoreHorizontal, Edit, Trash2, Eye,
  AlertTriangle, CheckCircle, Clock, XCircle, FileText,
  Building2, CheckSquare, FileSpreadsheet, Printer,
  Target, ArrowRight, Upload, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface AuditoriaItem {
  id: string
  codigo: string
  titulo: string
  tipo: string
  categoria: string
  estado: string
  fechaInicio: string | null
  fechaFin: string | null
  responsable: string | null
  alcance: string | null
  objetivo: string | null
  conclusiones: string | null
  puntuacionTotal: number
  itemsCriticos: number
  itemsMayores: number
  itemsMenores: number
  condominioId: string | null
  createdAt: string
  items?: AuditoriaCheckItem[]
  hallazgos?: AuditoriaHallazgoItem[]
  acciones?: AuditoriaAccionItem[]
}

interface AuditoriaCheckItem {
  id: string
  seccion: string
  pregunta: string
  descripcion: string | null
  obligatorio: boolean
  orden: number
  cumple: boolean | null
  evidencia: string | null
  observaciones: string | null
  calificacion: string | null
  criticidad: string | null
}

interface AuditoriaHallazgoItem {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  tipo: string
  criticidad: string
  area: string | null
  estado: string
  fechaDeteccion: string
  fechaLimite: string | null
}

interface AuditoriaAccionItem {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  tipo: string
  responsable: string | null
  fechaCompromiso: string | null
  estado: string
  hallazgoId: string | null
}

// Tipos de auditoría
const TIPOS_AUDITORIA = [
  { value: 'Interna', label: 'Interna', color: 'bg-blue-500' },
  { value: 'Externa', label: 'Externa', color: 'bg-purple-500' },
  { value: 'Legal', label: 'Legal', color: 'bg-red-500' },
  { value: 'Financiera', label: 'Financiera', color: 'bg-green-500' },
  { value: 'Operacional', label: 'Operacional', color: 'bg-amber-500' },
]

const CATEGORIAS_AUDITORIA = [
  'General', 'Financiera', 'Legal', 'Seguridad', 'Mantenimiento', 'Gestión'
]

const ESTADOS_AUDITORIA = [
  { value: 'Planificada', label: 'Planificada', color: 'bg-gray-500', icon: Clock },
  { value: 'En Ejecución', label: 'En Ejecución', color: 'bg-blue-500', icon: ClipboardCheck },
  { value: 'Completada', label: 'Completada', color: 'bg-green-500', icon: CheckCircle },
  { value: 'Cancelada', label: 'Cancelada', color: 'bg-red-500', icon: XCircle },
]

export function AuditoriaModule() {
  const { currentCondominio, setCurrentCondominio } = useAppStore()
  const [auditorias, setAuditorias] = useState<AuditoriaItem[]>([])
  const [condominios, setCondominios] = useState<CondominioInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [hallazgoDialogOpen, setHallazgoDialogOpen] = useState(false)
  const [accionDialogOpen, setAccionDialogOpen] = useState(false)
  
  // Selected items
  const [selectedAuditoria, setSelectedAuditoria] = useState<AuditoriaItem | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Interna',
    categoria: 'General',
    fechaInicio: '',
    fechaFin: '',
    responsable: '',
    alcance: '',
    objetivo: '',
  })

  const [hallazgoForm, setHallazgoForm] = useState({
    codigo: '',
    titulo: '',
    descripcion: '',
    tipo: 'Observación',
    criticidad: 'Menor',
    area: '',
    fechaLimite: '',
  })

  const [accionForm, setAccionForm] = useState({
    codigo: '',
    titulo: '',
    descripcion: '',
    tipo: 'Correctiva',
    responsable: '',
    fechaCompromiso: '',
    hallazgoId: '',
  })

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Cargar condominios
  const fetchCondominios = useCallback(async () => {
    try {
      const response = await fetch('/api/condominios')
      if (response.ok) {
        const data = await response.json()
        setCondominios(data)
        // Si no hay condominio seleccionado y hay condominios disponibles, seleccionar el primero
        if (!currentCondominio && data.length > 0) {
          setCurrentCondominio({
            id: data[0].id,
            nombre: data[0].nombre,
            direccion: data[0].direccion,
            comuna: data[0].comuna
          })
        }
      }
    } catch (error) {
      console.error('Error fetching condominios:', error)
    } finally {
      setLoadingCondominios(false)
    }
  }, [currentCondominio, setCurrentCondominio])

  const fetchAuditorias = useCallback(async () => {
    setLoading(true)
    try {
      // Si hay condominio seleccionado, filtrar por él
      const url = currentCondominio 
        ? `/api/auditoria?condominioId=${currentCondominio.id}`
        : '/api/auditoria'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAuditorias(data)
      }
    } catch (error) {
      console.error('Error fetching auditorias:', error)
      toast.error('Error al cargar las auditorías')
    } finally {
      setLoading(false)
    }
  }, [currentCondominio])

  useEffect(() => {
    fetchCondominios()
  }, [fetchCondominios])

  useEffect(() => {
    if (!loadingCondominios) {
      fetchAuditorias()
    }
  }, [fetchAuditorias, loadingCondominios])

  // Estadísticas
  const getStats = () => {
    const total = auditorias.length
    const planificadas = auditorias.filter(a => a.estado === 'Planificada').length
    const enEjecucion = auditorias.filter(a => a.estado === 'En Ejecución').length
    const completadas = auditorias.filter(a => a.estado === 'Completada').length
    const promedioPuntuacion = auditorias.length > 0 
      ? Math.round(auditorias.reduce((acc, a) => acc + a.puntuacionTotal, 0) / auditorias.length)
      : 0
    
    return { total, planificadas, enEjecucion, completadas, promedioPuntuacion }
  }

  const stats = getStats()

  // Filtrar auditorías
  const filteredAuditorias = auditorias.filter(a => {
    const matchSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filterEstado === 'all' || a.estado === filterEstado
    const matchTipo = filterTipo === 'all' || a.tipo === filterTipo
    return matchSearch && matchEstado && matchTipo
  })

  // Generar código de auditoría
  const generateCodigo = () => {
    const year = new Date().getFullYear()
    const count = auditorias.filter(a => a.codigo.includes(`AUD-${year}`)).length + 1
    return `AUD-${year}-${count.toString().padStart(3, '0')}`
  }

  // Crear auditoría
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          codigo: generateCodigo(),
          condominioId: currentCondominio?.id || null,
        }),
      })
      
      if (response.ok) {
        toast.success('Auditoría creada correctamente')
        fetchAuditorias()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating auditoria:', error)
      toast.error('Error al crear la auditoría')
    }
  }

  // Actualizar estado de auditoría
  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/auditoria/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      
      if (response.ok) {
        toast.success('Estado actualizado')
        fetchAuditorias()
      }
    } catch (error) {
      console.error('Error updating estado:', error)
      toast.error('Error al actualizar estado')
    }
  }

  // Eliminar auditoría
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta auditoría?')) return
    
    try {
      const response = await fetch(`/api/auditoria/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Auditoría eliminada')
        fetchAuditorias()
      }
    } catch (error) {
      console.error('Error deleting auditoria:', error)
      toast.error('Error al eliminar')
    }
  }

  // Ver detalle de auditoría
  const handleViewDetail = async (auditoria: AuditoriaItem) => {
    try {
      const response = await fetch(`/api/auditoria/${auditoria.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedAuditoria(data)
        setDetailDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching auditoria detail:', error)
      toast.error('Error al cargar el detalle de la auditoría')
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'Interna',
      categoria: 'General',
      fechaInicio: '',
      fechaFin: '',
      responsable: '',
      alcance: '',
      objetivo: '',
    })
  }

  // Manejar subida de archivo para importación masiva
  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  // Manejar importación masiva
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
          codigo: item.Codigo || generateCodigo(),
          titulo: item.Titulo || '',
          tipo: item.Tipo || 'Interna',
          categoria: item.Categoria || 'General',
          estado: item.Estado || 'Planificada',
          fechaInicio: item['Fecha Inicio'] ? new Date(item['Fecha Inicio']).toISOString() : null,
          fechaFin: item['Fecha Fin'] ? new Date(item['Fecha Fin']).toISOString() : null,
          responsable: item.Responsable || null,
          alcance: item.Alcance || null,
          objetivo: item.Objetivo || null,
          condominioId: currentCondominio?.id || null,
          puntuacionTotal: Number(item['Puntuacion Total']) || 0,
          itemsCriticos: Number(item['Items Críticos']) || 0,
          itemsMayores: Number(item['Items Mayores']) || 0,
          itemsMenores: Number(item['Items Menores']) || 0,
        }))

        const res = await fetch('/api/auditoria/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Auditorías importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchAuditorias()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar auditorías. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading || loadingCondominios) {
    return <div className="p-8 text-center text-slate-400">Cargando auditorías...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><ClipboardCheck className="w-5 h-5 text-purple-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Gestión de Auditorías</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button variant="outline" onClick={() => {
            // Implement export functionality here
            toast.info('Funcionalidad de exportación en desarrollo.')
          }}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Exportar
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Auditoría
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Auditorías</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planificadas</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planificadas}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completadas}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Puntuación</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promedioPuntuacion}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar auditoría por título o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS_AUDITORIA.map(estado => <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TIPOS_AUDITORIA.map(tipo => <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>)}
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
                  <TableHead className="w-[120px]">Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[120px]">Categoría</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[120px]">Fecha Inicio</TableHead>
                  <TableHead className="w-[120px]">Responsable</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditorias.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">No hay auditorías que coincidan con la búsqueda.</TableCell></TableRow>
                ) : (
                  filteredAuditorias.map((auditoria) => {
                    const estadoConfig = ESTADOS_AUDITORIA.find(e => e.value === auditoria.estado)
                    return (
                      <TableRow key={auditoria.id}>
                        <TableCell className="font-medium">{auditoria.codigo}</TableCell>
                        <TableCell>{auditoria.titulo}</TableCell>
                        <TableCell>{auditoria.tipo}</TableCell>
                        <TableCell>{auditoria.categoria}</TableCell>
                        <TableCell>
                          <Badge className={`${estadoConfig?.color || 'bg-gray-500'} text-white`}>
                            {estadoConfig?.label || auditoria.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{auditoria.fechaInicio ? new Date(auditoria.fechaInicio).toLocaleDateString('es-CL') : 'N/A'}</TableCell>
                        <TableCell>{auditoria.responsable || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(auditoria)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(auditoria.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Dialogo Nueva/Editar Auditoría */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nueva Auditoría</DialogTitle>
            <DialogDescription>Crea una nueva auditoría para tu condominio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titulo" className="text-right">Título</Label>
              <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AUDITORIA.map(tipo => <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoria" className="text-right">Categoría</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_AUDITORIA.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaInicio" className="text-right">Fecha Inicio</Label>
              <Input id="fechaInicio" type="date" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaFin" className="text-right">Fecha Fin</Label>
              <Input id="fechaFin" type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsable" className="text-right">Responsable</Label>
              <Input id="responsable" value={formData.responsable} onChange={(e) => setFormData({ ...formData, responsable: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alcance" className="text-right">Alcance</Label>
              <Textarea id="alcance" value={formData.alcance} onChange={(e) => setFormData({ ...formData, alcance: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="objetivo" className="text-right">Objetivo</Label>
              <Textarea id="objetivo" value={formData.objetivo} onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })} className="col-span-3" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Auditoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Detalle Auditoría */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Detalle de Auditoría: {selectedAuditoria?.titulo}</DialogTitle>
            <DialogDescription>Información completa de la auditoría seleccionada.</DialogDescription>
          </DialogHeader>
          {selectedAuditoria && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Código:</Label>
                  <span className="col-span-3">{selectedAuditoria.codigo}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Tipo:</Label>
                  <span className="col-span-3">{selectedAuditoria.tipo}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Categoría:</Label>
                  <span className="col-span-3">{selectedAuditoria.categoria}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Estado:</Label>
                  <span className="col-span-3">
                    <Badge className={`${ESTADOS_AUDITORIA.find(e => e.value === selectedAuditoria.estado)?.color || 'bg-gray-500'} text-white`}>
                      {ESTADOS_AUDITORIA.find(e => e.value === selectedAuditoria.estado)?.label || selectedAuditoria.estado}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Fechas:</Label>
                  <span className="col-span-3">
                    {selectedAuditoria.fechaInicio ? new Date(selectedAuditoria.fechaInicio).toLocaleDateString('es-CL') : 'N/A'}
                    {selectedAuditoria.fechaFin && ` - ${new Date(selectedAuditoria.fechaFin).toLocaleDateString('es-CL')}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Responsable:</Label>
                  <span className="col-span-3">{selectedAuditoria.responsable || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold">Alcance:</Label>
                  <span className="col-span-3 text-justify">{selectedAuditoria.alcance || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold">Objetivo:</Label>
                  <span className="col-span-3 text-justify">{selectedAuditoria.objetivo || 'N/A'}</span>
                </div>
                {selectedAuditoria.conclusiones && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-semibold">Conclusiones:</Label>
                    <span className="col-span-3 text-justify">{selectedAuditoria.conclusiones}</span>
                  </div>
                )}

                <h3 className="text-lg font-bold mt-4 col-span-4">Resultados y Puntuación</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Puntuación Total:</Label>
                  <span className="col-span-3 font-bold text-xl">{selectedAuditoria.puntuacionTotal}%</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Ítems Críticos:</Label>
                  <span className="col-span-3 text-red-600 font-semibold">{selectedAuditoria.itemsCriticos}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Ítems Mayores:</Label>
                  <span className="col-span-3 text-orange-600 font-semibold">{selectedAuditoria.itemsMayores}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Ítems Menores:</Label>
                  <span className="col-span-3 text-yellow-600 font-semibold">{selectedAuditoria.itemsMenores}</span>
                </div>

                {selectedAuditoria.items && selectedAuditoria.items.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold mt-4 col-span-4">Ítems de Verificación</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sección</TableHead>
                          <TableHead>Pregunta</TableHead>
                          <TableHead>Cumple</TableHead>
                          <TableHead>Criticidad</TableHead>
                          <TableHead>Evidencia</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAuditoria.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.seccion}</TableCell>
                            <TableCell>{item.pregunta}</TableCell>
                            <TableCell>
                              {item.cumple === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                              {item.cumple === false && <XCircle className="h-5 w-5 text-red-500" />}
                              {item.cumple === null && '-'}
                            </TableCell>
                            <TableCell>{item.criticidad || '-'}</TableCell>
                            <TableCell>{item.evidencia || '-'}</TableCell>
                            <TableCell>{item.observaciones || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {selectedAuditoria.hallazgos && selectedAuditoria.hallazgos.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold mt-4 col-span-4">Hallazgos</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Criticidad</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha Límite</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAuditoria.hallazgos.map(hallazgo => (
                          <TableRow key={hallazgo.id}>
                            <TableCell>{hallazgo.codigo}</TableCell>
                            <TableCell>{hallazgo.titulo}</TableCell>
                            <TableCell>{hallazgo.tipo}</TableCell>
                            <TableCell>{hallazgo.criticidad}</TableCell>
                            <TableCell>{hallazgo.estado}</TableCell>
                            <TableCell>{hallazgo.fechaLimite ? new Date(hallazgo.fechaLimite).toLocaleDateString('es-CL') : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {selectedAuditoria.acciones && selectedAuditoria.acciones.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold mt-4 col-span-4">Acciones Correctivas/Preventivas</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Fecha Compromiso</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAuditoria.acciones.map(accion => (
                          <TableRow key={accion.id}>
                            <TableCell>{accion.codigo}</TableCell>
                            <TableCell>{accion.titulo}</TableCell>
                            <TableCell>{accion.tipo}</TableCell>
                            <TableCell>{accion.responsable || '-'}</TableCell>
                            <TableCell>{accion.fechaCompromiso ? new Date(accion.fechaCompromiso).toLocaleDateString('es-CL') : '-'}</TableCell>
                            <TableCell>{accion.estado}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Auditorías Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las auditorías. Asegúrate de que las columnas coincidan con los campos (Código, Título, Tipo, Categoría, Estado, Fecha Inicio, Fecha Fin, Responsable, Alcance, Objetivo, Puntuacion Total, Items Críticos, Items Mayores, Items Menores).</p>
            <FileUpload
              label="Archivo de Auditorías"
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
