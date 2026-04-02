
'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
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
import { Plus, Pencil, Trash2, Search, Download, Upload, Package, QrCode, FileText, X, Loader2 } from 'lucide-react'
import { formatCLP, formatDate } from '@/lib/format'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface Activo {
  id: string
  nombre: string
  categoria: string
  estado: string
  ubicacion: string | null
  serie: string | null
  fechaCompra: string | null
  costoCompra: number
  valorActual: number
  descripcion: string | null
  asignadoId: string | null
  asignado: { nombre: string } | null
}

const categoriaColors: Record<string, string> = {
  'Equipo': 'bg-blue-100 text-blue-700',
  'Herramienta': 'bg-amber-100 text-amber-700',
  'Vehículo': 'bg-purple-100 text-purple-700',
  'Mobiliario': 'bg-cyan-100 text-cyan-700',
  'Infraestructura': 'bg-slate-100 text-slate-700',
  'Tecnología': 'bg-green-100 text-green-700',
}

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
  'En Reparación': 'bg-yellow-100 text-yellow-700',
  'Dado de Baja': 'bg-red-100 text-red-700',
}

export function ActivosModule() {
  const [activos, setActivos] = useState<Activo[]>([])
  const [personal, setPersonal] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [editingAct, setEditingAct] = useState<Activo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Equipo',
    estado: 'Activo',
    ubicacion: '',
    serie: '',
    fechaCompra: '',
    costoCompra: 0,
    valorActual: 0,
    descripcion: '',
    asignadoId: 'none',
  })

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'categoria', label: 'Categoría', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
    { key: 'serie', label: 'Serie', defaultVisible: true },
    { key: 'fechaCompra', label: 'Fecha Compra', defaultVisible: true },
    { key: 'costoCompra', label: 'Costo Compra', defaultVisible: true },
    { key: 'valorActual', label: 'Valor Actual', defaultVisible: true },
    { key: 'descripcion', label: 'Descripción', defaultVisible: false },
    { key: 'asignado.nombre', label: 'Asignado A', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo', 'En Reparación', 'Dado de Baja'] },
    { key: 'categoria', label: 'Categoría', type: 'select', options: ['Equipo', 'Herramienta', 'Vehículo', 'Mobiliario', 'Infraestructura', 'Tecnología'] },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'activos',
    moduleLabel: 'Activos',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => activos
  })

  const fetchActivos = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/activos?search=${encodeURIComponent(searchTerm)}` : '/api/activos'
      const res = await fetch(url)
      const data = await res.json()
      setActivos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching activos:', error)
      setActivos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchActivos()
    fetch('/api/personal').then(res => res.json()).then(setPersonal)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchActivos(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (act?: Activo) => {
    if (act) {
      setEditingAct(act)
      setFormData({
        nombre: act.nombre,
        categoria: act.categoria,
        estado: act.estado,
        ubicacion: act.ubicacion || '',
        serie: act.serie || '',
        fechaCompra: act.fechaCompra || '',
        costoCompra: act.costoCompra,
        valorActual: act.valorActual,
        descripcion: act.descripcion || '',
        asignadoId: act.asignadoId || 'none',
      })
    } else {
      setEditingAct(null)
      setFormData({
        nombre: '',
        categoria: 'Equipo',
        estado: 'Activo',
        ubicacion: '',
        serie: '',
        fechaCompra: new Date().toISOString().split('T')[0],
        costoCompra: 0,
        valorActual: 0,
        descripcion: '',
        asignadoId: 'none',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return
    const dataToSend = {
      ...formData,
      asignadoId: formData.asignadoId === 'none' ? null : formData.asignadoId,
    }
    try {
      const method = editingAct ? 'PUT' : 'POST'
      const url = editingAct ? `/api/activos/${editingAct.id}` : '/api/activos'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })
      setDialogOpen(false)
      fetchActivos(search)
      toast.success(`Activo ${editingAct ? 'actualizado' : 'creado'} con éxito`)
    } catch (error) {
      console.error('Error saving activo:', error)
      toast.error('Error al guardar activo')
    }
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0])
    } else {
      setImportFile(null)
    }
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

        // Transformar los datos para que coincidan con el modelo de Activo
        const transformedData = json.map(item => ({
          nombre: item.Nombre || '',
          categoria: item.Categoria || 'Equipo',
          estado: item.Estado || 'Activo',
          ubicacion: item.Ubicacion || null,
          serie: item.Serie || null,
          fechaCompra: item['Fecha Compra'] ? new Date(item['Fecha Compra']).toISOString().split('T')[0] : null,
          costoCompra: Number(item['Costo Compra']) || 0,
          valorActual: Number(item['Valor Actual']) || 0,
          descripcion: item.Descripcion || null,
          // AsignadoId requeriría un mapeo a IDs de personal existentes
          // Por simplicidad, lo dejamos como null o un valor por defecto
          asignadoId: null,
        }))

        const res = await fetch('/api/activos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Activos importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchActivos()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar activos. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  const totalValor = activos.reduce((sum, a) => sum + a.valorActual, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar activo..."
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
          <Plus className="w-4 h-4 mr-1" /> Nuevo Activo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : activos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay activos</div>
        ) : (
          activos.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDialog(a)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={estadoColors[a.estado]}>{a.estado}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(a.fechaCompra)}</span>
                </div>
                <CardTitle className="text-base mt-2 truncate">{a.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{a.categoria}</span>
                  <span className="font-bold text-slate-900">{formatCLP(a.valorActual)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold">
                  <Package className="w-3 h-3" /> {a.ubicacion || 'Sin ubicación'}
                  <QrCode className="w-3 h-3 ml-auto text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAct ? 'Editar' : 'Nuevo'} Activo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoriaColors).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(estadoColors).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Costo Compra</Label>
                <Input type="number" value={formData.costoCompra} onChange={(e) => setFormData({...formData, costoCompra: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Valor Actual</Label>
                <Input type="number" value={formData.valorActual} onChange={(e) => setFormData({...formData, valorActual: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Activos Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los activos. Asegúrate de que las columnas coincidan con los campos (Nombre, Categoría, Estado, Ubicación, Serie, Fecha Compra, Costo Compra, Valor Actual, Descripción).</p>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer bg-slate-50 hover:border-slate-400">
              <input type="file" accept=".xlsx,.csv" onChange={handleImportFileChange} className="hidden" id="import-file-input" />
              <label htmlFor="import-file-input" className="cursor-pointer flex flex-col items-center">
                {importFile ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <FileText className="h-5 w-5" />
                    <span>{importFile.name}</span>
                    <X className="h-4 w-4 text-slate-400 hover:text-red-500" onClick={(e) => { e.preventDefault(); setImportFile(null) }} />
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600">Arrastra y suelta tu archivo aquí, o haz click para seleccionar</p>
                  </>
                )}
              </label>
            </div>
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
