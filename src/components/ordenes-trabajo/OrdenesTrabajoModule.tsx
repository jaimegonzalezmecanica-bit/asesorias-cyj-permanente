
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker, dateToISO, isoToDate } from '@/components/ui/date-picker'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/hooks/use-session'
import {
  Plus, Pencil, Trash2, Search, Printer, Clock, Users,
  Wrench, Package, CheckSquare, Database, RefreshCw, Building2,
  Calendar, Lock, Send, CheckCircle, Upload, Download, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

// Interfaces
interface OTMaterial {
  id: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnit: number
  total: number
}

interface OTHerramienta {
  id: string
  nombre: string
  cantidad: number
}

interface OTTarea {
  id: string
  descripcion: string
  cantidad: number
  estado: string
  cumple: boolean | null
}

interface OTPersonalOT {
  id: string
  nombre: string
  tipo: string
  cantidad: number
  precioUnit: number
  horasTrabajadas: number
  total: number
  cumple: boolean | null
  observaciones?: string
}

interface OrdenTrabajo {
  id: string
  otNum: string
  titulo: string
  tipo: string
  prioridad: string
  estado: string
  ubicacion: string | null
  fechaInicio: string | null
  fechaLimite: string | null
  fechaInicioReal: string | null
  fechaFinReal: string | null
  costoEstimado: number
  costoReal: number
  progreso: number
  descripcion: string | null
  centroCostoId: string | null
  centroCosto?: { id: string; codigo: string; nombre: string } | null
  tiempoEst: number
  tiempoReal: number
  valorHora: number
  notas: string | null
  esRecurrente: boolean
  formaPago: string | null
  estadoAprobacion: string | null
  fechaSolicitudAprob: string | null
  materiales: OTMaterial[]
  herramientas: OTHerramienta[]
  tareas: OTTarea[]
  personalOT: OTPersonalOT[]
  asignado: { id: string; nombre: string; sueldoBase: number } | null
  propiedad: { id: string; nombre: string } | null
}

interface Personal {
  id: string
  nombre: string
  cargo: string | null
  sueldoBase: number
}

// Catalog interfaces
interface CentroCosto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  responsable: string | null
  tipoGasto: string
  presupuestoMens: number
}

interface CatMaterial {
  id: string
  codigo: string | null
  nombre: string
  unidad: string
  precioUnit: number
  categoria: string
  stockMinimo: number
  stockActual: number
  ubicacion: string | null
  centroCosto?: CentroCosto | null
}

interface CatHerramienta {
  id: string
  codigo: string | null
  nombre: string
  marca: string | null
  cantidad: number
  ubicacion: string | null
  estado: string
  valorReposicion: number
  centroCosto?: CentroCosto | null
}

interface CatTarea {
  id: string
  codigo: string | null
  nombre: string
  categoria: string
  sistema: string | null
  tipoMantencion: string
  frecuencia: string | null
  responsable: string | null
  tiempoEstimado: number
  centroCosto?: CentroCosto | null
  esRecurrente: boolean
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('es-CL')
  } catch {
    return d
  }
}

