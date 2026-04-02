
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Plus, Pencil, Trash2, Search, FileText, Shield, AlertTriangle,
  CheckCircle, Clock, Upload, Download, Eye, Building2,
  FileCheck, FileWarning, FileX, RefreshCw, Info, Calendar, Loader2
} from 'lucide-react'
import { useAppStore, type CondominioInfo } from '@/lib/store'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

// ============================================
// INTERFACES
// ============================================
interface CategoriaCumplimiento {
  id: string
  nombre: string
  codigo: string | null
  descripcion: string | null
  tipo: string
  obligatorio: boolean
  articuloLey: string | null
  fechaLimiteDias: number | null
  orden: number
  documentos?: DocumentoCumplimiento[]
  _count?: { documentos: number }
}

interface DocumentoCumplimiento {
  id: string
  titulo: string
  descripcion: string | null
  archivoNombre: string | null
  archivoTipo: string | null
  archivoBase64: string | null
  archivoUrl: string | null
  fechaDocumento: string | null
  fechaVencimiento: string | null
  estado: string
  cumple: boolean
  porcentajeCumplimiento: number
  verificadoPor: string | null
  observaciones: string | null
  categoria: CategoriaCumplimiento | null
  categoriaId: string | null
  createdAt: string
}

interface ResumenCumplimiento {
  totalRequisitos: number
  requisitosCumplidos: number
  requisitosPendientes: number
  requisitosVencidos: number
  porcentajeGeneral: number
  porcentajeLegal: number
  porcentajeReglamentario: number
  porcentajeInterno: number
  porcentajeSeguridad: number
  alertasActivas: number
}

// ============================================
// CONSTANTS
// ============================================
const TIPOS_CATEGORIA = ['Legal', 'Reglamentario', 'Interno', 'Seguridad'] as const

const tipoColors: Record<string, string> = {
  'Legal': 'bg-rose-100 text-rose-700 border-rose-200',
  'Reglamentario': 'bg-blue-100 text-blue-700 border-blue-200',
  'Interno': 'bg-slate-100 text-slate-700 border-slate-200',
  'Seguridad': 'bg-amber-100 text-amber-700 border-amber-200',
}

const tipoIcons: Record<string, React.ReactNode> = {
  'Legal': <Building2 className="w-3 h-3" />,
  'Reglamentario': <FileText className="w-3 h-3" />,
  'Interno': <FileCheck className="w-3 h-3" />,
  'Seguridad': <Shield className="w-3 h-3" />,
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-slate-100 text-slate-700',
  'Aprobado': 'bg-green-100 text-green-700',
  'Rechazado': 'bg-red-100 text-red-700',
  'Vencido': 'bg-amber-100 text-amber-700',
  'En Revisión': 'bg-blue-100 text-blue-700',
}

