
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Plus, Pencil, Trash2, Search, Upload, Phone, Mail, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react'
import { useSession } from '@/hooks/use-session'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

interface Residente {
  id: string
  nombre: string
  apellido?: string | null
  rut: string | null
  unidad: string | null
  etapa: string | null
  tipo: string
  telefono: string | null
  email: string | null
  fechaIngreso: string | null
  estado: string
  vehiculos?: string | null
  notas: string | null
}

const tipoColors: Record<string, string> = {
  'Residente': 'bg-blue-100 text-blue-700',
  'Propietario': 'bg-green-100 text-green-700',
  'Arrendatario': 'bg-purple-100 text-purple-700',
  'Visita': 'bg-slate-100 text-slate-700',
}

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Moroso': 'bg-red-100 text-red-700',
  'Vacaciones': 'bg-cyan-100 text-cyan-700',
  'Licencia': 'bg-purple-100 text-purple-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
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

// Extraer letra de unidad (ej: "A-101" -> "A", "B-201" -> "B")
const extractLetraUnidad = (unidad: string | null): string => {
  if (!unidad) return ''
  const match = unidad.match(/^([A-Za-z])/)
  return match ? match[1].toUpperCase() : ''
}

const TIPOS_RESIDENTE = ['Residente', 'Propietario', 'Arrendatario', 'Visita']
const ESTADOS_RESIDENTE = ['Activo', 'Moroso', 'Vacaciones', 'Licencia', 'Inactivo']

