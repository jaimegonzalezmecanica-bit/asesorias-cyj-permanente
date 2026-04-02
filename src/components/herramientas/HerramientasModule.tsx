'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Plus, Pencil, Trash2, Search, Wrench, 
  CheckCircle, AlertCircle, XCircle, Settings,
  Upload, Download, FileSpreadsheet, FileX,
  AlertTriangle, Check, X, FileUp, Loader2
} from 'lucide-react'
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
import { useSession } from '@/hooks/use-session'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface CentroCosto {
  id: string
  codigo: string
  nombre: string
}

interface Herramienta {
  id: string
  codigo: string | null
  nombre: string
  marca: string | null
  modelo: string | null
  cantidad: number
  ubicacion: string | null
  estado: string
  valorReposicion: number
  fechaAdquisicion: string | null
  descripcion: string | null
  centroCosto: CentroCosto | null
}

interface PreviewRow {
  original: Record<string, unknown>
  mapped: {
    codigo: string | null
    nombre: string | null
    marca: string | null
    modelo: string | null
    cantidad: number
    ubicacion: string | null
    estado: string
    valorReposicion: number
    fechaAdquisicion: string | null
    descripcion: string | null
  }
  valid: boolean
  errors: string[]
  willCreate: boolean
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const estadoColors: Record<string, string> = {
  'Bueno': 'bg-green-100 text-green-700',
  'Regular': 'bg-yellow-100 text-yellow-700',
  'Malo': 'bg-red-100 text-red-700',
  'En reparación': 'bg-blue-100 text-blue-700',
}

const estadoIcons: Record<string, React.ReactNode> = {
  'Bueno': <CheckCircle className="w-3 h-3 mr-1" />,
  'Regular': <AlertCircle className="w-3 h-3 mr-1" />,
  'Malo': <XCircle className="w-3 h-3 mr-1" />,
  'En reparación': <Settings className="w-3 h-3 mr-1" />,
}

const estadosOptions = ['Bueno', 'Regular', 'Malo', 'En reparación']

export function HerramientasModule() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedHerramienta, setSelectedHerramienta] = useState<Herramienta | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    cantidad: 1,
    ubicacion: '',
    estado: 'Bueno',
    valorReposicion: 0,
    fechaAdquisicion: '',
    descripcion: '',
  })
  const isMobile = useIsMobile()

  // Import dialogs
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [bulkData, setBulkData] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{success: number, creadas?: number, actualizadas?: number, errors: string[]} | null>(null)
  
  // Enhanced import states
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{creadas: number, actualizadas: number, errores: string[]} | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { hasPermission } = useSession()
  const canEdit = hasPermission('catalogos.editar')

  const fetchHerramientas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/catalogos/herramientas')
      const data = await res.json()
      setHerramientas(data)
    } catch (error) {
      console.error('Error fetching herramientas:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchHerramientas()
    })()
  }, [])

  // Filtrar herramientas
  const filteredHerramientas = herramientas.filter(h => {
    const matchSearch = !search || 
      h.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (h.codigo && h.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (h.marca && h.marca.toLowerCase().includes(search.toLowerCase())) ||
      (h.modelo && h.modelo.toLowerCase().includes(search.toLowerCase()))
    
    const matchEstado = filterEstado === 'todos' || h.estado === filterEstado
    
    return matchSearch && matchEstado
  })

  // Estadísticas
  const stats = {
    total: herramientas.length,
    bueno: herramientas.filter(h => h.estado === 'Bueno').length,
    regular: herramientas.filter(h => h.estado === 'Regular').length,
    malo: herramientas.filter(h => h.estado === 'Malo').length,
    enReparacion: herramientas.filter(h => h.estado === 'En reparación').length,
    valorTotal: herramientas.reduce((sum, h) => sum + (h.cantidad * h.valorReposicion), 0),
  }

  const openCreateDialog = () => {
    setIsEditing(false)
    setSelectedHerramienta(null)
    setFormData({
      codigo: '',
      nombre: '',
      marca: '',
      modelo: '',
      cantidad: 1,
      ubicacion: '',
      estado: 'Bueno',
      valorReposicion: 0,
      fechaAdquisicion: '',
      descripcion: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (herramienta: Herramienta) => {
    setIsEditing(true)
    setSelectedHerramienta(herramienta)
    setFormData({
      codigo: herramienta.codigo || '',
      nombre: herramienta.nombre,
      marca: herramienta.marca || '',
      modelo: herramienta.modelo || '',
      cantidad: herramienta.cantidad,
      ubicacion: herramienta.ubicacion || '',
      estado: herramienta.estado,
      valorReposicion: herramienta.valorReposicion,
      fechaAdquisicion: herramienta.fechaAdquisicion || '',
      descripcion: herramienta.descripcion || '',
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (herramienta: Herramienta) => {
    setSelectedHerramienta(herramienta)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (isEditing && selectedHerramienta) {
        await fetch(`/api/catalogos/herramientas/${selectedHerramienta.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/catalogos/herramientas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      setDialogOpen(false)
      fetchHerramientas()
    } catch (error) {
      console.error('Error saving herramienta:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedHerramienta) return
    
    try {
      await fetch(`/api/catalogos/herramientas/${selectedHerramienta.id}`, {
        method: 'DELETE',
      })
      setDeleteDialogOpen(false)
      fetchHerramientas()
    } catch (error) {
      console.error('Error deleting herramienta:', error)
    }
  }

  // CSV Bulk upload
  const handleBulkUpload = async () => {
    if (!bulkData.trim()) return
    setUploading(true)
    setUploadResult(null)
    
    try {
      const res = await fetch('/api/catalogos/herramientas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bulkData }),
      })
      const result = await res.json()
      setUploadResult(result)
      if (result.success > 0) {
        fetchHerramientas()
      }
    } catch (error) {
      console.error('Error uploading herramientas:', error)
      setUploadResult({ success: 0, errors: ['Error de conexión'] })
    }
    setUploading(false)
  }

  // Import from Excel - Enhanced with Preview
  const handleFileSelect = async (file: File) => {
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImportStatus({ loading: false, message: 'Error: Formato de archivo no válido. Use solo archivos Excel (.xlsx, .xls)' })
      return
    }

    setImportFile(file)
    setImportStatus({ loading: true, message: 'Procesando archivo...' })

    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

      // Process and validate each row
      const previewRows: PreviewRow[] = []
      
      for (const row of jsonData) {
        const mapped = {
          codigo: (row.Codigo || row.Código || row.codigo || row.CODIGO || null) as string | null,
          nombre: (row.Nombre || row.nombre || row.NOMBRE || row.Herramienta || row.herramienta) as string | null,
          marca: (row.Marca || row.marca || row.MARCA || null) as string | null,
          modelo: (row.Modelo || row.modelo || row.MODELO || null) as string | null,
          cantidad: parseInt(String(row.Cantidad || row.cantidad || row.CANTIDAD || '1')) || 1,
          ubicacion: (row.Ubicacion || row.Ubicación || row.ubicacion || row.UBICACION || null) as string | null,
          estado: normalizarEstado(String(row.Estado || row.estado || row.ESTADO || 'Bueno')),
          valorReposicion: parseFloat(String(row.Valor || row.ValorReposicion || row.valor || row.VALOR || '0')) || 0,
          fechaAdquisicion: (row.FechaAdquisicion || row.Fecha_Adquisicion || row.fechaAdquisicion || row.FECHA_ADQUISICION || null) as string | null,
          descripcion: (row.Descripcion || row.Descripción || row.descripcion || row.DESCRIPCION || null) as string | null,
        }
        
        const errors: string[] = []
        if (!mapped.nombre) errors.push('Falta nombre')
        
        // Check if will create or update
        let willCreate = true
        if (mapped.codigo) {
          const existente = herramientas.find(h => h.codigo === mapped.codigo)
          if (existente) willCreate = false
        } else if (mapped.nombre) {
          const existente = herramientas.find(h => h.nombre.toLowerCase() === mapped.nombre!.toLowerCase())
          if (existente) willCreate = false
        }
        
        previewRows.push({
          original: row,
          mapped,
          valid: errors.length === 0,
          errors,
          willCreate
        })
      }
      
      setPreviewData(previewRows)
      setImportStep('preview')
      setImportStatus({ loading: false, message: '' })
      
    } catch (error) {
      console.error('Error processing file:', error)
      setImportStatus({ 
        loading: false, 
        message: 'Error al procesar el archivo. Verifique el formato.' 
      })
    }
  }

  const normalizarEstado = (estado: string): string => {
    const estadosValidos = ['Bueno', 'Regular', 'Malo', 'En reparación']
    const lower = estado.toLowerCase().trim()
    
    if (lower.includes('bueno') || lower.includes('good')) return 'Bueno'
    if (lower.includes('regular') || lower.includes('medio')) return 'Regular'
    if (lower.includes('malo') || lower.includes('bad') || lower.includes('dañado')) return 'Malo'
    if (lower.includes('reparaci') || lower.includes('repair')) return 'En reparación'
    
    return estadosValidos.includes(estado) ? estado : 'Bueno'
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFileSelect(file)
    }
  }, [herramientas])

  const executeImport = async () => {
    if (previewData.length === 0) return
    
    setImportStep('importing')
    
    try {
      const validRows = previewData.filter(r => r.valid).map(r => r.mapped)
      
      const response = await fetch('/api/import/herramientas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herramientas: validRows }),
      })

      const result = await response.json()

      setImportResult({
        creadas: result.creadas || 0,
        actualizadas: result.actualizadas || 0,
        errores: result.errores || []
      })
      setImportStep('result')
      fetchHerramientas()
      
    } catch (error) {
      console.error('Error importing:', error)
      setImportStatus({ 
        loading: false, 
        message: 'Error al importar los datos' 
      })
      setImportStep('preview')
    }
  }

  const resetImport = () => {
    setPreviewData([])
    setImportFile(null)
    setImportStep('upload')
    setImportResult(null)
    setImportStatus({ loading: false, message: '' })
  }

  const downloadTemplate = async () => {
    const templateData = [
      {
        Codigo: 'HERR-001',
        Nombre: 'Taladro Percutor',
        Marca: 'Bosch',
        Modelo: 'GBH-2000',
        Cantidad: 2,
        Ubicacion: 'Bodega A',
        Estado: 'Bueno',
        Valor: 85000,
        FechaAdquisicion: '2024-01-15',
        Descripcion: 'Taladro profesional para concreto'
      },
      {
        Codigo: 'HERR-002',
        Nombre: 'Sierra Circular',
        Marca: 'Makita',
        Modelo: '5007MG',
        Cantidad: 1,
        Ubicacion: 'Bodega A',
        Estado: 'Regular',
        Valor: 120000,
        FechaAdquisicion: '2023-06-20',
        Descripcion: 'Sierra circular 7 1/4"'
      }
    ]
    
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Herramientas')
      XLSX.writeFile(wb, 'plantilla_herramientas.xlsx')
    } catch (error) {
      console.error('Error generating template:', error)
    }
  }

  // Legacy import function - keeping for backward compatibility
  const handleImportLegacy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportStatus({ loading: true, message: 'Procesando archivo...' })

    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const response = await fetch('/api/import/herramientas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herramientas: jsonData }),
      })

      const result = await response.json()

      if (result.success) {
        setImportStatus({ 
          loading: false, 
          message: result.mensaje 
        })
        fetchHerramientas()
      } else {
        setImportStatus({ 
          loading: false, 
          message: `Error: ${result.error}` 
        })
      }
    } catch (error) {
      console.error('Error importing:', error)
      setImportStatus({ 
        loading: false, 
        message: 'Error al procesar el archivo' 
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Export
  const exportHerramientas = () => {
    const header = 'codigo,nombre,marca,modelo,cantidad,ubicacion,estado,valorReposicion,fechaAdquisicion\n'
    const rows = herramientas.map(h => 
      `"${h.codigo || ''}","${h.nombre}","${h.marca || ''}","${h.modelo || ''}",${h.cantidad},"${h.ubicacion || ''}","${h.estado}",${h.valorReposicion},"${h.fechaAdquisicion || ''}"`
    ).join('\n')
    
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `herramientas_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Mobile card view
  const renderMobileCard = (herr: Herramienta) => (
    <Card key={herr.id} className="mb-3">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0f2040] flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {herr.codigo && (
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{herr.codigo}</span>
              )}
              <span className="font-semibold text-sm truncate">{herr.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
              {herr.marca && <span>{herr.marca}</span>}
              {herr.modelo && <span className="text-slate-400">• {herr.modelo}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${estadoColors[herr.estado] || estadoColors['Bueno']} text-[9px]`}>
                {estadoIcons[herr.estado]}
                {herr.estado}
              </Badge>
              <span className="text-xs text-slate-500">Cant: {herr.cantidad}</span>
              <span className="text-xs font-bold text-[#0f2040] ml-auto">{formatCLP(herr.valorReposicion)}</span>
            </div>
          </div>
          {canEdit && (
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(herr)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => openDeleteDialog(herr)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <Card className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase">Total</div>
              <div className="text-lg sm:text-xl font-bold text-[#0f2040]">{stats.total}</div>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 border-green-200 bg-green-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-green-600 font-semibold uppercase">Bueno</div>
              <div className="text-lg sm:text-xl font-bold text-green-600">{stats.bueno}</div>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-yellow-600 font-semibold uppercase">Regular</div>
              <div className="text-lg sm:text-xl font-bold text-yellow-600">{stats.regular}</div>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-red-600 font-semibold uppercase">Malo</div>
              <div className="text-lg sm:text-xl font-bold text-red-600">{stats.malo}</div>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 border-blue-200 bg-blue-50 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-blue-600 font-semibold uppercase">Reparación</div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.enReparacion}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {estadosOptions.map(estado => (
              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={exportHerramientas}>
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Importar Excel</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setBulkData(''); setUploadResult(null); setBulkDialogOpen(true) }}>
              <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button size="sm" className="h-9" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          </>
        )}
      </div>

      {/* Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-2">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
          ) : filteredHerramientas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Sin herramientas</div>
          ) : (
            filteredHerramientas.map(renderMobileCard)
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Catálogo de Herramientas ({filteredHerramientas.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Código</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Marca</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Modelo</th>
                    <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Cant.</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Ubicación</th>
                    <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                    <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase">Valor</th>
                    {canEdit && <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                  ) : filteredHerramientas.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin herramientas</td></tr>
                  ) : (
                    filteredHerramientas.map((herr) => (
                      <tr key={herr.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs font-semibold text-[#0f2040]">
                          {herr.codigo || '–'}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{herr.nombre}</div>
                          {herr.descripcion && (
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{herr.descripcion}</div>
                          )}
                        </td>
                        <td className="p-3 text-xs">{herr.marca || '–'}</td>
                        <td className="p-3 text-xs">{herr.modelo || '–'}</td>
                        <td className="p-3 text-center font-semibold">{herr.cantidad}</td>
                        <td className="p-3 text-xs">{herr.ubicacion || '–'}</td>
                        <td className="p-3 text-center">
                          <Badge className={estadoColors[herr.estado] || estadoColors['Bueno']}>
                            {estadoIcons[herr.estado]}
                            {herr.estado}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-bold">{formatCLP(herr.valorReposicion)}</td>
                        {canEdit && (
                          <td className="p-3">
                            <div className="flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(herr)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(herr)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{isEditing ? 'Editar Herramienta' : 'Nueva Herramienta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Código</Label>
                <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} placeholder="HERR-01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Marca</Label>
                <Input value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} placeholder="Bosch, Makita..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo</Label>
                <Input value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} placeholder="Modelo" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cantidad</Label>
                <Input type="number" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estadosOptions.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ubicación</Label>
                <Input value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} placeholder="Bodega A" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha Adquisición</Label>
                <Input type="date" value={formData.fechaAdquisicion} onChange={(e) => setFormData({...formData, fechaAdquisicion: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor Reposición</Label>
              <Input type="number" value={formData.valorReposicion} onChange={(e) => setFormData({...formData, valorReposicion: parseFloat(e.target.value) || 0})} placeholder="Valor en CLP" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descripción</Label>
              <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Notas..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formData.nombre}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar herramienta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente{selectedHerramienta && <strong> {selectedHerramienta.nombre}</strong>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Excel Dialog - Enhanced */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImport(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              Importar Herramientas
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-3">
            {/* Step: Upload */}
            {importStep === 'upload' && (
              <div className="space-y-4">
                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs">
                  <p className="font-semibold text-blue-700 mb-2">📋 Formatos aceptados:</p>
                  <ul className="text-blue-600 space-y-1">
                    <li>• <strong>Excel:</strong> .xlsx, .xls (requerido)</li>
                  </ul>
                </div>
                
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                    isDragging 
                      ? "border-amber-400 bg-amber-50" 
                      : "border-slate-300 hover:border-amber-400 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleImport}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                      isDragging ? "bg-amber-100" : "bg-slate-100"
                    )}>
                      <Upload className={cn(
                        "w-8 h-8",
                        isDragging ? "text-amber-500" : "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        o haz clic para seleccionar
                      </p>
                    </div>
                  </div>
                </div>
                
                {importStatus.message && (
                  <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {importStatus.message}
                    </div>
                  </div>
                )}
                
                {/* Download Template */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs">
                    <p className="font-semibold">¿No tienes un archivo preparado?</p>
                    <p className="text-slate-500">Descarga nuestra plantilla con el formato correcto</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Plantilla
                  </Button>
                </div>
                
                {/* Column reference */}
                <div className="bg-slate-50 p-3 rounded-lg text-xs">
                  <p className="font-semibold mb-2">📌 Columnas reconocidas:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
                    <div><strong>Codigo/Código:</strong> Identificador</div>
                    <div><strong>Nombre*:</strong> Herramienta (requerido)</div>
                    <div><strong>Marca:</strong> Fabricante</div>
                    <div><strong>Modelo:</strong> Referencia</div>
                    <div><strong>Cantidad:</strong> Número (default: 1)</div>
                    <div><strong>Ubicación:</strong> Bodega/Sector</div>
                    <div><strong>Estado:</strong> Bueno/Regular/Malo</div>
                    <div><strong>Valor:</strong> Precio en CLP</div>
                    <div><strong>FechaAdquisicion:</strong> YYYY-MM-DD</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step: Preview */}
            {importStep === 'preview' && (
              <div className="space-y-4">
                {/* File info */}
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="font-semibold text-sm">{importFile?.name}</p>
                      <p className="text-xs">{previewData.length} registros encontrados</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {previewData.filter(r => r.valid && r.willCreate).length}
                    </div>
                    <div className="text-xs text-green-600">Nuevos</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {previewData.filter(r => r.valid && !r.willCreate).length}
                    </div>
                    <div className="text-xs text-blue-600">Actualizar</div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {previewData.filter(r => !r.valid).length}
                    </div>
                    <div className="text-xs text-red-600">Con error</div>
                  </div>
                </div>
                
                {/* Preview Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-100">
                        <tr>
                          <th className="p-2 text-left font-semibold">#</th>
                          <th className="p-2 text-left font-semibold">Código</th>
                          <th className="p-2 text-left font-semibold">Nombre</th>
                          <th className="p-2 text-left font-semibold">Marca</th>
                          <th className="p-2 text-center font-semibold">Cant.</th>
                          <th className="p-2 text-center font-semibold">Estado</th>
                          <th className="p-2 text-center font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr 
                            key={idx} 
                            className={cn(
                              "border-t",
                              !row.valid && "bg-red-50",
                              row.valid && row.willCreate && "bg-green-50/50",
                              row.valid && !row.willCreate && "bg-blue-50/50"
                            )}
                          >
                            <td className="p-2 text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-mono">{row.mapped.codigo || '–'}</td>
                            <td className="p-2 font-medium">
                              {row.mapped.nombre || <span className="text-red-500">Sin nombre</span>}
                            </td>
                            <td className="p-2">{row.mapped.marca || '–'}</td>
                            <td className="p-2 text-center">{row.mapped.cantidad}</td>
                            <td className="p-2 text-center">
                              <Badge className={`${estadoColors[row.mapped.estado] || ''} text-[9px]`}>
                                {row.mapped.estado}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              {row.valid ? (
                                row.willCreate ? (
                                  <Badge className="bg-green-100 text-green-700 text-[9px]">Crear</Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 text-[9px]">Actualizar</Badge>
                                )
                              ) : (
                                <Badge className="bg-red-100 text-red-700 text-[9px]">Error</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Errors detail */}
                {previewData.some(r => !r.valid) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-700 text-xs mb-2">⚠️ Filas con errores:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {previewData.filter(r => !r.valid).map((r, i) => (
                        <li key={i}>Fila {previewData.indexOf(r) + 1}: {r.errors.join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Step: Importing */}
            {importStep === 'importing' && (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                <p className="font-semibold">Importando herramientas...</p>
                <p className="text-xs text-slate-500 mt-1">Por favor espere</p>
              </div>
            )}
            
            {/* Step: Result */}
            {importStep === 'result' && importResult && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-semibold text-lg">¡Importación completada!</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{importResult.creadas}</div>
                    <div className="text-sm text-green-600">Herramientas creadas</div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{importResult.actualizadas}</div>
                    <div className="text-sm text-blue-600">Herramientas actualizadas</div>
                  </div>
                </div>
                
                {importResult.errores && importResult.errores.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-semibold text-yellow-700 text-xs mb-2">⚠️ Advertencias:</p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      {importResult.errores.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-3">
            {importStep === 'upload' && (
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(false)}>
                Cancelar
              </Button>
            )}
            {importStep === 'preview' && (
              <>
                <Button variant="outline" size="sm" onClick={resetImport}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={executeImport}
                  disabled={previewData.filter(r => r.valid).length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Importar {previewData.filter(r => r.valid).length} registros
                </Button>
              </>
            )}
            {importStep === 'result' && (
              <Button size="sm" onClick={() => { setImportDialogOpen(false); resetImport(); }}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV Upload Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Carga Masiva CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="bg-slate-50 p-3 rounded-lg text-xs">
              <p className="font-semibold mb-2">Formato CSV:</p>
              <code className="text-xs bg-white p-2 rounded block">
                codigo,nombre,marca,modelo,cantidad,ubicacion,estado,valorReposicion
              </code>
              <p className="text-xs text-slate-500 mt-2">
                Ej: HERR-01,Taladro Percutor,Bosch,GBH-2000,2,Bodega A,Bueno,85000
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Datos CSV</Label>
              <Textarea value={bulkData} onChange={(e) => setBulkData(e.target.value)} placeholder="codigo,nombre,marca..." rows={8} className="font-mono text-xs" />
            </div>
            {uploadResult && (
              <div className={`p-3 rounded text-xs ${uploadResult.success > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <p className="font-semibold">{uploadResult.success} herramientas procesadas</p>
                {uploadResult.creadas !== undefined && <p>Creadas: {uploadResult.creadas}, Actualizadas: {uploadResult.actualizadas}</p>}
                {uploadResult.errors.length > 0 && (
                  <ul className="mt-1">{uploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(false)}>Cerrar</Button>
            <Button size="sm" onClick={handleBulkUpload} disabled={uploading || !bulkData.trim()}>{uploading ? 'Importando...' : 'Importar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
