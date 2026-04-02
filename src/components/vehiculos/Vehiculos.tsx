
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Truck,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  Upload,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Vehiculo {
  id: string
  marca: string
  modelo: string
  anio: number
  patente: string
  permisoCirculacion: string // Fecha vencimiento
  seguroObligatorio: string // Fecha vencimiento
  revisionTecnica: string // Fecha vencimiento
  estado: 'Operativo' | 'En Taller' | 'Fuera de Servicio'
  condominioId: string
}

export default function Vehiculos() {
  const { currentCondominio } = useAppStore()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    patente: '',
    permisoCirculacion: '',
    seguroObligatorio: '',
    revisionTecnica: '',
    estado: 'Operativo' as 'Operativo' | 'En Taller' | 'Fuera de Servicio',
  })

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'marca', label: 'Marca', defaultVisible: true },
    { key: 'modelo', label: 'Modelo', defaultVisible: true },
    { key: 'anio', label: 'Año', defaultVisible: true },
    { key: 'patente', label: 'Patente', defaultVisible: true },
    { key: 'permisoCirculacion', label: 'Permiso Circulación', defaultVisible: true },
    { key: 'seguroObligatorio', label: 'Seguro Obligatorio', defaultVisible: true },
    { key: 'revisionTecnica', label: 'Revisión Técnica', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ['Operativo', 'En Taller', 'Fuera de Servicio'] },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'vehiculos',
    moduleLabel: 'Vehículos',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => vehiculos,
  })

  useEffect(() => {
    fetchVehiculos()
  }, [currentCondominio])

  const fetchVehiculos = async () => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    try {
      const response = await fetch(`/api/vehiculos?condominioId=${currentCondominio.id}`)
      if (response.ok) {
        const data = await response.json()
        setVehiculos(data)
      } else {
        toast.error('Error al cargar vehículos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (fecha: string) => {
    const hoy = new Date()
    const vencimiento = new Date(fecha)
    const diffTime = vencimiento.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-600 font-bold'
    if (diffDays < 30) return 'text-amber-600 font-bold'
    return 'text-green-600 font-medium'
  }

  const handleOpenDialog = (mode: 'create' | 'edit', vehiculo?: Vehiculo) => {
    setDialogMode(mode)
    setSelectedVehiculo(vehiculo || null)

    if (mode === 'create') {
      setFormData({
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        patente: '',
        permisoCirculacion: '',
        seguroObligatorio: '',
        revisionTecnica: '',
        estado: 'Operativo',
      })
    } else if (vehiculo) {
      setFormData({
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        patente: vehiculo.patente,
        permisoCirculacion: vehiculo.permisoCirculacion,
        seguroObligatorio: vehiculo.seguroObligatorio,
        revisionTecnica: vehiculo.revisionTecnica,
        estado: vehiculo.estado,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar el vehículo.')
      return
    }
    setSaving(true)
    try {
      const method = dialogMode === 'create' ? 'POST' : 'PUT'
      const url = dialogMode === 'create' ? '/api/vehiculos' : `/api/vehiculos/${selectedVehiculo?.id}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          condominioId: currentCondominio.id,
        }),
      })

      if (response.ok) {
        toast.success(`Vehículo ${dialogMode === 'create' ? 'creado' : 'actualizado'} con éxito.`)
        fetchVehiculos()
        setDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.message || `Error al ${dialogMode === 'create' ? 'crear' : 'actualizar'} vehículo`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehiculoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este vehículo?')) return

    try {
      const response = await fetch(`/api/vehiculos/${vehiculoId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Vehículo eliminado')
        fetchVehiculos()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
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
      toast.error('Debe seleccionar un condominio para importar vehículos.')
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
          marca: item.Marca || '',
          modelo: item.Modelo || '',
          anio: item.Año || new Date().getFullYear(),
          patente: item.Patente || '',
          permisoCirculacion: item['Permiso Circulación'] || '',
          seguroObligatorio: item['Seguro Obligatorio'] || '',
          revisionTecnica: item['Revisión Técnica'] || '',
          estado: item.Estado || 'Operativo',
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/vehiculos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Vehículos importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchVehiculos()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar vehículos. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  const filteredVehiculos = vehiculos.filter((vehiculo) =>
    vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.patente.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar los vehículos.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flota de Vehículos</h1>
          <p className="text-sm text-slate-500">Control de documentación y mantenimiento</p>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
          <Button onClick={() => handleOpenDialog('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Vehículo
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por patente, marca o modelo..."
          className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b">
            <tr>
              <th className="px-6 py-4">Vehículo</th>
              <th className="px-6 py-4">Patente</th>
              <th className="px-6 py-4">Documentación (Vencimiento)</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : filteredVehiculos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground">
                  No se encontraron vehículos.
                </td>
              </tr>
            ) : (
              filteredVehiculos.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{vehiculo.marca} {vehiculo.modelo}</p>
                        <p className="text-xs text-slate-500">Año {vehiculo.anio}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{vehiculo.patente}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between w-48">
                        <span className="text-slate-500">Permiso:</span>
                        <span className={getStatusColor(vehiculo.permisoCirculacion)}>{vehiculo.permisoCirculacion}</span>
                      </div>
                      <div className="flex justify-between w-48">
                        <span className="text-slate-500">Seguro:</span>
                        <span className={getStatusColor(vehiculo.seguroObligatorio)}>{vehiculo.seguroObligatorio}</span>
                      </div>
                      <div className="flex justify-between w-48">
                        <span className="text-slate-500">R. Técnica:</span>
                        <span className={getStatusColor(vehiculo.revisionTecnica)}>{vehiculo.revisionTecnica}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      vehiculo.estado === 'Operativo' ? "bg-green-100 text-green-700" :
                      vehiculo.estado === 'En Taller' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog('edit', vehiculo)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vehiculo.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogo de Creación/Edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Agregar Nuevo Vehículo' : 'Editar Vehículo'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? 'Ingresa los detalles del nuevo vehículo.' : 'Edita los detalles del vehículo seleccionado.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" type="number" value={formData.anio} onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patente">Patente</Label>
              <Input id="patente" value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permisoCirculacion">Vencimiento Permiso Circulación</Label>
              <Input id="permisoCirculacion" type="date" value={formData.permisoCirculacion} onChange={e => setFormData({...formData, permisoCirculacion: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seguroObligatorio">Vencimiento Seguro Obligatorio</Label>
              <Input id="seguroObligatorio" type="date" value={formData.seguroObligatorio} onChange={e => setFormData({...formData, seguroObligatorio: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionTecnica">Vencimiento Revisión Técnica</Label>
              <Input id="revisionTecnica" type="date" value={formData.revisionTecnica} onChange={e => setFormData({...formData, revisionTecnica: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={value => setFormData({...formData, estado: value as 'Operativo' | 'En Taller' | 'Fuera de Servicio'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operativo">Operativo</SelectItem>
                  <SelectItem value="En Taller">En Taller</SelectItem>
                  <SelectItem value="Fuera de Servicio">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {dialogMode === 'create' ? 'Agregar' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Vehículos Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los vehículos. Asegúrate de que las columnas coincidan con los campos (Marca, Modelo, Año, Patente, Permiso Circulación, Seguro Obligatorio, Revisión Técnica, Estado).</p>
            <FileUpload
              label="Archivo de Vehículos"
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