export function ResidentesModule() {
  const { currentCondominio } = useAppStore()
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLetra, setFilterLetra] = useState('todas')
  const [filterEtapa, setFilterEtapa] = useState('todas')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<Residente | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isMobile = useIsMobile()
  
  const { hasPermission } = useSession()
  const canEdit = hasPermission('residentes.editar')

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'apellido', label: 'Apellido', defaultVisible: true },
    { key: 'rut', label: 'RUT', defaultVisible: true },
    { key: 'unidad', label: 'Unidad', defaultVisible: true },
    { key: 'etapa', label: 'Etapa', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'telefono', label: 'Teléfono', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
    { key: 'fechaIngreso', label: 'Fecha Ingreso', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'vehiculos', label: 'Vehículos', defaultVisible: false },
    { key: 'notas', label: 'Notas', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_RESIDENTE },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_RESIDENTE },
    { key: 'etapa', label: 'Etapa', type: 'select', options: ['todas', 'sin-etapa', ...etapasUnicas] },
    { key: 'letraUnidad', label: 'Letra Unidad', type: 'select', options: ['todas', ...letrasUnicas] },
  ], [etapasUnicas, letrasUnicas])

  const { ExportButton } = useExport({
    moduleName: 'residentes',
    moduleLabel: 'Residentes',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => residentes
  })
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    unidad: '',
    etapa: '',
    tipo: 'Residente',
    telefono: '',
    email: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'Activo',
    vehiculos: '',
    notas: '',
  })

  const fetchResidentes = async (searchTerm = '') => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        condominioId: currentCondominio.id,
        search: searchTerm,
        letra: filterLetra === 'todas' ? '' : filterLetra,
        etapa: filterEtapa === 'todas' ? '' : filterEtapa,
        tipo: filterTipo === 'todos' ? '' : filterTipo,
        estado: filterEstado === 'todos' ? '' : filterEstado,
      })
      const url = `/api/residentes?${params.toString()}`
      const res = await fetch(url)
      const responseData = await res.json()
      
      if (responseData && Array.isArray(responseData.data)) {
        setResidentes(responseData.data)
      } else if (Array.isArray(responseData)) {
        setResidentes(responseData)
      } else {
        console.error('API returned unexpected format:', responseData)
        setResidentes([])
      }
    } catch (error) {
      console.error('Error fetching residentes:', error)
      toast.error('Error al cargar los residentes.')
      setResidentes([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResidentes()
  }, [currentCondominio, filterLetra, filterEtapa, filterTipo, filterEstado])

  useEffect(() => {
    const timeout = setTimeout(() => fetchResidentes(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  // Obtener etapas únicas
  const etapasUnicas = useMemo(() => {
    const etapas = new Set<string>()
    if (!Array.isArray(residentes)) return []
    residentes.forEach(r => {
      if (r?.etapa) etapas.add(r.etapa)
    })
    return Array.from(etapas).sort()
  }, [residentes])

  // Obtener letras únicas de unidades
  const letrasUnicas = useMemo(() => {
    const letras = new Set<string>()
    if (!Array.isArray(residentes)) return []
    residentes.forEach(r => {
      const letra = extractLetraUnidad(r?.unidad)
      if (letra) letras.add(letra)
    })
    return Array.from(letras).sort()
  }, [residentes])

  const openDialog = (res?: Residente) => {
    if (res) {
      setEditingRes(res)
      setFormData({
        nombre: res.nombre,
        apellido: res.apellido || '',
        rut: res.rut || '',
        unidad: res.unidad || '',
        etapa: res.etapa || '',
        tipo: res.tipo,
        telefono: res.telefono || '',
        email: res.email || '',
        fechaIngreso: res.fechaIngreso || new Date().toISOString().split('T')[0],
        estado: res.estado,
        vehiculos: res.vehiculos || '',
        notas: res.notas || '',
      })
    } else {
      setEditingRes(null)
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        unidad: '',
        etapa: '',
        tipo: 'Residente',
        telefono: '',
        email: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        estado: 'Activo',
        vehiculos: '',
        notas: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar el residente.')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }

    const payload = {
      ...formData,
      condominioId: currentCondominio.id,
    }

    try {
      if (editingRes) {
        await fetch(`/api/residentes/${editingRes.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Residente actualizado con éxito.')
      } else {
        await fetch('/api/residentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Residente creado con éxito.')
      }
      setDialogOpen(false)
      fetchResidentes(search)
    } catch (error) {
      console.error('Error saving residente:', error)
      toast.error('Error al guardar residente.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este residente?')) return
    try {
      await fetch(`/api/residentes/${id}`, { method: 'DELETE' })
      toast.success('Residente eliminado con éxito.')
      fetchResidentes(search)
    } catch (error) {
      console.error('Error deleting residente:', error)
      toast.error('Error al eliminar residente.')
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
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar residentes.')
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
          nombre: item.Nombre || '',
          apellido: item.Apellido || null,
          rut: item.RUT || null,
          unidad: item.Unidad || null,
          etapa: item.Etapa || null,
          tipo: item.Tipo || 'Residente',
          telefono: item.Teléfono || null,
          email: item.Email || null,
          fechaIngreso: item['Fecha Ingreso'] ? new Date(item['Fecha Ingreso']).toISOString().split('T')[0] : null,
          estado: item.Estado || 'Activo',
          vehiculos: item.Vehículos || null,
          notas: item.Notas || null,
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/residentes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Residentes importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchResidentes(search)
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar residentes. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando residentes...</div>
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar los residentes.
      </div>
    )
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
          <Plus className="w-4 h-4 mr-1" /> Nuevo Residente
        </Button>
      </div>

      {/* Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avanzados
            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-md border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_RESIDENTE.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Estado</Label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS_RESIDENTE.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Etapa</Label>
              <Select value={filterEtapa} onValueChange={setFilterEtapa}>
                <SelectTrigger><SelectValue placeholder="Todas las etapas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las etapas</SelectItem>
                  <SelectItem value="sin-etapa">Sin Etapa</SelectItem>
                  {etapasUnicas.map(etapa => <SelectItem key={etapa} value={etapa}>{etapa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Letra Unidad</Label>
              <Select value={filterLetra} onValueChange={setFilterLetra}>
                <SelectTrigger><SelectValue placeholder="Todas las letras" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las letras</SelectItem>
                  {letrasUnicas.map(letra => <SelectItem key={letra} value={letra}>{letra}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Residentes ({residentes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Unidad</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Teléfono</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Email</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : residentes.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Sin residentes</td></tr>
                ) : (
                  residentes.map((res) => (
                    <tr key={res.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7 text-xs">
                            <AvatarFallback>{res.nombre.charAt(0)}{res.apellido?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {res.nombre} {res.apellido}
                        </div>
                      </td>
                      <td className="p-3">{res.unidad || 'N/A'} {res.etapa && <Badge variant="outline" className="ml-1">{res.etapa}</Badge>}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[res.tipo] || 'bg-slate-100'}>{res.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        {res.telefono ? (
                          <a href={`tel:${res.telefono}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone className="w-3 h-3" /> {res.telefono}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="p-3">
                        {res.email ? (
                          <a href={`mailto:${res.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Mail className="w-3 h-3" /> {res.email}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[res.estado] || 'bg-slate-100'}>{res.estado}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {canEdit && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(res)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(res.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Dialogo Nuevo/Editar Residente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRes ? 'Editar' : 'Nuevo'} Residente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input value={formData.apellido || ''} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={formData.rut || ''} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input value={formData.unidad || ''} onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Input value={formData.etapa || ''} onChange={(e) => setFormData({ ...formData, etapa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_RESIDENTE.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Ingreso</Label>
              <Input type="date" value={formData.fechaIngreso || ''} onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_RESIDENTE.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Vehículos (separados por coma)</Label>
              <Input value={formData.vehiculos || ''} onChange={(e) => setFormData({ ...formData, vehiculos: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas || ''} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Residente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Residentes Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los residentes. Asegúrate de que las columnas coincidan con los campos (Nombre, Apellido, RUT, Unidad, Etapa, Tipo, Teléfono, Email, Fecha Ingreso, Estado, Vehículos, Notas).</p>
            <FileUpload
              label="Archivo de Residentes"
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
