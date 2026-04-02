'use client'

import { useEffect, useState } from 'react'
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
import { 
  Plus, Pencil, Trash2, Search, Printer, Clock, Users, 
  Wrench, Package, CheckSquare, Database, RefreshCw, Building2,
  Calendar, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useSession } from '@/hooks/use-session'

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
  'Pendiente Aprobación': 'bg-orange-100 text-orange-700',
}

export function OrdenesTrabajoModule() {
  // Session y permisos
  const { isAdmin, isSupervisor } = useSession()
  
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [propiedades, setPropiedades] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [editingOT, setEditingOT] = useState<OrdenTrabajo | null>(null)
  
  // Ubicaciones
  const [ubicaciones, setUbicaciones] = useState<{ id: string; codigo: string; nombre: string; categoria: string }[]>([])
  
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
    ubicacionCustom: '', // Para nuevas ubicaciones
    fechaInicio: null as Date | null,
    fechaLimite: null as Date | null,
    fechaInicioReal: null as Date | null,
    fechaFinReal: null as Date | null,
    costoEstimado: 0,
    costoReal: 0,
    progreso: 0,
    progresoManual: 0, // Progreso ingresado manualmente
    descripcion: '',
    centroCostoId: 'none',
    asignadoId: 'none',
    propiedadId: 'none',
    tiempoEst: 0,
    tiempoReal: 0,
    notas: '',
    esRecurrente: false,
    formaPago: 'Gasto Común Mensual',
    solicitarAprobacion: false, // Checkbox para solicitar aprobación
    fechaHoraInicio: null as Date | null, // Fecha/hora automática inicio
    fechaHoraFin: null as Date | null, // Fecha/hora automática fin
    segundosTranscurridos: 0, // Tiempo transcurrido en segundos
  })

  // Resources state
  const [materiales, setMateriales] = useState<OTMaterial[]>([])
  const [herramientas, setHerramientas] = useState<OTHerramienta[]>([])
  const [tareas, setTareas] = useState<OTTarea[]>([])
  const [personalOT, setPersonalOT] = useState<OTPersonalOT[]>([])

  const fetchOrdenes = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/ordenes-trabajo?search=${encodeURIComponent(searchTerm)}` : '/api/ordenes-trabajo'
      const res = await fetch(url)
      const data = await res.json()
      setOrdenes(data)
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    }
    setLoading(false)
  }

  const fetchCatalogs = async () => {
    try {
      const res = await fetch('/api/seed-catalogos')
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
    }
  }

  const seedCatalogs = async () => {
    try {
      const res = await fetch('/api/seed-catalogos', { method: 'POST' })
      const data = await res.json()
      alert(`Catálogos cargados:\n- ${data.centrosCosto || 0} centros de costo\n- ${data.tareas} tareas\n- ${data.herramientas} herramientas\n- ${data.materiales} materiales`)
      fetchCatalogs()
    } catch (error) {
      console.error('Error seeding catalogs:', error)
      alert('Error al cargar catálogos')
    }
  }

  useEffect(() => {
    void (async () => {
      await fetchOrdenes()
    })()
    fetch('/api/personal').then(res => res.json()).then(setPersonal)
    fetch('/api/propiedades').then(res => res.json()).then(setPropiedades)
    fetch('/api/ubicaciones').then(res => res.json()).then(setUbicaciones)
    void (async () => {
      await fetchCatalogs()
    })()
  }, [])

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
        ubicacionCustom: '',
        fechaInicio: ot.fechaInicio ? isoToDate(ot.fechaInicio) ?? null : null,
        fechaLimite: ot.fechaLimite ? isoToDate(ot.fechaLimite) ?? null : null,
        fechaInicioReal: ot.fechaInicioReal ? isoToDate(ot.fechaInicioReal) ?? null : null,
        fechaFinReal: ot.fechaFinReal ? isoToDate(ot.fechaFinReal) ?? null : null,
        costoEstimado: ot.costoEstimado,
        costoReal: ot.costoReal,
        progreso: ot.progreso,
        progresoManual: ot.progreso,
        descripcion: ot.descripcion || '',
        centroCostoId: ot.centroCostoId || 'none',
        asignadoId: ot.asignado?.id || 'none',
        propiedadId: ot.propiedad?.id || 'none',
        tiempoEst: ot.tiempoEst,
        tiempoReal: ot.tiempoReal,
        notas: ot.notas || '',
        esRecurrente: ot.esRecurrente || false,
        formaPago: ot.formaPago || 'Gasto Común Mensual',
        solicitarAprobacion: false,
        fechaHoraInicio: null,
        fechaHoraFin: null,
        segundosTranscurridos: 0,
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
        ubicacionCustom: '',
        fechaInicio: null,
        fechaLimite: null,
        fechaInicioReal: null,
        fechaFinReal: null,
        costoEstimado: 0,
        costoReal: 0,
        progreso: 0,
        progresoManual: 0,
        descripcion: '',
        centroCostoId: 'none',
        asignadoId: 'none',
        propiedadId: 'none',
        tiempoEst: 0,
        tiempoReal: 0,
        notas: '',
        esRecurrente: false,
        formaPago: 'Gasto Común Mensual',
        solicitarAprobacion: false,
        fechaHoraInicio: null,
        fechaHoraFin: null,
        segundosTranscurridos: 0,
      })
      setMateriales([])
      setHerramientas([])
      setTareas([])
      setPersonalOT([])
    }
    setDialogOpen(true)
  }

  const openDetailDialog = (ot: OrdenTrabajo) => {
    setSelectedOT(ot)
    setDetailDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim()) return

    // Calcular costo real basado en materiales y personal
    const costoMateriales = materiales.reduce((sum, m) => sum + (m.total || m.cantidad * m.precioUnit), 0)
    const costoPersonal = personalOT.reduce((sum, p) => sum + (p.total || p.precioUnit * p.horasTrabajadas * p.cantidad), 0)
    const costoRealCalculado = costoMateriales + costoPersonal

    // Calcular tiempo total de tareas del catálogo
    const tiempoTareas = tareas.reduce((sum, t) => {
      const catTarea = catTareas.find(ct => ct.nombre === t.descripcion || ct.nombre === t.descripcion.replace(/^\[[^\]]+\]\s*/, '').replace(/\s*\(CC:.*\)$/, ''))
      return sum + (catTarea?.tiempoEstimado || 0) * t.cantidad
    }, 0)

    // Calcular progreso automático
    const totalItems = tareas.length + materiales.length + herramientas.length + personalOT.length
    const itemsCompletados = 
      tareas.filter(t => t.estado === 'Completado').length +
      materiales.filter(m => m.cantidad > 0).length +
      herramientas.filter(h => h.cantidad > 0).length +
      personalOT.filter(p => p.horasTrabajadas > 0).length
    const progresoCalculado = totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 0
    // Usar el mayor entre progreso manual y calculado
    const progresoFinal = Math.max(formData.progresoManual, progresoCalculado)

    // Determinar estado final según aprobación
    let estadoFinal = formData.estado
    if (formData.estado === 'Completado' && formData.solicitarAprobacion) {
      estadoFinal = 'Pendiente Aprobación'
    }

    // Manejar fecha/hora automática
    let fechaHoraInicio = formData.fechaHoraInicio
    let fechaHoraFin = formData.fechaHoraFin
    let segundosTranscurridos = formData.segundosTranscurridos

    // Si el estado cambia a "En Progreso", registrar fecha de inicio
    if (formData.estado === 'En Progreso' && editingOT?.estado !== 'En Progreso') {
      fechaHoraInicio = new Date()
    }
    // Si el estado cambia a "Completado" o "Pendiente Aprobación", registrar fecha de fin
    if ((estadoFinal === 'Completado' || estadoFinal === 'Pendiente Aprobación') && editingOT?.estado !== 'Completado' && editingOT?.estado !== 'Pendiente Aprobación') {
      fechaHoraFin = new Date()
      if (fechaHoraInicio) {
        segundosTranscurridos = Math.round((fechaHoraFin.getTime() - fechaHoraInicio.getTime()) / 1000)
      }
    }

    // Manejar ubicación: crear nueva si es necesario
    let ubicacionFinal = formData.ubicacion
    if (formData.ubicacion === '__custom__' && formData.ubicacionCustom.trim()) {
      // Verificar si ya existe (case insensitive)
      const existeUbicacion = ubicaciones.find(
        u => u.nombre.toLowerCase() === formData.ubicacionCustom.trim().toLowerCase()
      )
      if (existeUbicacion) {
        ubicacionFinal = existeUbicacion.nombre
      } else {
        // Crear nueva ubicación
        try {
          const nextNum = ubicaciones.length + 1
          const codigo = `UB-${String(nextNum).padStart(3, '0')}`
          const res = await fetch('/api/ubicaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codigo,
              nombre: formData.ubicacionCustom.trim(),
              categoria: 'General'
            })
          })
          const newUbicacion = await res.json()
          setUbicaciones(prev => [...prev, newUbicacion])
          ubicacionFinal = newUbicacion.nombre
        } catch (error) {
          console.error('Error creating ubicacion:', error)
          ubicacionFinal = formData.ubicacionCustom.trim()
        }
      }
    }

    const dataToSend = {
      ...formData,
      ubicacion: ubicacionFinal,
      fechaInicio: formData.fechaInicio ? dateToISO(formData.fechaInicio) : null,
      fechaLimite: formData.fechaLimite ? dateToISO(formData.fechaLimite) : null,
      fechaInicioReal: formData.fechaInicioReal ? dateToISO(formData.fechaInicioReal) : null,
      fechaFinReal: formData.fechaFinReal ? dateToISO(formData.fechaFinReal) : null,
      centroCostoId: formData.centroCostoId === 'none' ? null : formData.centroCostoId,
      asignadoId: formData.asignadoId === 'none' ? null : formData.asignadoId,
      propiedadId: formData.propiedadId === 'none' ? null : formData.propiedadId,
      costoReal: costoRealCalculado,
      tiempoEst: formData.tiempoEst || tiempoTareas,
      progreso: progresoFinal,
      estado: estadoFinal,
      fechaHoraInicio: fechaHoraInicio ? fechaHoraInicio.toISOString() : null,
      fechaHoraFin: fechaHoraFin ? fechaHoraFin.toISOString() : null,
      segundosTranscurridos,
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
          body: JSON.stringify(dataToSend),
        })
      } else {
        await fetch('/api/ordenes-trabajo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      }
      setDialogOpen(false)
      fetchOrdenes(search)
    } catch (error) {
      console.error('Error saving OT:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta orden de trabajo?')) return
    try {
      await fetch(`/api/ordenes-trabajo/${id}`, { method: 'DELETE' })
      fetchOrdenes(search)
    } catch (error) {
      console.error('Error deleting OT:', error)
    }
  }

  // Material handlers
  const addMaterial = () => {
    setMateriales([...materiales, {
      id: `temp-${Date.now()}`,
      descripcion: '',
      cantidad: 1,
      unidad: 'unidad',
      precioUnit: 0,
      total: 0
    }])
  }

  const addMaterialFromCatalog = (catMat: CatMaterial) => {
    const descripcionNueva = `${catMat.codigo ? `[${catMat.codigo}] ` : ''}${catMat.nombre}${catMat.centroCosto ? ` (CC: ${catMat.centroCosto.codigo})` : ''}`
    // Verificar si ya existe (case insensitive)
    const existingIndex = materiales.findIndex(
      m => m.descripcion.toLowerCase() === descripcionNueva.toLowerCase()
    )
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updated = [...materiales]
      updated[existingIndex].cantidad += 1
      updated[existingIndex].total = updated[existingIndex].cantidad * updated[existingIndex].precioUnit
      setMateriales(updated)
    } else {
      setMateriales([...materiales, {
        id: `temp-${Date.now()}`,
        descripcion: descripcionNueva,
        cantidad: 1,
        unidad: catMat.unidad,
        precioUnit: catMat.precioUnit,
        total: catMat.precioUnit
      }])
    }
  }

  const updateMaterial = (index: number, field: string, value: any) => {
    const updated = [...materiales]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'cantidad' || field === 'precioUnit') {
      updated[index].total = updated[index].cantidad * updated[index].precioUnit
    }
    setMateriales(updated)
  }

  const removeMaterial = (index: number) => {
    setMateriales(materiales.filter((_, i) => i !== index))
  }

  // Herramienta handlers
  const addHerramienta = () => {
    setHerramientas([...herramientas, {
      id: `temp-${Date.now()}`,
      nombre: '',
      cantidad: 1
    }])
  }

  const addHerramientaFromCatalog = (catHerr: CatHerramienta) => {
    const nombreNuevo = `${catHerr.codigo ? `[${catHerr.codigo}] ` : ''}${catHerr.nombre}${catHerr.marca ? ` (${catHerr.marca})` : ''}${catHerr.centroCosto ? ` [CC: ${catHerr.centroCosto.codigo}]` : ''}`
    // Verificar si ya existe (case insensitive)
    const existingIndex = herramientas.findIndex(
      h => h.nombre.toLowerCase() === nombreNuevo.toLowerCase()
    )
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updated = [...herramientas]
      updated[existingIndex].cantidad += 1
      setHerramientas(updated)
    } else {
      setHerramientas([...herramientas, {
        id: `temp-${Date.now()}`,
        nombre: nombreNuevo,
        cantidad: 1
      }])
    }
  }

  const updateHerramienta = (index: number, field: string, value: any) => {
    const updated = [...herramientas]
    updated[index] = { ...updated[index], [field]: value }
    setHerramientas(updated)
  }

  const removeHerramienta = (index: number) => {
    setHerramientas(herramientas.filter((_, i) => i !== index))
  }

  // Tarea handlers
  const addTarea = () => {
    setTareas([...tareas, {
      id: `temp-${Date.now()}`,
      descripcion: '',
      cantidad: 1,
      estado: 'Pendiente',
      cumple: null
    }])
  }

  const addTareaFromCatalog = (catTar: CatTarea) => {
    const descripcionNueva = `${catTar.codigo ? `[${catTar.codigo}] ` : ''}${catTar.nombre}${catTar.centroCosto ? ` (CC: ${catTar.centroCosto.codigo})` : ''}`
    // Verificar si ya existe (case insensitive)
    const existingIndex = tareas.findIndex(
      t => t.descripcion.toLowerCase() === descripcionNueva.toLowerCase()
    )
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updated = [...tareas]
      updated[existingIndex].cantidad += 1
      setTareas(updated)
    } else {
      setTareas([...tareas, {
        id: `temp-${Date.now()}`,
        descripcion: descripcionNueva,
        cantidad: 1,
        estado: 'Pendiente',
        cumple: null
      }])
    }
  }

  const updateTarea = (index: number, field: string, value: any) => {
    const updated = [...tareas]
    updated[index] = { ...updated[index], [field]: value }
    setTareas(updated)
  }

  const removeTarea = (index: number) => {
    setTareas(tareas.filter((_, i) => i !== index))
  }

  // Personal handlers
  const addPersonalOT = () => {
    setPersonalOT([...personalOT, {
      id: `temp-${Date.now()}`,
      nombre: '',
      tipo: 'Interno',
      cantidad: 1,
      precioUnit: 0,
      horasTrabajadas: 0,
      total: 0,
      cumple: null
    }])
  }

  const addPersonalFromEmployee = (emp: Personal) => {
    const valorHora = Math.round(calcularValorHora(emp.sueldoBase))
    // Verificar si ya existe (case insensitive)
    const existingIndex = personalOT.findIndex(
      p => p.nombre.toLowerCase() === emp.nombre.toLowerCase()
    )
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updated = [...personalOT]
      updated[existingIndex].cantidad += 1
      updated[existingIndex].total = updated[existingIndex].precioUnit * updated[existingIndex].horasTrabajadas * updated[existingIndex].cantidad
      setPersonalOT(updated)
    } else {
      setPersonalOT([...personalOT, {
        id: `temp-${Date.now()}`,
        nombre: emp.nombre,
        tipo: 'Interno',
        cantidad: 1,
        precioUnit: valorHora,
        horasTrabajadas: 0,
        total: 0,
        cumple: null
      }])
    }
  }

  const updatePersonalOT = (index: number, field: string, value: any) => {
    const updated = [...personalOT]
    updated[index] = { ...updated[index], [field]: value }
    
    // Si selecciona personal interno, obtener valor hora del sueldo
    if (field === 'nombre' && updated[index].tipo === 'Interno') {
      const p = personal.find(per => per.nombre === value)
      if (p) {
        updated[index].precioUnit = Math.round(calcularValorHora(p.sueldoBase))
      }
    }
    
    // Calcular total
    updated[index].total = updated[index].precioUnit * updated[index].horasTrabajadas * updated[index].cantidad
    setPersonalOT(updated)
  }

  const removePersonalOT = (index: number) => {
    setPersonalOT(personalOT.filter((_, i) => i !== index))
  }

  // Calcular totales
  const totalMateriales = materiales.reduce((sum, m) => sum + (m.total || m.cantidad * m.precioUnit), 0)
  const totalPersonal = personalOT.reduce((sum, p) => sum + (p.total || p.precioUnit * p.horasTrabajadas * p.cantidad), 0)
  const granTotal = totalMateriales + totalPersonal
  
  // Calcular tiempo total estimado
  const tiempoEstimadoTareas = tareas.reduce((sum, t) => {
    const catTarea = catTareas.find(ct => ct.nombre === t.descripcion || ct.nombre === t.descripcion.replace(/^\[[^\]]+\]\s*/, '').replace(/\s*\(CC:.*\)$/, ''))
    return sum + (catTarea?.tiempoEstimado || 0) * t.cantidad
  }, 0)
  
  // Calcular diferencia de tiempo
  const diferenciaTiempo = formData.tiempoReal - (formData.tiempoEst || tiempoEstimadoTareas)

  const stats = {
    Pendiente: ordenes.filter(o => o.estado === 'Pendiente').length,
    'En Progreso': ordenes.filter(o => o.estado === 'En Progreso').length,
    'Pendiente Aprobación': ordenes.filter(o => o.estado === 'Pendiente Aprobación').length,
    Completado: ordenes.filter(o => o.estado === 'Completado').length,
    Cancelado: ordenes.filter(o => o.estado === 'Cancelado').length,
  }

  // Calcular progreso automático en tiempo real
  const calcularProgresoAutomatico = () => {
    const totalItems = tareas.length + materiales.length + herramientas.length + personalOT.length
    if (totalItems === 0) return 0
    const itemsCompletados = 
      tareas.filter(t => t.estado === 'Completado').length +
      materiales.filter(m => m.cantidad > 0).length +
      herramientas.filter(h => h.cantidad > 0).length +
      personalOT.filter(p => p.horasTrabajadas > 0).length
    return Math.round((itemsCompletados / totalItems) * 100)
  }
  const progresoCalculado = calcularProgresoAutomatico()
  const progresoFinal = Math.max(formData.progresoManual, progresoCalculado)

  // Función para aprobar OT
  const handleAprobarOT = async (otId: string) => {
    try {
      await fetch(`/api/ordenes-trabajo/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Completado' }),
      })
      fetchOrdenes(search)
      setDetailDialogOpen(false)
    } catch (error) {
      console.error('Error aprobando OT:', error)
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(stats).map(([estado, count]) => (
          <Card key={estado} className="p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">{estado}</div>
            <div className="text-xl font-bold text-[#0f2040]">{count}</div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar OT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={seedCatalogs} className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Cargar Catálogos
        </Button>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nueva OT
        </Button>
      </div>

      {/* Catalog status */}
      {catalogsLoaded && (
        <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded flex-wrap">
          <span><Building2 className="w-3 h-3 inline mr-1" />{centrosCosto.length} centros de costo</span>
          <span><Wrench className="w-3 h-3 inline mr-1" />{catHerramientas.length} herramientas</span>
          <span><CheckSquare className="w-3 h-3 inline mr-1" />{catTareas.length} tareas</span>
          <span><Package className="w-3 h-3 inline mr-1" />{catMateriales.length} materiales</span>
        </div>
      )}

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
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">N° OT</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Título</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Prioridad</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Centro Costo</th>
                  {isAdmin() && <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tiempo</th>}
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Costo Real</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Progreso</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin() ? 10 : 9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : ordenes.length === 0 ? (
                  <tr><td colSpan={isAdmin() ? 10 : 9} className="p-8 text-center text-slate-400">Sin órdenes de trabajo</td></tr>
                ) : (
                  ordenes.map((ot) => (
                    <tr key={ot.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => openDetailDialog(ot)}>
                      <td className="p-3 font-mono text-xs font-bold text-[#0f2040]">
                        {ot.otNum}
                        {ot.esRecurrente && <RefreshCw className="w-3 h-3 inline ml-1 text-blue-500" />}
                      </td>
                      <td className="p-3 font-semibold">{ot.titulo}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[ot.tipo] || 'bg-slate-100'}>{ot.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={prioridadColors[ot.prioridad] || 'bg-slate-100'}>{ot.prioridad}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[ot.estado] || 'bg-slate-100'}>{ot.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs font-mono">{ot.centroCosto?.codigo || '–'}</td>
                      {isAdmin() && (
                        <td className="p-3 text-xs">
                          <div className="flex flex-col">
                            <span>Est: {formatMinutes(ot.tiempoEst)}</span>
                            <span className={ot.tiempoReal > ot.tiempoEst ? 'text-red-600' : 'text-green-600'}>
                              Real: {formatMinutes(ot.tiempoReal)}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="p-3 font-mono text-xs font-bold text-red-600">{formatCLP(ot.costoReal)}</td>
                      <td className="p-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={ot.progreso} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-slate-500">{ot.progreso}%</span>
                        </div>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-slate-600 hover:text-slate-700" 
                            title="Descargar PDF"
                            onClick={() => {
                              window.open(`/api/pdf/orden-trabajo/${ot.id}`, '_blank')
                            }}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(ot)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingOT ? 'Editar' : 'Nueva'} Orden de Trabajo</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-5 w-full h-9">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="materiales" className="text-xs">Materiales</TabsTrigger>
              <TabsTrigger value="herramientas" className="text-xs">Herramientas</TabsTrigger>
              <TabsTrigger value="tareas" className="text-xs">Tareas</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
            </TabsList>
            
            <div className="py-4">
              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                {/* Sección: Información Básica */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">1</span>
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Título *</Label>
                      <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Título de la OT" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ubicación</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={formData.ubicacion === '__custom__' ? '__custom__' : formData.ubicacion} 
                          onValueChange={(v) => setFormData({...formData, ubicacion: v, ubicacionCustom: ''})}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Seleccionar ubicación..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin ubicación</SelectItem>
                            <SelectItem value="__custom__">+ Nueva ubicación...</SelectItem>
                            {ubicaciones.map(u => (
                              <SelectItem key={u.id} value={u.nombre}>{u.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.ubicacion === '__custom__' && (
                        <Input 
                          value={formData.ubicacionCustom} 
                          onChange={(e) => setFormData({...formData, ubicacionCustom: e.target.value})} 
                          placeholder="Nombre de la nueva ubicación" 
                          className="h-9 mt-1"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descripción</Label>
                    <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Descripción detallada..." rows={2} />
                  </div>
                </div>

                <Separator />

                {/* Sección: Clasificación */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">2</span>
                    Clasificación
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Correctivo', 'Preventivo', 'Mejora', 'Emergencia'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Prioridad</Label>
                      <Select value={formData.prioridad} onValueChange={(v) => setFormData({...formData, prioridad: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Urgente', 'Alta', 'Media', 'Baja'].map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Estado</Label>
                      <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Pendiente', 'En Progreso', 'Completado', 'Pendiente Aprobación', 'Cancelado'].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Progreso (%)</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={formData.progresoManual} 
                        onChange={(e) => setFormData({...formData, progresoManual: parseInt(e.target.value) || 0})} 
                        className="h-9" 
                      />
                      {progresoCalculado > 0 && (
                        <p className="text-[10px] text-blue-600">
                          Calculado: {progresoCalculado}% | Final: {progresoFinal}%
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Checkbox Solicitar Aprobación */}
                  {formData.estado === 'Completado' && (
                    <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <Checkbox 
                        id="solicitarAprobacion"
                        checked={formData.solicitarAprobacion}
                        onCheckedChange={(checked) => setFormData({...formData, solicitarAprobacion: checked as boolean})}
                      />
                      <label htmlFor="solicitarAprobacion" className="text-sm cursor-pointer flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Solicitar Aprobación (cambiará a "Pendiente Aprobación")
                      </label>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Sección: Centro de Costo */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">3</span>
                    <Building2 className="w-4 h-4" /> Centro de Costo e Imputación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Centro de Costo</Label>
                      <Select value={formData.centroCostoId} onValueChange={(v) => setFormData({...formData, centroCostoId: v})}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin centro de costo</SelectItem>
                          {centrosCosto.map(cc => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.codigo} - {cc.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.centroCostoId && formData.centroCostoId !== 'none' && (
                        <p className="text-[10px] text-slate-500">
                          Presupuesto: {formatCLP(centrosCosto.find(cc => cc.id === formData.centroCostoId)?.presupuestoMens || 0)}/mes
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Forma de Pago</Label>
                      <Select value={formData.formaPago} onValueChange={(v) => setFormData({...formData, formaPago: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gasto Común Mensual">Gasto Común Mensual</SelectItem>
                          <SelectItem value="Fondo de Reserva">Fondo de Reserva</SelectItem>
                          <SelectItem value="Gasto Extraordinario">Gasto Extraordinario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Recurrente */}
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Checkbox 
                      id="esRecurrente"
                      checked={formData.esRecurrente}
                      onCheckedChange={(checked) => setFormData({...formData, esRecurrente: checked as boolean})}
                    />
                    <label htmlFor="esRecurrente" className="text-sm cursor-pointer flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      Tarea Recurrente (generar automáticamente)
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Sección: Fechas */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">4</span>
                    <Calendar className="w-4 h-4" /> Fechas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Inicio Planificado</Label>
                      <DatePicker
                        date={formData.fechaInicio}
                        onDateChange={(d) => setFormData({...formData, fechaInicio: d || null})}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fecha Límite</Label>
                      <DatePicker
                        date={formData.fechaLimite}
                        onDateChange={(d) => setFormData({...formData, fechaLimite: d || null})}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Inicio Real</Label>
                      <DatePicker
                        date={formData.fechaInicioReal}
                        onDateChange={(d) => setFormData({...formData, fechaInicioReal: d || null})}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fin Real</Label>
                      <DatePicker
                        date={formData.fechaFinReal}
                        onDateChange={(d) => setFormData({...formData, fechaFinReal: d || null})}
                        placeholder="Seleccionar..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sección: Asignación */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                    <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">5</span>
                    <Users className="w-4 h-4" /> Asignación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Asignado a</Label>
                      <Select value={formData.asignadoId} onValueChange={(v) => setFormData({...formData, asignadoId: v})}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {personal.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} {p.sueldoBase > 0 ? `(${formatCLP(calcularValorHora(p.sueldoBase))}/hr)` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Propiedad</Label>
                      <Select value={formData.propiedadId} onValueChange={(v) => setFormData({...formData, propiedadId: v})}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Sin propiedad" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin propiedad</SelectItem>
                          {propiedades.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sección: Control de Tiempo - SOLO ADMIN */}
                {isAdmin() && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                        <span className="bg-[#0f2040] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">6</span>
                        <Clock className="w-4 h-4" /> Control de Tiempo
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tiempo Estimado (min)</Label>
                          <Input 
                            type="number" 
                            value={formData.tiempoEst || tiempoEstimadoTareas} 
                            onChange={(e) => setFormData({...formData, tiempoEst: parseInt(e.target.value) || 0})} 
                            className="h-9"
                          />
                          {tiempoEstimadoTareas > 0 && (
                            <p className="text-[10px] text-blue-600">De tareas: {formatMinutes(tiempoEstimadoTareas)}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tiempo Real (min)</Label>
                          <Input type="number" value={formData.tiempoReal} onChange={(e) => setFormData({...formData, tiempoReal: parseInt(e.target.value) || 0})} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Diferencia</Label>
                          <div className={`h-9 px-3 rounded border flex items-center text-sm font-semibold ${
                            diferenciaTiempo > 0 ? 'bg-red-50 border-red-200 text-red-700' : 
                            diferenciaTiempo < 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50'
                          }`}>
                            {diferenciaTiempo > 0 ? '+' : ''}{formatMinutes(diferenciaTiempo)}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Costo Estimado</Label>
                          <Input type="number" value={formData.costoEstimado} onChange={(e) => setFormData({...formData, costoEstimado: parseFloat(e.target.value) || 0})} className="h-9" />
                        </div>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Notas */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas adicionales</Label>
                  <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} placeholder="Notas u observaciones..." rows={2} />
                </div>
              </TabsContent>
              
              {/* Materials Tab */}
              <TabsContent value="materiales" className="space-y-4 mt-0">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">Materiales ({materiales.length})</h3>
                  <div className="flex gap-2">
                    {catMateriales.length > 0 && (
                      <Select onValueChange={(v) => {
                        const mat = catMateriales.find(m => m.id === v)
                        if (mat) addMaterialFromCatalog(mat)
                      }}>
                        <SelectTrigger className="w-[250px] h-8">
                          <SelectValue placeholder="Agregar del catálogo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {catMateriales.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.codigo ? `[${m.codigo}] ` : ''}{m.nombre} - {formatCLP(m.precioUnit)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={addMaterial}><Plus className="w-3.5 h-3.5 mr-1" /> Manual</Button>
                  </div>
                </div>
                
                {materiales.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border rounded-lg bg-slate-50">Sin materiales - seleccione del catálogo o agregue manualmente</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 text-xs">Descripción</th>
                          <th className="text-center p-2 w-20 text-xs">Cant.</th>
                          <th className="text-center p-2 w-24 text-xs">Unidad</th>
                          <th className="text-right p-2 w-28 text-xs">P. Unit.</th>
                          <th className="text-right p-2 w-28 text-xs">Total</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {materiales.map((m, i) => (
                          <tr key={m.id} className="border-t">
                            <td className="p-2">
                              <Input value={m.descripcion} onChange={(e) => updateMaterial(i, 'descripcion', e.target.value)} className="h-8" />
                            </td>
                            <td className="p-2">
                              <Input type="number" value={m.cantidad} onChange={(e) => updateMaterial(i, 'cantidad', parseFloat(e.target.value) || 0)} className="h-8 text-center" />
                            </td>
                            <td className="p-2">
                              <Select value={m.unidad} onValueChange={(v) => updateMaterial(i, 'unidad', v)}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['unidad', 'metro', 'm²', 'm³', 'kilo', 'saco', 'litro', 'galón', 'caja', 'bolsa'].map(u => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input type="number" value={m.precioUnit} onChange={(e) => updateMaterial(i, 'precioUnit', parseFloat(e.target.value) || 0)} className="h-8 text-right" />
                            </td>
                            <td className="p-2 text-right font-mono font-semibold">{formatCLP(m.total)}</td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => removeMaterial(i)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="flex justify-end font-semibold text-sm">
                  Total Materiales: <span className="ml-2 text-red-600">{formatCLP(totalMateriales)}</span>
                </div>
              </TabsContent>
              
              {/* Tools Tab */}
              <TabsContent value="herramientas" className="space-y-4 mt-0">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">Herramientas ({herramientas.length})</h3>
                  <div className="flex gap-2">
                    {catHerramientas.length > 0 && (
                      <Select onValueChange={(v) => {
                        const herr = catHerramientas.find(h => h.id === v)
                        if (herr) addHerramientaFromCatalog(herr)
                      }}>
                        <SelectTrigger className="w-[250px] h-8">
                          <SelectValue placeholder="Agregar del catálogo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {catHerramientas.map(h => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.codigo ? `[${h.codigo}] ` : ''}{h.nombre} ({h.estado})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={addHerramienta}><Plus className="w-3.5 h-3.5 mr-1" /> Manual</Button>
                  </div>
                </div>
                
                {herramientas.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border rounded-lg bg-slate-50">Sin herramientas - seleccione del catálogo o agregue manualmente</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 text-xs">Herramienta</th>
                          <th className="text-center p-2 w-20 text-xs">Cantidad</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {herramientas.map((h, i) => (
                          <tr key={h.id} className="border-t">
                            <td className="p-2">
                              <Input value={h.nombre} onChange={(e) => updateHerramienta(i, 'nombre', e.target.value)} className="h-8" placeholder="Nombre de herramienta" />
                            </td>
                            <td className="p-2">
                              <Input type="number" value={h.cantidad} onChange={(e) => updateHerramienta(i, 'cantidad', parseInt(e.target.value) || 1)} className="h-8 text-center" />
                            </td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => removeHerramienta(i)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              
              {/* Tasks Tab */}
              <TabsContent value="tareas" className="space-y-4 mt-0">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">Tareas ({tareas.length})</h3>
                  <div className="flex gap-2">
                    {catTareas.length > 0 && (
                      <Select onValueChange={(v) => {
                        const tar = catTareas.find(t => t.id === v)
                        if (tar) addTareaFromCatalog(tar)
                      }}>
                        <SelectTrigger className="w-[280px] h-8">
                          <SelectValue placeholder="Agregar del catálogo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {catTareas.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.codigo ? `[${t.codigo}] ` : ''}{t.nombre} ({t.frecuencia || t.tipoMantencion})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={addTarea}><Plus className="w-3.5 h-3.5 mr-1" /> Manual</Button>
                  </div>
                </div>
                
                {tareas.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border rounded-lg bg-slate-50">Sin tareas - seleccione del catálogo o agregue manualmente</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 text-xs">Tarea</th>
                          <th className="text-center p-2 w-20 text-xs">Cant.</th>
                          <th className="text-center p-2 w-28 text-xs">Estado</th>
                          <th className="text-center p-2 w-16 text-xs">Cumple</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tareas.map((t, i) => (
                          <tr key={t.id} className="border-t">
                            <td className="p-2">
                              <Input value={t.descripcion} onChange={(e) => updateTarea(i, 'descripcion', e.target.value)} className="h-8" />
                            </td>
                            <td className="p-2">
                              <Input type="number" value={t.cantidad} onChange={(e) => updateTarea(i, 'cantidad', parseInt(e.target.value) || 1)} className="h-8 text-center" />
                            </td>
                            <td className="p-2">
                              <Select value={t.estado} onValueChange={(v) => updateTarea(i, 'estado', v)}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['Pendiente', 'En Progreso', 'Completado'].map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 text-center">
                              <Checkbox 
                                checked={t.cumple === true} 
                                onCheckedChange={(checked) => updateTarea(i, 'cumple', checked ? true : null)}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => removeTarea(i)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {tiempoEstimadoTareas > 0 && (
                  <div className="bg-slate-50 p-3 rounded text-sm">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Tiempo total estimado de tareas: <strong>{formatMinutes(tiempoEstimadoTareas)}</strong>
                  </div>
                )}
              </TabsContent>
              
              {/* Personnel Tab */}
              <TabsContent value="personal" className="space-y-4 mt-0">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">Personal ({personalOT.length})</h3>
                  <div className="flex gap-2">
                    {personal.length > 0 && (
                      <Select onValueChange={(v) => {
                        const emp = personal.find(p => p.id === v)
                        if (emp) addPersonalFromEmployee(emp)
                      }}>
                        <SelectTrigger className="w-[200px] h-8">
                          <SelectValue placeholder="Agregar empleado..." />
                        </SelectTrigger>
                        <SelectContent>
                          {personal.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} - {formatCLP(calcularValorHora(p.sueldoBase))}/hr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={addPersonalOT}><Plus className="w-3.5 h-3.5 mr-1" /> Externo</Button>
                  </div>
                </div>
                
                {personalOT.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border rounded-lg bg-slate-50">Sin personal asignado - seleccione un empleado o agregue personal externo</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 text-xs">Nombre</th>
                          <th className="text-center p-2 w-20 text-xs">Tipo</th>
                          <th className="text-center p-2 w-16 text-xs">Cant.</th>
                          <th className="text-right p-2 w-24 text-xs">$ Hora</th>
                          <th className="text-right p-2 w-16 text-xs">Hrs</th>
                          <th className="text-right p-2 w-24 text-xs">Total</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {personalOT.map((p, i) => (
                          <tr key={p.id} className="border-t">
                            <td className="p-2">
                              <Input 
                                value={p.nombre} 
                                onChange={(e) => updatePersonalOT(i, 'nombre', e.target.value)} 
                                className="h-8" 
                                placeholder="Nombre"
                              />
                            </td>
                            <td className="p-2">
                              <Select value={p.tipo} onValueChange={(v) => updatePersonalOT(i, 'tipo', v)}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Interno">Interno</SelectItem>
                                  <SelectItem value="Externo">Externo</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input type="number" value={p.cantidad} onChange={(e) => updatePersonalOT(i, 'cantidad', parseInt(e.target.value) || 1)} className="h-8 text-center" />
                            </td>
                            <td className="p-2">
                              <Input type="number" value={p.precioUnit} onChange={(e) => updatePersonalOT(i, 'precioUnit', parseFloat(e.target.value) || 0)} className="h-8 text-right" />
                            </td>
                            <td className="p-2">
                              <Input type="number" step="0.5" value={p.horasTrabajadas} onChange={(e) => updatePersonalOT(i, 'horasTrabajadas', parseFloat(e.target.value) || 0)} className="h-8 text-right" />
                            </td>
                            <td className="p-2 text-right font-mono font-semibold">{formatCLP(p.total)}</td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => removePersonalOT(i)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="flex justify-end font-semibold text-sm">
                  Total Mano de Obra: <span className="ml-2 text-red-600">{formatCLP(totalPersonal)}</span>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="flex justify-between border-t pt-4">
            <div className="text-lg font-bold flex items-center gap-4">
              <span>Total OT: <span className="text-red-600">{formatCLP(granTotal)}</span></span>
              <span className="text-xs font-normal text-slate-500">
                (Materiales: {formatCLP(totalMateriales)} + Personal: {formatCLP(totalPersonal)})
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar OT</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOT && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {selectedOT.otNum} - {selectedOT.titulo}
                  <Badge className={estadoColors[selectedOT.estado]}>{selectedOT.estado}</Badge>
                  {selectedOT.esRecurrente && (
                    <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Recurrente
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* General info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-slate-500 text-xs">Tipo:</span> <Badge className={tipoColors[selectedOT.tipo]}>{selectedOT.tipo}</Badge></div>
                  <div><span className="text-slate-500 text-xs">Prioridad:</span> <Badge className={prioridadColors[selectedOT.prioridad]}>{selectedOT.prioridad}</Badge></div>
                  <div><span className="text-slate-500 text-xs">Progreso:</span> {selectedOT.progreso}%</div>
                  <div><span className="text-slate-500 text-xs">Ubicación:</span> {selectedOT.ubicacion || selectedOT.propiedad?.nombre || '–'}</div>
                  <div><span className="text-slate-500 text-xs">Centro Costo:</span> {selectedOT.centroCosto?.codigo || '–'}</div>
                  <div><span className="text-slate-500 text-xs">Forma de Pago:</span> {selectedOT.formaPago || '–'}</div>
                </div>
                
                {/* Time tracking - SOLO ADMIN */}
                {isAdmin() && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Control de Tiempo
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">Estimado:</span>
                        <span className="ml-2 font-semibold">{formatMinutes(selectedOT.tiempoEst)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Real:</span>
                        <span className="ml-2 font-semibold">{formatMinutes(selectedOT.tiempoReal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Diferencia:</span>
                        <span className={`ml-2 font-semibold ${selectedOT.tiempoReal - selectedOT.tiempoEst > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedOT.tiempoReal - selectedOT.tiempoEst > 0 ? '+' : ''}{formatMinutes(selectedOT.tiempoReal - selectedOT.tiempoEst)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Botón Aprobar OT - Solo supervisores/admin cuando estado es "Pendiente Aprobación" */}
                {selectedOT.estado === 'Pendiente Aprobación' && isSupervisor() && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">Esta OT está pendiente de aprobación</span>
                      </div>
                      <Button 
                        onClick={() => handleAprobarOT(selectedOT.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar OT
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedOT.descripcion && (
                  <div className="text-sm">
                    <span className="text-slate-500 text-xs">Descripción:</span>
                    <p className="mt-1">{selectedOT.descripcion}</p>
                  </div>
                )}
                
                {/* Materials */}
                {selectedOT.materiales.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Materiales ({selectedOT.materiales.length})
                    </h4>
                    <table className="w-full text-xs border">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Descripción</th>
                          <th className="text-center p-2">Cant.</th>
                          <th className="text-center p-2">Unidad</th>
                          <th className="text-right p-2">P. Unit.</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOT.materiales.map(m => (
                          <tr key={m.id} className="border-t">
                            <td className="p-2">{m.descripcion}</td>
                            <td className="p-2 text-center">{m.cantidad}</td>
                            <td className="p-2 text-center">{m.unidad}</td>
                            <td className="p-2 text-right">{formatCLP(m.precioUnit)}</td>
                            <td className="p-2 text-right font-semibold">{formatCLP(m.total || m.cantidad * m.precioUnit)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50">
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-semibold">Total Materiales:</td>
                          <td className="p-2 text-right font-bold text-red-600">
                            {formatCLP(selectedOT.materiales.reduce((sum, m) => sum + (m.total || m.cantidad * m.precioUnit), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                
                {/* Tools */}
                {selectedOT.herramientas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" /> Herramientas ({selectedOT.herramientas.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOT.herramientas.map(h => (
                        <Badge key={h.id} variant="outline">{h.nombre} ({h.cantidad})</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tasks */}
                {selectedOT.tareas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" /> Tareas ({selectedOT.tareas.length})
                    </h4>
                    <table className="w-full text-xs border">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Tarea</th>
                          <th className="text-center p-2 w-16">Cant.</th>
                          <th className="text-center p-2 w-24">Estado</th>
                          <th className="text-center p-2 w-16">Cumple</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOT.tareas.map(t => (
                          <tr key={t.id} className="border-t">
                            <td className="p-2">{t.descripcion}</td>
                            <td className="p-2 text-center">{t.cantidad}</td>
                            <td className="p-2 text-center">
                              <Badge className={t.estado === 'Completado' ? 'bg-green-100 text-green-700' : t.estado === 'En Progreso' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                                {t.estado}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              {t.cumple !== null ? (t.cumple ? '✓' : '✗') : '–'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Personnel */}
                {selectedOT.personalOT.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Personal ({selectedOT.personalOT.length})
                    </h4>
                    <table className="w-full text-xs border">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Nombre</th>
                          <th className="text-center p-2">Tipo</th>
                          <th className="text-center p-2">Cant.</th>
                          <th className="text-right p-2">$ Hora</th>
                          <th className="text-right p-2">Horas</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOT.personalOT.map(p => (
                          <tr key={p.id} className="border-t">
                            <td className="p-2">{p.nombre}</td>
                            <td className="p-2 text-center">{p.tipo}</td>
                            <td className="p-2 text-center">{p.cantidad}</td>
                            <td className="p-2 text-right">{formatCLP(p.precioUnit)}</td>
                            <td className="p-2 text-right">{p.horasTrabajadas || 0}</td>
                            <td className="p-2 text-right font-semibold">{formatCLP(p.total || p.precioUnit * p.horasTrabajadas * p.cantidad)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50">
                        <tr>
                          <td colSpan={5} className="p-2 text-right font-semibold">Total Mano de Obra:</td>
                          <td className="p-2 text-right font-bold text-red-600">
                            {formatCLP(selectedOT.personalOT.reduce((sum, p) => sum + (p.total || p.precioUnit * p.horasTrabajadas * p.cantidad), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                
                {/* Total */}
                <div className="bg-red-50 p-4 rounded-lg text-right">
                  <span className="text-lg font-bold">TOTAL OT: </span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCLP(selectedOT.costoReal || 
                      selectedOT.materiales.reduce((sum, m) => sum + (m.total || m.cantidad * m.precioUnit), 0) +
                      selectedOT.personalOT.reduce((sum, p) => sum + (p.total || p.precioUnit * p.horasTrabajadas * p.cantidad), 0)
                    )}
                  </span>
                </div>
                
                {selectedOT.notas && (
                  <div className="text-sm bg-slate-50 p-3 rounded">
                    <span className="text-slate-500 font-semibold text-xs">Notas:</span>
                    <p className="mt-1">{selectedOT.notas}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
                <Button variant="outline" onClick={() => window.open(`/api/pdf/orden-trabajo/${selectedOT.id}`, '_blank')}>
                  <Printer className="w-4 h-4 mr-1" /> PDF
                </Button>
                <Button onClick={() => { setDetailDialogOpen(false); openDialog(selectedOT); }}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
