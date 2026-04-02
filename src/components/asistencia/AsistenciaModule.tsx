
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  LogIn,
  LogOut,
  UserCheck,
  UserX,
  ClockAlert,
  FileText,
  Search,
  Download,
  Plus,
  Upload,
  X,
  Loader2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface AsistenciaState {
  id: string
  personalId: string
  nombre: string
  cargo?: string | null
  fecha: string
  horaEntrada: string | null
  horaSalida: string | null
  estado: string
  observaciones?: string | null
  isNew?: boolean
}

const ESTADOS = [
  { value: 'Presente', label: 'Presente', icon: UserCheck, color: 'bg-green-600 hover:bg-green-700' },
  { value: 'Ausente', label: 'Ausente', icon: UserX, color: 'bg-red-600 hover:bg-red-700' },
  { value: 'Tarde', label: 'Tarde', icon: ClockAlert, color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'Permiso', label: 'Permiso', icon: FileText, color: 'bg-blue-600 hover:bg-blue-700' },
]

export function AsistenciaModule() {
  const [registros, setRegistros] = useState<AsistenciaState[]>([])
  const [personal, setPersonal] = useState<{id: string; nombre: string; cargo?: string | null}[]>([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [nuevoDialogOpen, setNuevoDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [nuevoPersonalId, setNuevoPersonalId] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('Presente')
  const [nuevoObservaciones, setNuevoObservaciones] = useState('')
  const { currentCondominio } = useAppStore()

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'cargo', label: 'Cargo', defaultVisible: true },
    { key: 'fecha', label: 'Fecha', defaultVisible: true },
    { key: 'horaEntrada', label: 'Hora Entrada', defaultVisible: true },
    { key: 'horaSalida', label: 'Hora Salida', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'observaciones', label: 'Observaciones', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS.map(e => e.value) },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'asistencia',
    moduleLabel: 'Asistencia',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => registros
  })

  const fetchAsistencia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ fecha })
      if (currentCondominio?.id) {
        params.append('condominioId', currentCondominio.id)
      }
      const res = await fetch(`/api/asistencia?${params.toString()}`)
      const data = await res.json()
      setRegistros(data)
    } catch (error) {
      console.error('Error fetching asistencia:', error)
    } finally {
      setLoading(false)
    }
  }, [fecha, currentCondominio])

  const fetchPersonal = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (currentCondominio?.id) {
        params.append('condominioId', currentCondominio.id)
      }
      const res = await fetch(`/api/personal?${params.toString()}`)
      const data = await res.json()
      setPersonal(data)
    } catch (error) {
      console.error('Error fetching personal:', error)
    }
  }, [currentCondominio])

  useEffect(() => {
    void fetchAsistencia()
    void fetchPersonal()
  }, [fecha, currentCondominio?.id, fetchAsistencia, fetchPersonal])

  const registrarEntrada = async (personalId: string) => {
    try {
      const ahora = new Date()
      const horaActual = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalId,
          fecha,
          horaEntrada: horaActual,
          estado: 'Presente'
        })
      })
      if (res.ok) {
        toast.success('Entrada registrada', {
          description: `Hora: ${horaActual}`
        })
        void fetchAsistencia()
      }
    } catch (error) {
      console.error('Error registrando entrada:', error)
      toast.error('Error al registrar entrada')
    }
  }

  const registrarSalida = async (personalId: string) => {
    try {
      const ahora = new Date()
      const horaActual = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalId,
          fecha,
          horaSalida: horaActual,
          estado: 'Completado'
        })
      })
      if (res.ok) {
        toast.success('Salida registrada', {
          description: `Hora: ${horaActual}`
        })
        void fetchAsistencia()
      }
    } catch (error) {
      console.error('Error registrando salida:', error)
      toast.error('Error al registrar salida')
    }
  }

  const cambiarEstado = async (personalId: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalId,
          fecha,
          estado: nuevoEstado
        })
      })
      if (res.ok) {
        toast.success(`Estado cambiado a "${nuevoEstado}"`)
        void fetchAsistencia()
      }
    } catch (error) {
      console.error('Error changing estado:', error)
      toast.error('Error al cambiar estado')
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Presente':
      case 'Completado':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Ausente':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Tarde':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Permiso':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Presente':
      case 'Completado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Ausente':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'Tarde':
        return <ClockAlert className="w-4 h-4 text-amber-600" />
      case 'Permiso':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  // Filtrar registros por búsqueda
  const filteredRegistros = registros.filter(r => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.nombre.toLowerCase().includes(searchLower) ||
      (r.cargo && r.cargo.toLowerCase().includes(searchLower)) ||
      r.estado.toLowerCase().includes(searchLower)
    )
  })

  // Calcular estadísticas
  const stats = {
    presentes: registros.filter(r => r.estado === 'Presente' || r.estado === 'Completado').length,
    tarde: registros.filter(r => r.estado === 'Tarde').length,
    ausentes: registros.filter(r => r.estado === 'Ausente').length,
    permisos: registros.filter(r => r.estado === 'Permiso').length,
    pendientes: registros.filter(r => r.estado === 'Pendiente').length,
    total: registros.length
  }

  // Crear nuevo registro
  const handleNuevoRegistro = async () => {
    if (!nuevoPersonalId) {
      toast.error('Seleccione un personal')
      return
    }
    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalId: nuevoPersonalId,
          fecha,
          estado: nuevoEstado,
          observaciones: nuevoObservaciones || null
        })
      })
      if (res.ok) {
        toast.success('Registro creado')
        setNuevoDialogOpen(false)
        setNuevoPersonalId('')
        setNuevoEstado('Presente')
        setNuevoObservaciones('')
        void fetchAsistencia()
      }
    } catch (error) {
      console.error('Error creating registro:', error)
      toast.error('Error al crear registro')
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

        // Transformar los datos para que coincidan con el modelo de AsistenciaState
        const transformedData = json.map(item => {
          const personalEncontrado = personal.find(p => p.nombre.toLowerCase() === (item.Nombre || '').toLowerCase())
          return {
            personalId: personalEncontrado?.id || '', // Asignar ID de personal si existe
            nombre: item.Nombre || '',
            cargo: item.Cargo || null,
            fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : fecha, // Usar fecha del archivo o la actual
            horaEntrada: item['Hora Entrada'] || null,
            horaSalida: item['Hora Salida'] || null,
            estado: item.Estado || 'Presente',
            observaciones: item.Observaciones || null,
          }
        }).filter(item => item.personalId !== '') // Filtrar registros sin personalId válido

        if (transformedData.length === 0) {
          toast.error('No se encontraron registros válidos para importar. Asegúrate de que los nombres de personal existan.')
          setImportLoading(false)
          return
        }

        const res = await fetch('/api/asistencia/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Registros de asistencia importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        void fetchAsistencia()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar registros de asistencia. Verifica el formato del archivo y los nombres de personal.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Control de Asistencia</h2>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-auto"
          />
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={() => setNuevoDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presentes</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentes}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarde</CardTitle>
            <ClockAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tarde}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ausentes}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personal.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, cargo o estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegistros.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay registros de asistencia para esta fecha.</div>
        ) : (
          filteredRegistros.map((reg) => (
            <Card key={reg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{reg.nombre}</h3>
                  <Badge variant="outline" className={getEstadoColor(reg.estado)}>{reg.estado}</Badge>
                </div>
                <p className="text-sm text-slate-500 mb-2">{reg.cargo || 'Sin cargo'}</p>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <LogIn className="h-3 w-3" /> {reg.horaEntrada || '--:--'}
                  </div>
                  <div className="flex items-center gap-1">
                    <LogOut className="h-3 w-3" /> {reg.horaSalida || '--:--'}
                  </div>
                  <div className="ml-auto">
                    {getEstadoIcon(reg.estado)}
                  </div>
                </div>
                {reg.observaciones && (
                  <p className="text-xs text-slate-400 mt-2 italic">Obs: {reg.observaciones}</p>
                )}
                <div className="mt-3 flex gap-2">
                  {reg.estado !== 'Presente' && reg.estado !== 'Completado' && (
                    <Button size="sm" variant="outline" onClick={() => registrarEntrada(reg.personalId)}>
                      <LogIn className="h-3 w-3 mr-1" /> Entrada
                    </Button>
                  )}
                  {reg.estado === 'Presente' && !reg.horaSalida && (
                    <Button size="sm" variant="outline" onClick={() => registrarSalida(reg.personalId)}>
                      <LogOut className="h-3 w-3 mr-1" /> Salida
                    </Button>
                  )}
                  <Select value={reg.estado} onValueChange={(v) => cambiarEstado(reg.personalId, v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Cambiar Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogo Nuevo Registro */}
      <Dialog open={nuevoDialogOpen} onOpenChange={setNuevoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Registro de Asistencia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personal">Personal</Label>
              <Select value={nuevoPersonalId} onValueChange={setNuevoPersonalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona personal" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.cargo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" value={nuevoObservaciones} onChange={(e) => setNuevoObservaciones(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleNuevoRegistro}>Crear Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Asistencia Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de asistencia. Asegúrate de que las columnas incluyan 'Nombre', 'Cargo', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Estado', 'Observaciones'.</p>
            <FileUpload
              label="Archivo de Asistencia"
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