const estadoIcons: Record<string, React.ReactNode> = {
  'Pendiente': <Clock className="w-3 h-3" />,
  'Aprobado': <CheckCircle className="w-3 h-3" />,
  'Rechazado': <FileX className="w-3 h-3" />,
  'Vencido': <FileWarning className="w-3 h-3" />,
  'En Revisión': <Eye className="w-3 h-3" />,
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

const getDaysUntilExpiry = (fechaVencimiento: string | null) => {
  if (!fechaVencimiento) return null
  const hoy = new Date()
  const vencimiento = new Date(fechaVencimiento)
  const diff = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function CumplimientoModule() {
  const { currentCondominio, setCurrentCondominio } = useAppStore()
  
  // ============================================
  // STATE
  // ============================================
  const [condominios, setCondominios] = useState<CondominioInfo[]>([])
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [categorias, setCategorias] = useState<CategoriaCumplimiento[]>([])
  const [documentos, setDocumentos] = useState<DocumentoCumplimiento[]>([])
  const [resumen, setResumen] = useState<ResumenCumplimiento | null>(null)
  const [documentosProximosVencer, setDocumentosProximosVencer] = useState<DocumentoCumplimiento[]>([])
  const [documentosVencidos, setDocumentosVencidos] = useState<DocumentoCumplimiento[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  
  // Dialogs
  const [documentoDialogOpen, setDocumentoDialogOpen] = useState(false)
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false)
  const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false)
  const [editingDocumento, setEditingDocumento] = useState<DocumentoCumplimiento | null>(null)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaCumplimiento | null>(null)
  const [viewingDocumento, setViewingDocumento] = useState<DocumentoCumplimiento | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<'documento' | 'categoria'>('documento')
  const [deleteId, setDeleteId] = useState<string>('')
  
  // Form data
  const [documentoForm, setDocumentoForm] = useState({
    titulo: '',
    descripcion: '',
    categoriaId: '',
    fechaDocumento: '',
    fechaVencimiento: '',
    estado: 'Pendiente',
    observaciones: '',
    archivoNombre: '',
    archivoTipo: '',
    archivoBase64: '',
  })
  
  const [categoriaForm, setCategoriaForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipo: 'Legal',
    obligatorio: true,
    articuloLey: '',
    fechaLimiteDias: '',
    orden: 0,
  })

  // Import states
  const [importDocumentoDialogOpen, setImportDocumentoDialogOpen] = useState(false)
  const [importCategoriaDialogOpen, setImportCategoriaDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Export configuration for Documentos
  const exportColumnsDocumentos: ColumnConfig[] = useMemo(() => [
    { key: 'titulo', label: 'Título', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'categoria.nombre', label: 'Categoría', defaultVisible: true },
    { key: 'fechaDocumento', label: 'Fecha Documento', defaultVisible: true },
    { key: 'fechaVencimiento', label: 'Fecha Vencimiento', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'cumple', label: 'Cumple', defaultVisible: true },
    { key: 'porcentajeCumplimiento', label: '% Cumplimiento', defaultVisible: true },
    { key: 'verificadoPor', label: 'Verificado Por', defaultVisible: false },
    { key: 'observaciones', label: 'Observaciones', defaultVisible: false },
    { key: 'archivoNombre', label: 'Nombre Archivo', defaultVisible: false },
    { key: 'archivoUrl', label: 'URL Archivo', defaultVisible: false },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: false },
  ], [])

  const exportFiltersDocumentos: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: Object.keys(estadoColors) },
    { key: 'categoriaId', label: 'Categoría', type: 'select', options: categorias.map(cat => ({ value: cat.id, label: cat.nombre })) },
  ], [categorias])

  const { ExportButton: ExportDocumentosButton } = useExport({
    moduleName: 'cumplimiento/documentos',
    moduleLabel: 'Documentos de Cumplimiento',
    columns: exportColumnsDocumentos,
    filters: exportFiltersDocumentos,
    getData: () => documentos
  })

  // Export configuration for Categorias
  const exportColumnsCategorias: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'codigo', label: 'Código', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'obligatorio', label: 'Obligatorio', defaultVisible: true },
    { key: 'articuloLey', label: 'Artículo Ley', defaultVisible: true },
    { key: 'fechaLimiteDias', label: 'Días Límite', defaultVisible: true },
    { key: 'orden', label: 'Orden', defaultVisible: true },
  ], [])

  const exportFiltersCategorias: FilterField[] = useMemo(() => [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_CATEGORIA.map(t => t) },
    { key: 'obligatorio', label: 'Obligatorio', type: 'boolean' },
  ], [])

  const { ExportButton: ExportCategoriasButton } = useExport({
    moduleName: 'cumplimiento/categorias',
    moduleLabel: 'Categorías de Cumplimiento',
    columns: exportColumnsCategorias,
    filters: exportFiltersCategorias,
    getData: () => categorias
  })

  // ============================================
  // FETCH FUNCTIONS
  // ============================================
  const fetchData = async () => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    
    try {
      // Fetch categories with createDefaults=true to populate initial categories
      const catRes = await fetch(`/api/cumplimiento/categorias?condominioId=${currentCondominio.id}&createDefaults=true`)
      const catData = await catRes.json()
      // Asegurar que categorias sea siempre un array
      setCategorias(Array.isArray(catData) ? catData : [])
      
      // Fetch documents
      const params = new URLSearchParams()
      params.append('condominioId', currentCondominio.id)
      if (search) params.append('search', search)
      if (filterTipo !== 'todos') params.append('tipo', filterTipo)
      if (filterEstado !== 'todos') params.append('estado', filterEstado)
      if (filterCategoria !== 'todos') params.append('categoriaId', filterCategoria)
      
      const docRes = await fetch(`/api/cumplimiento?${params.toString()}`)
      const docData = await docRes.json()
      setDocumentos(Array.isArray(docData?.documentos) ? docData.documentos : [])
      setResumen(docData?.resumen || null)
      
      // Fetch summary
      const resumenRes = await fetch(`/api/cumplimiento/resumen?condominioId=${currentCondominio.id}`)
      const resumenData = await resumenRes.json()
      setDocumentosProximosVencer(Array.isArray(resumenData?.documentosProximosVencer) ? resumenData.documentosProximosVencer : [])
      setDocumentosVencidos(Array.isArray(resumenData?.documentosVencidos) ? resumenData.documentosVencidos : [])
    } catch (error) {
      console.error('Error fetching cumplimiento data:', error)
      toast.error('Error al cargar los datos de cumplimiento.')
      // Asegurar que los arrays estén vacíos en caso de error
      setCategorias([])
      setDocumentos([])
      setDocumentosProximosVencer([])
      setDocumentosVencidos([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch condominios on mount
  useEffect(() => {
    const fetchCondominios = async () => {
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
        toast.error('Error al cargar los condominios.')
      } finally {
        setLoadingCondominios(false)
      }
    }
    fetchCondominios()
  }, [currentCondominio, setCurrentCondominio])

  useEffect(() => {
    if (!loadingCondominios) {
      void (async () => {
        await fetchData()
      })()
    }
  }, [currentCondominio, loadingCondominios])

  useEffect(() => {
    const timeout = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timeout)
  }, [search, filterTipo, filterEstado, filterCategoria])

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const documentosByCategoria = useMemo(() => {
    const grouped: Record<string, DocumentoCumplimiento[]> = {}
    categorias.forEach(cat => {
      grouped[cat.id] = documentos.filter(doc => doc.categoriaId === cat.id)
    })
    return grouped
  }, [categorias, documentos])

  // ============================================
  // HANDLERS - DOCUMENTOS
  // ============================================
  const openDocumentoDialog = (doc?: DocumentoCumplimiento) => {
    if (doc) {
      setEditingDocumento(doc)
      setDocumentoForm({
        titulo: doc.titulo,
        descripcion: doc.descripcion || '',
        categoriaId: doc.categoriaId || '',
        fechaDocumento: doc.fechaDocumento || '',
        fechaVencimiento: doc.fechaVencimiento || '',
        estado: doc.estado,
        observaciones: doc.observaciones || '',
        archivoNombre: doc.archivoNombre || '',
        archivoTipo: doc.archivoTipo || '',
        archivoBase64: doc.archivoBase64 || '',
      })
    } else {
      setEditingDocumento(null)
      setDocumentoForm({
        titulo: '',
        descripcion: '',
        categoriaId: categorias.length > 0 ? categorias[0].id : '',
        fechaDocumento: new Date().toISOString().split('T')[0],
        fechaVencimiento: '',
        estado: 'Pendiente',
        observaciones: '',
        archivoNombre: '',
        archivoTipo: '',
        archivoBase64: '',
      })
    }
    setDocumentoDialogOpen(true)
  }

  const handleDocumentoSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar el documento.')
      return
    }
    if (!documentoForm.titulo.trim() || !documentoForm.categoriaId) {
      toast.error('El título y la categoría son obligatorios.')
      return
    }

    try {
      const payload = {
        ...documentoForm,
        condominioId: currentCondominio.id,
        fechaVencimiento: documentoForm.fechaVencimiento || null, // Allow null
      }

      if (editingDocumento) {
        await fetch(`/api/cumplimiento/${editingDocumento.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Documento de cumplimiento actualizado con éxito.')
      } else {
        await fetch('/api/cumplimiento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Documento de cumplimiento creado con éxito.')
      }
      setDocumentoDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving documento:', error)
      toast.error('Error al guardar el documento de cumplimiento.')
    }
  }

  const handleDocumentoDelete = async (id: string) => {
    try {
      await fetch(`/api/cumplimiento/${id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      fetchData()
      toast.success('Documento de cumplimiento eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting documento:', error)
      toast.error('Error al eliminar el documento de cumplimiento.')
    }
  }

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setDocumentoForm(prev => ({
          ...prev,
          archivoNombre: file.name,
          archivoTipo: file.type,
          archivoBase64: base64.split(',')[1], // Remove data:image/png;base64,
        }))
        toast.info(`Archivo ${file.name} cargado para el documento.`)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileRemove = () => {
    setDocumentoForm(prev => ({
      ...prev,
      archivoNombre: '',
      archivoTipo: '',
      archivoBase64: '',
    }))
    toast.info('Archivo removido del documento.')
  }

  const viewFile = (doc: DocumentoCumplimiento) => {
    setViewingDocumento(doc)
    setViewFileDialogOpen(true)
  }

  // ============================================
  // HANDLERS - CATEGORIAS
  // ============================================
  const openCategoriaDialog = (cat?: CategoriaCumplimiento) => {
    if (cat) {
      setEditingCategoria(cat)
      setCategoriaForm({
        nombre: cat.nombre,
        codigo: cat.codigo || '',
        descripcion: cat.descripcion || '',
        tipo: cat.tipo,
        obligatorio: cat.obligatorio,
        articuloLey: cat.articuloLey || '',
        fechaLimiteDias: cat.fechaLimiteDias?.toString() || '',
        orden: cat.orden,
      })
    } else {
      setEditingCategoria(null)
      setCategoriaForm({
        nombre: '',
        codigo: '',
        descripcion: '',
        tipo: 'Legal',
        obligatorio: true,
        articuloLey: '',
        fechaLimiteDias: '',
        orden: categorias.length > 0 ? Math.max(...categorias.map(c => c.orden)) + 1 : 1,
      })
    }
    setCategoriaDialogOpen(true)
  }

  const handleCategoriaSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar la categoría.')
      return
    }
    if (!categoriaForm.nombre.trim() || !categoriaForm.tipo) {
      toast.error('El nombre y el tipo de categoría son obligatorios.')
      return
    }

    try {
      const payload = {
        ...categoriaForm,
        condominioId: currentCondominio.id,
        fechaLimiteDias: categoriaForm.fechaLimiteDias ? Number(categoriaForm.fechaLimiteDias) : null,
      }

      if (editingCategoria) {
        await fetch(`/api/cumplimiento/categorias/${editingCategoria.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Categoría de cumplimiento actualizada con éxito.')
      } else {
        await fetch('/api/cumplimiento/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Categoría de cumplimiento creada con éxito.')
      }
      setCategoriaDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving categoria:', error)
      toast.error('Error al guardar la categoría de cumplimiento.')
    }
  }

  const handleCategoriaDelete = async (id: string) => {
    try {
      await fetch(`/api/cumplimiento/categorias/${id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      fetchData()
      toast.success('Categoría de cumplimiento eliminada con éxito.')
    } catch (error) {
      console.error('Error deleting categoria:', error)
      toast.error('Error al eliminar la categoría de cumplimiento.')
    }
  }

  // ============================================
  // HANDLERS - MASS IMPORT
  // ============================================
  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  const handleMassImportDocumentos = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar documentos.')
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
          categoriaId: categorias.find(cat => cat.nombre === item.Categoria)?.id || '', // Map category name to ID
          fechaDocumento: item['Fecha Documento'] ? new Date(item['Fecha Documento']).toISOString().split('T')[0] : null,
          fechaVencimiento: item['Fecha Vencimiento'] ? new Date(item['Fecha Vencimiento']).toISOString().split('T')[0] : null,
          estado: item.Estado || 'Pendiente',
          cumple: item.Cumple === 'TRUE',
          porcentajeCumplimiento: Number(item['% Cumplimiento']) || 0,
          verificadoPor: item['Verificado Por'] || null,
          observaciones: item.Observaciones || null,
          archivoNombre: item['Nombre Archivo'] || null,
          archivoUrl: item['URL Archivo'] || null,
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/cumplimiento/documentos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Documentos de cumplimiento importados con éxito.')
        setImportDocumentoDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import documents:', error)
      toast.error('Error al importar documentos de cumplimiento. Verifica el formato del archivo y que las categorías existan.')
    } finally {
      setImportLoading(false)
    }
  }

  const handleMassImportCategorias = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar categorías.')
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
          codigo: item.Codigo || null,
          descripcion: item.Descripcion || null,
          tipo: item.Tipo || 'Legal',
          obligatorio: item.Obligatorio === 'TRUE',
          articuloLey: item['Artículo Ley'] || null,
          fechaLimiteDias: Number(item['Días Límite']) || null,
          orden: Number(item.Orden) || 0,
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/cumplimiento/categorias/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Categorías de cumplimiento importadas con éxito.')
        setImportCategoriaDialogOpen(false)
        setImportFile(null)
        fetchData()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import categories:', error)
      toast.error('Error al importar categorías de cumplimiento. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading || loadingCondominios) {
    return <div className="p-8 text-center text-slate-400">Cargando cumplimiento...</div>
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar el cumplimiento.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Shield className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Gestión de Cumplimiento</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openDocumentoDialog()}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Documento
          </Button>
          <Button variant="outline" onClick={() => openCategoriaDialog()}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Resumen de Cumplimiento */}
      {resumen && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Resumen General de Cumplimiento</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-900">{resumen.totalRequisitos}</p>
                <p className="text-xs text-blue-700">Total Requisitos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{resumen.requisitosCumplidos}</p>
                <p className="text-xs text-green-600">Requisitos Cumplidos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{resumen.requisitosPendientes}</p>
                <p className="text-xs text-amber-600">Requisitos Pendientes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{resumen.requisitosVencidos}</p>
                <p className="text-xs text-red-600">Requisitos Vencidos</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progreso General</span>
                <span>{resumen.porcentajeGeneral.toFixed(1)}%</span>
              </div>
              <Progress value={resumen.porcentajeGeneral} className="h-2" indicatorColor="bg-blue-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para Documentos y Categorías */}
      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        {/* Tab de Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.keys(estadoColors).map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <ExportDocumentosButton />
            <Button variant="outline" onClick={() => setImportDocumentoDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
          </div>

          {categorias.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No hay categorías de cumplimiento definidas. Por favor, crea una categoría primero.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {categorias.map(categoria => (
                <Card key={categoria.id} className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Badge variant="outline" className={`${tipoColors[categoria.tipo]} flex items-center gap-1`}>
                        {tipoIcons[categoria.tipo]} {categoria.tipo}
                      </Badge>
                      {categoria.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openCategoriaDialog(categoria)} title="Editar Categoría">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteType('categoria'); setDeleteId(categoria.id); setDeleteDialogOpen(true); }} title="Eliminar Categoría">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-500 line-clamp-2">{categoria.descripcion || 'Sin descripción.'}</p>
                    <div className="text-xs text-slate-600">
                      {categoria.codigo && <span>Código: {categoria.codigo} | </span>}
                      {categoria.articuloLey && <span>Artículo: {categoria.articuloLey} | </span>}
                      <span>Obligatorio: {categoria.obligatorio ? 'Sí' : 'No'}</span>
                    </div>
                    <h4 className="text-sm font-semibold mt-4">Documentos ({documentosByCategoria[categoria.id]?.length || 0})</h4>
                    <ScrollArea className="h-[200px] pr-4">
                      {documentosByCategoria[categoria.id]?.length === 0 ? (
                        <p className="text-sm text-slate-400">No hay documentos para esta categoría.</p>
                      ) : (
                        documentosByCategoria[categoria.id]?.map(doc => {
                          const daysLeft = getDaysUntilExpiry(doc.fechaVencimiento)
                          const estadoDocColor = estadoColors[doc.estado] || 'bg-gray-100 text-gray-700'
                          const estadoDocIcon = estadoIcons[doc.estado] || <Clock className="w-3 h-3" />
                          return (
                            <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{doc.titulo}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Badge variant="outline" className={`${estadoDocColor} flex items-center gap-1`}>
                                    {estadoDocIcon} {doc.estado}
                                  </Badge>
                                  {doc.fechaVencimiento && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Vence: {formatDate(doc.fechaVencimiento)}
                                      {daysLeft !== null && (
                                        <span className={`ml-1 ${daysLeft <= 7 && daysLeft >= 0 ? 'text-amber-500' : daysLeft < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          ({daysLeft} días)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {doc.archivoUrl && (
                                  <Button variant="ghost" size="sm" onClick={() => viewFile(doc)} title="Ver Archivo">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => openDocumentoDialog(doc)} title="Editar Documento">
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setDeleteType('documento'); setDeleteId(doc.id); setDeleteDialogOpen(true); }} title="Eliminar Documento">
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab de Categorías */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_CATEGORIA.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
              </SelectContent>
            </Select>
            <ExportCategoriasButton />
            <Button variant="outline" onClick={() => setImportCategoriaDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Nombre</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Código</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Tipo</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Obligatorio</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Art. Ley</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Días Límite</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-center">Documentos</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">No hay categorías de cumplimiento.</TableCell></TableRow>
                  ) : (
                    categorias.map(categoria => (
                      <TableRow key={categoria.id}>
                        <TableCell className="font-medium">{categoria.nombre}</TableCell>
                        <TableCell>{categoria.codigo || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${tipoColors[categoria.tipo]} flex items-center gap-1`}>
                            {tipoIcons[categoria.tipo]} {categoria.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{categoria.obligatorio ? 'Sí' : 'No'}</TableCell>
                        <TableCell>{categoria.articuloLey || 'N/A'}</TableCell>
                        <TableCell>{categoria.fechaLimiteDias || 'N/A'}</TableCell>
                        <TableCell className="text-center">{categoria._count?.documentos || 0}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCategoriaDialog(categoria)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => { setDeleteType('categoria'); setDeleteId(categoria.id); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-3.5 h-3.5" />
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
        </TabsContent>
      </Tabs>

      {/* Dialogo Nuevo/Editar Documento */}
      <Dialog open={documentoDialogOpen} onOpenChange={setDocumentoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDocumento ? 'Editar' : 'Nuevo'} Documento de Cumplimiento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" value={documentoForm.titulo} onChange={(e) => setDocumentoForm({ ...documentoForm, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={documentoForm.descripcion} onChange={(e) => setDocumentoForm({ ...documentoForm, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoría</Label>
              <Select value={documentoForm.categoriaId} onValueChange={(v) => setDocumentoForm({ ...documentoForm, categoriaId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaDocumento">Fecha del Documento</Label>
                <Input id="fechaDocumento" type="date" value={documentoForm.fechaDocumento} onChange={(e) => setDocumentoForm({ ...documentoForm, fechaDocumento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                <Input id="fechaVencimiento" type="date" value={documentoForm.fechaVencimiento} onChange={(e) => setDocumentoForm({ ...documentoForm, fechaVencimiento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={documentoForm.estado} onValueChange={(v) => setDocumentoForm({ ...documentoForm, estado: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(estadoColors).map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" value={documentoForm.observaciones} onChange={(e) => setDocumentoForm({ ...documentoForm, observaciones: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Archivo Adjunto</Label>
              <FileUpload
                label="Adjuntar Documento"
                description="Arrastra o haz click para subir el archivo (PDF, JPG, PNG)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={documentoForm.archivoNombre ? [documentoForm.archivoNombre] : []}
                maxFiles={1}
                accept={{ 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDocumentoSave}>Guardar Documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Nuevo/Editar Categoría */}
      <Dialog open={categoriaDialogOpen} onOpenChange={setCategoriaDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar' : 'Nueva'} Categoría de Cumplimiento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={categoriaForm.nombre} onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={categoriaForm.codigo} onChange={(e) => setCategoriaForm({ ...categoriaForm, codigo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={categoriaForm.descripcion} onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={categoriaForm.tipo} onValueChange={(v) => setCategoriaForm({ ...categoriaForm, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CATEGORIA.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="obligatorio">Obligatorio</Label>
                <Select value={categoriaForm.obligatorio ? 'true' : 'false'} onValueChange={(v) => setCategoriaForm({ ...categoriaForm, obligatorio: v === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="articuloLey">Artículo/Ley</Label>
                <Input id="articuloLey" value={categoriaForm.articuloLey} onChange={(e) => setCategoriaForm({ ...categoriaForm, articuloLey: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaLimiteDias">Días Límite para Vencimiento</Label>
                <Input id="fechaLimiteDias" type="number" value={categoriaForm.fechaLimiteDias} onChange={(e) => setCategoriaForm({ ...categoriaForm, fechaLimiteDias: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input id="orden" type="number" value={categoriaForm.orden} onChange={(e) => setCategoriaForm({ ...categoriaForm, orden: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCategoriaSave}>Guardar Categoría</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo para Ver Archivo */}
      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-3xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Archivo: {viewingDocumento?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingDocumento?.archivoUrl ? (
              <iframe src={viewingDocumento.archivoUrl} className="w-full h-full border-0"></iframe>
            ) : viewingDocumento?.archivoBase64 ? (
              <iframe src={`data:${viewingDocumento.archivoTipo};base64,${viewingDocumento.archivoBase64}`} className="w-full h-full border-0"></iframe>
            ) : (
              <div className="text-center text-slate-500">No hay archivo disponible para visualizar.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewFileDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el {deleteType === 'documento' ? 'documento' : 'categoría'} seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteType === 'documento') {
                void handleDocumentoDelete(deleteId)
              } else {
                void handleCategoriaDelete(deleteId)
              }
            }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Importación Masiva de Documentos */}
      <Dialog open={importDocumentoDialogOpen} onOpenChange={setImportDocumentoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Documentos de Cumplimiento Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los documentos. Asegúrate de que las columnas coincidan con los campos (Título, Descripción, Categoría, Fecha Documento, Fecha Vencimiento, Estado, Cumple, % Cumplimiento, Verificado Por, Observaciones, Nombre Archivo, URL Archivo).</p>
            <FileUpload
              label="Archivo de Documentos"
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
            <Button variant="outline" onClick={() => setImportDocumentoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMassImportDocumentos} disabled={!importFile || importLoading}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva de Categorías */}
      <Dialog open={importCategoriaDialogOpen} onOpenChange={setImportCategoriaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Categorías de Cumplimiento Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de las categorías. Asegúrate de que las columnas coincidan con los campos (Nombre, Código, Descripción, Tipo, Obligatorio, Artículo Ley, Días Límite, Orden).</p>
            <FileUpload
              label="Archivo de Categorías"
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
            <Button variant="outline" onClick={() => setImportCategoriaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMassImportCategorias} disabled={!importFile || importLoading}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
