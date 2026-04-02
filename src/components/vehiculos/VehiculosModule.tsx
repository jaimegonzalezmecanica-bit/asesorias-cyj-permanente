'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Pencil, Trash2, Search, Car, Calendar, ShieldCheck, FileText, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface Vehiculo {
  id: string
  marca: string
  modelo: string
  anio: number
  patente: string
  color: string | null
  permisoCirculacion: string | null // Fecha vencimiento
  seguroVencimiento: string | null
  revisionTecnica: string | null
  estado: string
  notas: string | null
}

const estadoColors: Record<string, string> = {
  'Operativo': 'bg-green-100 text-green-700',
  'En Taller': 'bg-orange-100 text-orange-700',
  'Fuera de Servicio': 'bg-red-100 text-red-700',
}

export function VehiculosModule() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    patente: '',
    color: '',
    permisoCirculacion: '',
    seguroVencimiento: '',
    revisionTecnica: '',
    estado: 'Operativo',
    notas: '',
  })

  const fetchVehiculos = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/vehiculos?search=${encodeURIComponent(searchTerm)}` : '/api/vehiculos'
      const res = await fetch(url)
      const data = await res.json()
      setVehiculos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching vehiculos:', error)
      setVehiculos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVehiculos()
  }, [])

  const handleSave = async () => {
    if (!formData.patente.trim()) return
    try {
      const method = editingVehiculo ? 'PUT' : 'POST'
      const url = editingVehiculo ? `/api/vehiculos/${editingVehiculo.id}` : '/api/vehiculos'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setDialogOpen(false)
      fetchVehiculos(search)
    } catch (error) {
      console.error('Error saving vehiculo:', error)
    }
  }

  const openDialog = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setFormData({
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        patente: vehiculo.patente,
        color: vehiculo.color || '',
        permisoCirculacion: vehiculo.permisoCirculacion || '',
        seguroVencimiento: vehiculo.seguroVencimiento || '',
        revisionTecnica: vehiculo.revisionTecnica || '',
        estado: vehiculo.estado,
        notas: vehiculo.notas || '',
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        patente: '',
        color: '',
        permisoCirculacion: '',
        seguroVencimiento: '',
        revisionTecnica: '',
        estado: 'Operativo',
        notas: '',
      })
    }
    setDialogOpen(true)
  }

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar vehículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Vehículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : vehiculos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay vehículos registrados</div>
        ) : (
          vehiculos.map((v) => (
            <Card key={v.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDialog(v)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={estadoColors[v.estado]}>{v.estado}</Badge>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border">{v.patente}</span>
                </div>
                <CardTitle className="text-base mt-2">{v.marca} {v.modelo} ({v.anio})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-500">
                  <div className={`flex items-center gap-1 ${isExpired(v.revisionTecnica) ? 'text-red-500' : ''}`}>
                    <FileText className="w-3 h-3" /> Rev. Técnica
                  </div>
                  <div className={`flex items-center gap-1 ${isExpired(v.seguroVencimiento) ? 'text-red-500' : ''}`}>
                    <ShieldCheck className="w-3 h-3" /> Seguro
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Permiso: {formatDate(v.permisoCirculacion)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehiculo ? 'Editar' : 'Nuevo'} Vehículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Input type="number" value={formData.anio} onChange={(e) => setFormData({...formData, anio: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Patente</Label>
                <Input className="uppercase font-mono" value={formData.patente} onChange={(e) => setFormData({...formData, patente: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2 col-span-2 border-t pt-2 mt-2">
                <Label className="text-blue-600">Documentación y Vencimientos</Label>
              </div>
              <div className="space-y-2">
                <Label>Revisión Técnica</Label>
                <Input type="date" value={formData.revisionTecnica} onChange={(e) => setFormData({...formData, revisionTecnica: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Seguro Vence</Label>
                <Input type="date" value={formData.seguroVencimiento} onChange={(e) => setFormData({...formData, seguroVencimiento: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Permiso Circulación</Label>
                <Input type="date" value={formData.permisoCirculacion} onChange={(e) => setFormData({...formData, permisoCirculacion: e.target.value})} />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Vehículo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