const formatMinutes = (mins: number) => {
  if (!mins) return '0 min'
  const hours = Math.floor(mins / 60)
  const minutes = mins % 60
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`
  if (hours > 0) return `${hours}h`
  return `${minutes}min`
}

// Calcular valor hora desde sueldo mensual (22 días, 8 horas)
const calcularValorHora = (sueldoBase: number) => {
  return sueldoBase / (22 * 8) // 176 horas al mes
}

const tipoColors: Record<string, string> = {
  'Correctivo': 'bg-orange-100 text-orange-700',
  'Preventivo': 'bg-blue-100 text-blue-700',
  'Mejora': 'bg-purple-100 text-purple-700',
  'Emergencia': 'bg-red-100 text-red-700',
}

const prioridadColors: Record<string, string> = {
  'Urgente': 'bg-red-100 text-red-700',
  'Alta': 'bg-orange-100 text-orange-700',
  'Media': 'bg-yellow-100 text-yellow-700',
  'Baja': 'bg-green-100 text-green-700',
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

const TIPOS_OT = ['Correctivo', 'Preventivo', 'Mejora', 'Emergencia']
const PRIORIDADES_OT = ['Urgente', 'Alta', 'Media', 'Baja']
const ESTADOS_OT = ['Pendiente', 'En Progreso', 'Completado', 'Cancelado']

export function OrdenesTrabajoModule() {
  const { currentCondominio } = useAppStore()
  const { isPersonal, canEditProgress } = useSession()
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [propiedades, setPropiedades] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [editingOT, setEditingOT] = useState<OrdenTrabajo | null>(null)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [progressOT, setProgressOT] = useState<OrdenTrabajo | null>(null)
  
  // Catalogs state
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
  const [catMateriales, setCatMateriales] = useState<CatMaterial[]>([])
  const [catHerramientas, setCatHerramientas] = useState<CatHerramienta[]>([])
  const [catTareas, setCatTareas] = useState<CatTarea[]>([])
  const [catalogsLoaded, setCatalogsLoaded] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Correctivo',
    prioridad: 'Media',
    estado: 'Pendiente',
    ubicacion: '',
    fechaInicio: null as Date | null,
    fechaLimite: null as Date | null,
    fechaInicioReal: null as Date | null,
    fechaFinReal: null as Date | null,
    costoEstimado: 0,
    costoReal: 0,
    progreso: 0,
    descripcion: '',
    centroCostoId: 'none',
    asignadoId: 'none',
    propiedadId: 'none',
    tiempoEst: 0,
    tiempoReal: 0,
    notas: '',
    esRecurrente: false,
    formaPago: 'Gasto Común Mensual',
  })
  
  // Resources state
  const [materiales, setMateriales] = useState<OTMaterial[]>([])
  const [herramientas, setHerramientas] = useState<OTHerramienta[]>([])
  const [tareas, setTareas] = useState<OTTarea[]>([])
  const [personalOT, setPersonalOT] = useState<OTPersonalOT[]>([])

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'otNum', label: 'Nº OT', defaultVisible: true },
    { key: 'titulo', label: 'Título', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'prioridad', label: 'Prioridad', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'fechaInicio', label: 'Fecha Inicio', defaultVisible: true },
    { key: 'fechaLimite', label: 'Fecha Límite', defaultVisible: true },
    { key: 'costoEstimado', label: 'Costo Estimado', defaultVisible: true },
    { key: 'progreso', label: 'Progreso', defaultVisible: true },
    { key: 'asignado.nombre', label: 'Asignado', defaultVisible: true },
    { key: 'propiedad.nombre', label: 'Propiedad', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: false },
    { key: 'notas', label: 'Notas', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_OT },
    { key: 'prioridad', label: 'Prioridad', type: 'select', options: PRIORIDADES_OT },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_OT },
    { key: 'asignadoId', label: 'Asignado', type: 'select', options: personal.map(p => ({ value: p.id, label: p.nombre })) },
    { key: 'propiedadId', label: 'Propiedad', type: 'select', options: propiedades.map(p => ({ value: p.id, label: p.nombre })) },
  ], [personal, propiedades])

  const { ExportButton } = useExport({
    moduleName: 'ordenes-trabajo',
    moduleLabel: 'Órdenes de Trabajo',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => ordenes
  })

  const fetchOrdenes = async (searchTerm = '') => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const url = searchTerm ? `/api/ordenes-trabajo?condominioId=${currentCondominio.id}&search=${encodeURIComponent(searchTerm)}` : `/api/ordenes-trabajo?condominioId=${currentCondominio.id}`
      const res = await fetch(url)
      const result = await res.json()
      // API returns { data: [...], pagination: {...} }, extract the data array
      const dataArray = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : [])
      setOrdenes(dataArray)
    } catch (error) {
      console.error('Error fetching ordenes:', error)
      toast.error('Error al cargar las órdenes de trabajo.')
      setOrdenes([])
    }
    setLoading(false)
  }

  const fetchCatalogs = async () => {
    if (!currentCondominio?.id) return
    try {
      const res = await fetch(`/api/seed-catalogos?condominioId=${currentCondominio.id}`)
      const data = await res.json()
      if (data.herramientas && data.tareas && data.materiales && data.centrosCosto) {
        setCentrosCosto(data.centrosCosto)
        setCatHerramientas(data.herramientas)
        setCatTareas(data.tareas)
        setCatMateriales(data.materiales)
        setCatalogsLoaded(true)
      }
    } catch (error) {
      console.error('Error fetching catalogs:', error)
      toast.error('Error al cargar los catálogos.')
    }
  }

  const seedCatalogs = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para cargar los catálogos.')
      return
    }
    try {
      const res = await fetch('/api/seed-catalogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condominioId: currentCondominio.id })
      })
      const data = await res.json()
      toast.success(`Catálogos cargados: ${data.centrosCosto || 0} centros de costo, ${data.tareas} tareas, ${data.herramientas} herramientas, ${data.materiales} materiales`)
      fetchCatalogs()
    } catch (error) {
      console.error('Error seeding catalogs:', error)
      toast.error('Error al cargar catálogos.')
    }
  }

  useEffect(() => {
    fetchOrdenes()
    fetch('/api/personal').then(res => res.json()).then(setPersonal)
    fetch('/api/propiedades').then(res => res.json()).then(setPropiedades)
    fetchCatalogs()
  }, [currentCondominio])

  useEffect(() => {
    const timeout = setTimeout(() => fetchOrdenes(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (ot?: OrdenTrabajo) => {
    if (ot) {
      setEditingOT(ot)
      setFormData({
        titulo: ot.titulo,
        tipo: ot.tipo,
        prioridad: ot.prioridad,
        estado: ot.estado,
        ubicacion: ot.ubicacion || '',
        fechaInicio: ot.fechaInicio ? isoToDate(ot.fechaInicio) : null,
        fechaLimite: ot.fechaLimite ? isoToDate(ot.fechaLimite) : null,
        fechaInicioReal: ot.fechaInicioReal ? isoToDate(ot.fechaInicioReal) : null,
        fechaFinReal: ot.fechaFinReal ? isoToDate(ot.fechaFinReal) : null,
        costoEstimado: ot.costoEstimado,
        costoReal: ot.costoReal,
        progreso: ot.progreso,
        descripcion: ot.descripcion || '',
        centroCostoId: ot.centroCostoId || 'none',
        asignadoId: ot.asignado?.id || 'none',
        propiedadId: ot.propiedad?.id || 'none',
        tiempoEst: ot.tiempoEst,
        tiempoReal: ot.tiempoReal,
        notas: ot.notas || '',
        esRecurrente: ot.esRecurrente,
        formaPago: ot.formaPago || 'Gasto Común Mensual',
      })
      setMateriales(ot.materiales || [])
      setHerramientas(ot.herramientas || [])
      setTareas(ot.tareas || [])
      setPersonalOT(ot.personalOT || [])
    } else {
      setEditingOT(null)
      setFormData({
        titulo: '',
        tipo: 'Correctivo',
        prioridad: 'Media',
        estado: 'Pendiente',
        ubicacion: '',
        fechaInicio: null,
        fechaLimite: null,
        fechaInicioReal: null,
        fechaFinReal: null,
        costoEstimado: 0,
        costoReal: 0,
        progreso: 0,
        descripcion: '',
        centroCostoId: 'none',
        asignadoId: 'none',
        propiedadId: 'none',
        tiempoEst: 0,
        tiempoReal: 0,
        notas: '',
        esRecurrente: false,
        formaPago: 'Gasto Común Mensual',
      })
      setMateriales([])
      setHerramientas([])
      setTareas([])
      setPersonalOT([])
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar la orden de trabajo.')
      return
    }
    if (!formData.titulo.trim()) {
      toast.error('El título de la orden de trabajo es obligatorio.')
      return
    }

    const payload = {
      ...formData,
      condominioId: currentCondominio.id,
      fechaInicio: dateToISO(formData.fechaInicio),
      fechaLimite: dateToISO(formData.fechaLimite),
      fechaInicioReal: dateToISO(formData.fechaInicioReal),
      fechaFinReal: dateToISO(formData.fechaFinReal),
      centroCostoId: formData.centroCostoId === 'none' ? null : formData.centroCostoId,
      asignadoId: formData.asignadoId === 'none' ? null : formData.asignadoId,
      propiedadId: formData.propiedadId === 'none' ? null : formData.propiedadId,
      materiales,
      herramientas,
      tareas,
      personalOT,
    }

    try {
      if (editingOT) {
        await fetch(`/api/ordenes-trabajo/${editingOT.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Orden de trabajo actualizada con éxito.')
      } else {
        await fetch('/api/ordenes-trabajo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Orden de trabajo creada con éxito.')
      }
      setDialogOpen(false)
      fetchOrdenes(search)
    } catch (error) {
      console.error('Error saving orden de trabajo:', error)
      toast.error('Error al guardar la orden de trabajo.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta orden de trabajo?')) return
    try {
      await fetch(`/api/ordenes-trabajo/${id}`, { method: 'DELETE' })
      fetchOrdenes(search)
      toast.success('Orden de trabajo eliminada con éxito.')
    } catch (error) {
      console.error('Error deleting orden de trabajo:', error)
      toast.error('Error al eliminar la orden de trabajo.')
    }
  }

  const openProgressDialog = (ot: OrdenTrabajo) => {
    setProgressOT(ot)
    setFormData(prev => ({ ...prev, progreso: ot.progreso, estado: ot.estado }))
    setProgressDialogOpen(true)
  }

  const handleProgressSave = async () => {
    if (!progressOT) return
    try {
      await fetch(`/api/ordenes-trabajo/${progressOT.id}/progreso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progreso: formData.progreso, estado: formData.estado }),
      })
      toast.success('Progreso de orden de trabajo actualizado con éxito.')
      setProgressDialogOpen(false)
      fetchOrdenes(search)
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Error al actualizar el progreso de la orden de trabajo.')
    }
  }

  // Materiales Handlers
  const addMaterial = (material: CatMaterial) => {
    setMateriales(prev => [...prev, { id: material.id, descripcion: material.nombre, cantidad: 1, unidad: material.unidad, precioUnit: material.precioUnit, total: material.precioUnit }])
  }

  const updateMaterial = (id: string, field: keyof OTMaterial, value: any) => {
    setMateriales(prev => prev.map(mat => {
      if (mat.id === id) {
        const updatedMat = { ...mat, [field]: value }
        if (field === 'cantidad' || field === 'precioUnit') {
          updatedMat.total = updatedMat.cantidad * updatedMat.precioUnit
        }
        return updatedMat
      }
      return mat
    }))
  }

  const removeMaterial = (id: string) => {
    setMateriales(prev => prev.filter(mat => mat.id !== id))
  }

  // Herramientas Handlers
  const addHerramienta = (herramienta: CatHerramienta) => {
    setHerramientas(prev => [...prev, { id: herramienta.id, nombre: herramienta.nombre, cantidad: 1 }])
  }

  const updateHerramienta = (id: string, field: keyof OTHerramienta, value: any) => {
    setHerramientas(prev => prev.map(herr => herr.id === id ? { ...herr, [field]: value } : herr))
  }

  const removeHerramienta = (id: string) => {
    setHerramientas(prev => prev.filter(herr => herr.id !== id))
  }

  // Tareas Handlers
  const addTarea = (tarea: CatTarea) => {
    setTareas(prev => [...prev, { id: tarea.id, descripcion: tarea.nombre, cantidad: 1, estado: 'Pendiente', cumple: false }])
  }

  const updateTarea = (id: string, field: keyof OTTarea, value: any) => {
    setTareas(prev => prev.map(tar => tar.id === id ? { ...tar, [field]: value } : tar))
  }

  const removeTarea = (id: string) => {
    setTareas(prev => prev.filter(tar => tar.id !== id))
  }

  // Personal OT Handlers
  const addPersonalOT = (person: Personal) => {
    setPersonalOT(prev => [...prev, { id: person.id, nombre: person.nombre, tipo: person.cargo || 'Operario', cantidad: 1, precioUnit: calcularValorHora(person.sueldoBase), horasTrabajadas: 0, total: 0, cumple: false }])
  }

  const updatePersonalOT = (id: string, field: keyof OTPersonalOT, value: any) => {
    setPersonalOT(prev => prev.map(pOT => {
      if (pOT.id === id) {
        const updatedPOT = { ...pOT, [field]: value }
        if (field === 'horasTrabajadas' || field === 'precioUnit') {
          updatedPOT.total = updatedPOT.horasTrabajadas * updatedPOT.precioUnit
        }
        return updatedPOT
      }
      return pOT
    }))
  }

  const removePersonalOT = (id: string) => {
    setPersonalOT(prev => prev.filter(pOT => pOT.id !== id))
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
      toast.error('Debe seleccionar un condominio para importar órdenes de trabajo.')
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
          tipo: item.Tipo || 'Correctivo',
          prioridad: item.Prioridad || 'Media',
          estado: item.Estado || 'Pendiente',
          ubicacion: item.Ubicacion || null,
          fechaInicio: item['Fecha Inicio'] ? new Date(item['Fecha Inicio']).toISOString().split('T')[0] : null,
          fechaLimite: item['Fecha Límite'] ? new Date(item['Fecha Límite']).toISOString().split('T')[0] : null,
          costoEstimado: Number(item['Costo Estimado']) || 0,
          progreso: Number(item.Progreso) || 0,
          descripcion: item.Descripcion || null,
          centroCostoId: centrosCosto.find(cc => cc.nombre === item['Centro de Costo'])?.id || null,
          asignadoId: personal.find(p => p.nombre === item.Asignado)?.id || null,
          propiedadId: propiedades.find(prop => prop.nombre === item.Propiedad)?.id || null,
          tiempoEst: Number(item['Tiempo Estimado']) || 0,
          notas: item.Notas || null,
          esRecurrente: item.Recurrente === 'TRUE',
          formaPago: item['Forma de Pago'] || 'Gasto Común Mensual',
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/ordenes-trabajo/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Órdenes de trabajo importadas con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchOrdenes(search)
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar órdenes de trabajo. Verifica el formato del archivo y que los catálogos existan.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando órdenes de trabajo...</div>
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar las órdenes de trabajo.
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
          <Plus className="w-4 h-4 mr-1" /> Nueva OT
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Órdenes de Trabajo ({ordenes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">OT #</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Título</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Prioridad</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Asignado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Progreso</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : ordenes.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Sin órdenes de trabajo</td></tr>
                ) : (
                  ordenes.map((ot) => (
                    <tr key={ot.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">{ot.otNum}</td>
                      <td className="p-3">{ot.titulo}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[ot.tipo] || 'bg-slate-100'}>{ot.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={prioridadColors[ot.prioridad] || 'bg-slate-100'}>{ot.prioridad}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[ot.estado] || 'bg-slate-100'}>{ot.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs">{ot.asignado?.nombre || 'N/A'}</td>
                      <td className="p-3">
                        <Progress value={ot.progreso} className="h-2" />
                        <span className="text-xs text-slate-500">{ot.progreso}%</span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedOT(ot); setDetailDialogOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(ot)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {canEditProgress && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openProgressDialog(ot)}>
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(ot.id)}>
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

      {/* Dialogo Nueva/Editar OT */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingOT ? 'Editar' : 'Nueva'} Orden de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_OT.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={formData.prioridad} onValueChange={(v) => setFormData({ ...formData, prioridad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES_OT.map(prio => <SelectItem key={prio} value={prio}>{prio}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_OT.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <DatePicker date={formData.fechaInicio} setDate={(date) => setFormData({ ...formData, fechaInicio: date })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Límite</Label>
              <DatePicker date={formData.fechaLimite} setDate={(date) => setFormData({ ...formData, fechaLimite: date })} />
            </div>
            <div className="space-y-2">
              <Label>Costo Estimado</Label>
              <Input type="number" value={formData.costoEstimado} onChange={(e) => setFormData({ ...formData, costoEstimado: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Tiempo Estimado (minutos)</Label>
              <Input type="number" value={formData.tiempoEst} onChange={(e) => setFormData({ ...formData, tiempoEst: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Centro de Costo</Label>
              <Select value={formData.centroCostoId} onValueChange={(v) => setFormData({ ...formData, centroCostoId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {centrosCosto.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asignado a</Label>
              <Select value={formData.asignadoId} onValueChange={(v) => setFormData({ ...formData, asignadoId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {personal.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Propiedad</Label>
              <Select value={formData.propiedadId} onValueChange={(v) => setFormData({ ...formData, propiedadId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {propiedades.map(prop => <SelectItem key={prop.id} value={prop.id}>{prop.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="esRecurrente"
                checked={formData.esRecurrente}
                onCheckedChange={(checked) => setFormData({ ...formData, esRecurrente: checked as boolean })}
              />
              <Label htmlFor="esRecurrente">Es Recurrente</Label>
            </div>
          </div>

          <Separator className="my-4" />
          <h3 className="text-lg font-semibold mb-3">Recursos y Tareas</h3>

          {/* Materiales */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">Materiales</h4>
              <Select onValueChange={(v) => addMaterial(catMateriales.find(mat => mat.id === v)!)} value="">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agregar Material" />
                </SelectTrigger>
                <SelectContent>
                  {catMateriales.map(mat => <SelectItem key={mat.id} value={mat.id}>{mat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiales.map(mat => (
                  <TableRow key={mat.id}>
                    <TableCell>{mat.descripcion}</TableCell>
                    <TableCell><Input type="number" value={mat.cantidad} onChange={(e) => updateMaterial(mat.id, 'cantidad', Number(e.target.value))} /></TableCell>
                    <TableCell>{mat.unidad}</TableCell>
                    <TableCell><Input type="number" value={mat.precioUnit} onChange={(e) => updateMaterial(mat.id, 'precioUnit', Number(e.target.value))} /></TableCell>
                    <TableCell>{formatCLP(mat.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeMaterial(mat.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Herramientas */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">Herramientas</h4>
              <Select onValueChange={(v) => addHerramienta(catHerramientas.find(herr => herr.id === v)!)} value="">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agregar Herramienta" />
                </SelectTrigger>
                <SelectContent>
                  {catHerramientas.map(herr => <SelectItem key={herr.id} value={herr.id}>{herr.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {herramientas.map(herr => (
                  <TableRow key={herr.id}>
                    <TableCell>{herr.nombre}</TableCell>
                    <TableCell><Input type="number" value={herr.cantidad} onChange={(e) => updateHerramienta(herr.id, 'cantidad', Number(e.target.value))} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeHerramienta(herr.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Tareas */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">Tareas</h4>
              <Select onValueChange={(v) => addTarea(catTareas.find(tar => tar.id === v)!)} value="">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agregar Tarea" />
                </SelectTrigger>
                <SelectContent>
                  {catTareas.map(tar => <SelectItem key={tar.id} value={tar.id}>{tar.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tareas.map(tar => (
                  <TableRow key={tar.id}>
                    <TableCell>{tar.descripcion}</TableCell>
                    <TableCell><Input type="number" value={tar.cantidad} onChange={(e) => updateTarea(tar.id, 'cantidad', Number(e.target.value))} /></TableCell>
                    <TableCell>
                      <Select value={tar.estado} onValueChange={(v) => updateTarea(tar.id, 'estado', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="En Progreso">En Progreso</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeTarea(tar.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Personal OT */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">Personal Asignado</h4>
              <Select onValueChange={(v) => addPersonalOT(personal.find(p => p.id === v)!)} value="">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agregar Personal" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Valor Hora</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personalOT.map(pOT => (
                  <TableRow key={pOT.id}>
                    <TableCell>{pOT.nombre}</TableCell>
                    <TableCell>{pOT.tipo}</TableCell>
                    <TableCell><Input type="number" value={pOT.horasTrabajadas} onChange={(e) => updatePersonalOT(pOT.id, 'horasTrabajadas', Number(e.target.value))} /></TableCell>
                    <TableCell>{formatCLP(pOT.precioUnit)}</TableCell>
                    <TableCell>{formatCLP(pOT.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removePersonalOT(pOT.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Orden de Trabajo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Detalle OT */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Trabajo: {selectedOT?.otNum}</DialogTitle>
          </DialogHeader>
          {selectedOT && (
            <div className="grid grid-cols-2 gap-4 py-4 text-sm">
              <p><strong>Título:</strong> {selectedOT.titulo}</p>
              <p><strong>Descripción:</strong> {selectedOT.descripcion}</p>
              <p><strong>Tipo:</strong> <Badge className={tipoColors[selectedOT.tipo]}>{selectedOT.tipo}</Badge></p>
              <p><strong>Prioridad:</strong> <Badge className={prioridadColors[selectedOT.prioridad]}>{selectedOT.prioridad}</Badge></p>
              <p><strong>Estado:</strong> <Badge className={estadoColors[selectedOT.estado]}>{selectedOT.estado}</Badge></p>
              <p><strong>Ubicación:</strong> {selectedOT.ubicacion}</p>
              <p><strong>Fecha Inicio:</strong> {formatDate(selectedOT.fechaInicio)}</p>
              <p><strong>Fecha Límite:</strong> {formatDate(selectedOT.fechaLimite)}</p>
              <p><strong>Fecha Inicio Real:</strong> {formatDate(selectedOT.fechaInicioReal)}</p>
              <p><strong>Fecha Fin Real:</strong> {formatDate(selectedOT.fechaFinReal)}</p>
              <p><strong>Costo Estimado:</strong> {formatCLP(selectedOT.costoEstimado)}</p>
              <p><strong>Costo Real:</strong> {formatCLP(selectedOT.costoReal)}</p>
              <p><strong>Progreso:</strong> {selectedOT.progreso}%</p>
              <p><strong>Tiempo Estimado:</strong> {formatMinutes(selectedOT.tiempoEst)}</p>
              <p><strong>Tiempo Real:</strong> {formatMinutes(selectedOT.tiempoReal)}</p>
              <p><strong>Centro de Costo:</strong> {selectedOT.centroCosto?.nombre || 'N/A'}</p>
              <p><strong>Asignado a:</strong> {selectedOT.asignado?.nombre || 'N/A'}</p>
              <p><strong>Propiedad:</strong> {selectedOT.propiedad?.nombre || 'N/A'}</p>
              <p><strong>Es Recurrente:</strong> {selectedOT.esRecurrente ? 'Sí' : 'No'}</p>
              <p><strong>Forma de Pago:</strong> {selectedOT.formaPago || 'N/A'}</p>
              <p><strong>Estado Aprobación:</strong> {selectedOT.estadoAprobacion || 'N/A'}</p>
              <p><strong>Notas:</strong> {selectedOT.notas}</p>

              <Separator className="my-4 col-span-2" />
              <h3 className="text-lg font-semibold mb-3 col-span-2">Recursos y Tareas</h3>

              {/* Materiales */}
              <div className="col-span-2 mb-4">
                <h4 className="text-md font-semibold">Materiales</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOT.materiales.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">No hay materiales.</TableCell></TableRow>
                    ) : (
                      selectedOT.materiales.map(mat => (
                        <TableRow key={mat.id}>
                          <TableCell>{mat.descripcion}</TableCell>
                          <TableCell>{mat.cantidad}</TableCell>
                          <TableCell>{mat.unidad}</TableCell>
                          <TableCell className="text-right">{formatCLP(mat.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Herramientas */}
              <div className="col-span-2 mb-4">
                <h4 className="text-md font-semibold">Herramientas</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOT.herramientas.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center">No hay herramientas.</TableCell></TableRow>
                    ) : (
                      selectedOT.herramientas.map(herr => (
                        <TableRow key={herr.id}>
                          <TableCell>{herr.nombre}</TableCell>
                          <TableCell>{herr.cantidad}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Tareas */}
              <div className="col-span-2 mb-4">
                <h4 className="text-md font-semibold">Tareas</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOT.tareas.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center">No hay tareas.</TableCell></TableRow>
                    ) : (
                      selectedOT.tareas.map(tar => (
                        <TableRow key={tar.id}>
                          <TableCell>{tar.descripcion}</TableCell>
                          <TableCell>{tar.cantidad}</TableCell>
                          <TableCell>{tar.estado}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Personal OT */}
              <div className="col-span-2 mb-4">
                <h4 className="text-md font-semibold">Personal Asignado</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOT.personalOT.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">No hay personal asignado.</TableCell></TableRow>
                    ) : (
                      selectedOT.personalOT.map(pOT => (
                        <TableRow key={pOT.id}>
                          <TableCell>{pOT.nombre}</TableCell>
                          <TableCell>{pOT.tipo}</TableCell>
                          <TableCell>{pOT.horasTrabajadas}</TableCell>
                          <TableCell className="text-right">{formatCLP(pOT.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Actualizar Progreso */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Progreso de OT: {progressOT?.otNum}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progreso">Progreso (%)</Label>
              <Input id="progreso" type="number" min="0" max="100" value={formData.progreso} onChange={(e) => setFormData({ ...formData, progreso: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_OT.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleProgressSave}>Guardar Progreso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Órdenes de Trabajo Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las órdenes de trabajo. Asegúrate de que las columnas coincidan con los campos (Título, Tipo, Prioridad, Estado, Ubicación, Fecha Inicio, Fecha Límite, Costo Estimado, Progreso, Descripción, Centro de Costo, Asignado, Propiedad, Tiempo Estimado, Notas, Recurrente, Forma de Pago).</p>
            <FileUpload
              label="Archivo de Órdenes de Trabajo"
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
