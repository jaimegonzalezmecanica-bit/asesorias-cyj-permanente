
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Search, Eye, Upload, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface Inspeccion {
  id: string
  titulo: string
  tipo: string
  estado: string
  fecha: string | null
  hora: string | null
  ubicacion: string | null
  asignado: string | null
  descripcion: string | null
  recurrente: boolean
  notas: string | null
  fotosAntes: string | null
  fotosDurante: string | null
  fotosDespues: string | null
}

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

const tipoColors: Record<string, string> = {
  'Mantenimiento': 'bg-orange-100 text-orange-700',
  'Seguridad': 'bg-purple-100 text-purple-700',
  'Eléctrica': 'bg-yellow-100 text-yellow-700',
  'Sanitaria': 'bg-blue-100 text-blue-700',
  'Estructural': 'bg-slate-100 text-slate-700',
  'General': 'bg-cyan-100 text-cyan-700',
}

const estadoColors: Record<string, string> = {
  'Planificado': 'bg-blue-100 text-blue-700',
  'En Progreso': 'bg-yellow-100 text-yellow-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

const TIPOS_INSPECCION = ['Mantenimiento', 'Seguridad', 'Eléctrica', 'Sanitaria', 'Estructural', 'General']
const ESTADOS_INSPECCION = ['Planificado', 'En Progreso', 'Completado', 'Cancelado']

export function InspeccionesModule() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [personal, setPersonal] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingInsp, setEditingInsp] = useState<Inspeccion | null>(null)
  const [viewingInsp, setViewingInsp] = useState<Inspeccion | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Mantenimiento',
    estado: 'Planificado',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    ubicacion: '',
    asignado: 'none',
    descripcion: '',
    recurrente: false,
    notas: '',
  })

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'titulo', label: 'Título', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'fecha', label: 'Fecha', defaultVisible: true },
    { key: 'hora', label: 'Hora', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'asignado', label: 'Asignado', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: false },
    { key: 'recurrente', label: 'Recurrente', defaultVisible: false },
    { key: 'notas', label: 'Notas', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_INSPECCION },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_INSPECCION },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'inspecciones',
    moduleLabel: 'Inspecciones',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => inspecciones
  })

  const fetchInspecciones = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/inspecciones?search=${encodeURIComponent(searchTerm)}` : '/api/inspecciones'
      const res = await fetch(url)
      const data = await res.json()
      setInspecciones(data)
    } catch (error) {
      console.error('Error fetching inspecciones:', error)
      toast.error('Error al cargar las inspecciones.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchInspecciones()
    })()
    fetch('/api/personal').then(res => res.json()).then(setPersonal)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchInspecciones(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (insp?: Inspeccion) => {
    if (insp) {
      setEditingInsp(insp)
      setFormData({
        titulo: insp.titulo,
        tipo: insp.tipo,
        estado: insp.estado,
        fecha: insp.fecha || new Date().toISOString().split('T')[0],
        hora: insp.hora || '',
        ubicacion: insp.ubicacion || '',
        asignado: insp.asignado || 'none',
        descripcion: insp.descripcion || '',
        recurrente: insp.recurrente,
        notas: insp.notas || '',
      })
    } else {
      setEditingInsp(null)
      setFormData({
        titulo: '',
        tipo: 'Mantenimiento',
        estado: 'Planificado',
        fecha: new Date().toISOString().split('T')[0],
        hora: '',
        ubicacion: '',
        asignado: 'none',
        descripcion: '',
        recurrente: false,
        notas: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast.error('El título de la inspección es obligatorio.')
      return
    }

    const dataToSend = {
      ...formData,
      asignado: formData.asignado === 'none' ? null : formData.asignado,
    }

    try {
      if (editingInsp) {
        await fetch(`/api/inspecciones/${editingInsp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        toast.success('Inspección actualizada con éxito.')
      } else {
        await fetch('/api/inspecciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        toast.success('Inspección creada con éxito.')
      }
      setDialogOpen(false)
      fetchInspecciones(search)
    } catch (error) {
      console.error('Error saving inspeccion:', error)
      toast.error('Error al guardar la inspección.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta inspección?')) return
    try {
      await fetch(`/api/inspecciones/${id}`, { method: 'DELETE' })
      fetchInspecciones(search)
      toast.success('Inspección eliminada con éxito.')
    } catch (error) {
      console.error('Error deleting inspeccion:', error)
      toast.error('Error al eliminar la inspección.')
    }
  }

  const countPhotos = (insp: Inspeccion) => {
    const antes = insp.fotosAntes ? JSON.parse(insp.fotosAntes).length : 0
    const durante = insp.fotosDurante ? JSON.parse(insp.fotosDurante).length : 0
    const despues = insp.fotosDespues ? JSON.parse(insp.fotosDespues).length : 0
    return antes + durante + despues
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
          titulo: item.Titulo || '',
          tipo: item.Tipo || 'General',
          estado: item.Estado || 'Planificado',
          fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : null,
          hora: item.Hora || null,
          ubicacion: item.Ubicacion || null,
          asignado: item.Asignado || null,
          descripcion: item.Descripcion || null,
          recurrente: item.Recurrente === 'TRUE',
          notas: item.Notas || null,
        }))

        const res = await fetch('/api/inspecciones/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Inspecciones importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchInspecciones(search)
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar inspecciones. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ExportButton />
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-1" /> Importar
        </Button>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Inspección
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Inspecciones ({inspecciones.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Título</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Ubicación</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Asignado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Hora</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fotos</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : inspecciones.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin inspecciones</td></tr>
                ) : (
                  inspecciones.map((insp) => (
                    <tr key={insp.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">{insp.titulo}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[insp.tipo] || 'bg-slate-100'}>{insp.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[insp.estado] || 'bg-slate-100'}>{insp.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs">{insp.ubicacion || '–'}</td>
                      <td className="p-3 text-xs">{personal.find(p => p.id === insp.asignado)?.nombre || '–'}</td>
                      <td className="p-3 text-xs">{formatDate(insp.fecha)}</td>
                      <td className="p-3 text-xs">{insp.hora || '–'}</td>
                      <td className="p-3 text-xs">{countPhotos(insp)} 📷</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setViewingInsp(insp); setViewDialogOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(insp)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(insp.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingInsp ? 'Editar' : 'Nueva'} Inspección</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_INSPECCION.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_INSPECCION.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formData.fecha || ''} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={formData.hora || ''} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={formData.ubicacion || ''} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Asignado a</Label>
              <Select value={formData.asignado || 'none'} onValueChange={(v) => setFormData({...formData, asignado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {personal.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={formData.descripcion || ''} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurrente"
                checked={formData.recurrente}
                onChange={(e) => setFormData({...formData, recurrente: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="recurrente">Recurrente</Label>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas || ''} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Inspección</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo para Ver Inspección (con fotos) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Inspección: {viewingInsp?.titulo}</DialogTitle>
          </DialogHeader>
          {viewingInsp && (
            <div className="grid gap-4 py-4 text-sm">
              <p><strong>Tipo:</strong> {viewingInsp.tipo}</p>
              <p><strong>Estado:</strong> <Badge className={estadoColors[viewingInsp.estado]}>{viewingInsp.estado}</Badge></p>
              <p><strong>Fecha:</strong> {formatDate(viewingInsp.fecha)}</p>
              <p><strong>Hora:</strong> {viewingInsp.hora}</p>
              <p><strong>Ubicación:</strong> {viewingInsp.ubicacion}</p>
              <p><strong>Asignado a:</strong> {personal.find(p => p.id === viewingInsp.asignado)?.nombre || 'N/A'}</p>
              <p><strong>Descripción:</strong> {viewingInsp.descripcion}</p>
              <p><strong>Recurrente:</strong> {viewingInsp.recurrente ? 'Sí' : 'No'}</p>
              <p><strong>Notas:</strong> {viewingInsp.notas}</p>

              {/* Sección de Fotos (simplificada, solo muestra conteo) */}
              <div className="mt-4">
                <h3 className="text-md font-semibold">Fotos</h3>
                <p>Fotos antes: {viewingInsp.fotosAntes ? JSON.parse(viewingInsp.fotosAntes).length : 0}</p>
                <p>Fotos durante: {viewingInsp.fotosDurante ? JSON.parse(viewingInsp.fotosDurante).length : 0}</p>
                <p>Fotos después: {viewingInsp.fotosDespues ? JSON.parse(viewingInsp.fotosDespues).length : 0}</p>
                <p className="text-xs text-slate-500">La visualización de las fotos no está implementada en esta versión.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Inspecciones Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las inspecciones. Asegúrate de que las columnas coincidan con los campos (Título, Tipo, Estado, Fecha, Hora, Ubicación, Asignado, Descripción, Recurrente, Notas).</p>
            <FileUpload
              label="Archivo de Inspecciones"
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
