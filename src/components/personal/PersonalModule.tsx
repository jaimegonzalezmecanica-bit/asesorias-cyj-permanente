
'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Plus, Pencil, Trash2, Search, DollarSign, Upload, Camera, User, X } from 'lucide-react'
import { useSession } from '@/hooks/use-session'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import { formatCLP, formatDate } from '@/lib/format'
import FileUpload from '@/components/shared/FileUpload'

interface Personal {
  id: string
  nombre: string
  rut: string | null
  cargo: string | null
  contrato: string
  afp: string
  salud: string
  mutual: string
  ccaf: string | null
  fechaIngreso: string | null
  sueldoBase: number
  movilizacion: number
  colacion: number
  viatico: number
  asigFamiliar: number
  estado: string
  email: string | null
  telefono: string | null
  notas: string | null
  foto?: string | null
}

const contratoColors: Record<string, string> = {
  'Indefinido': 'bg-blue-100 text-blue-700',
  'Plazo Fijo': 'bg-yellow-100 text-yellow-700',
  'Por Obra': 'bg-purple-100 text-purple-700',
  'Part-Time': 'bg-cyan-100 text-cyan-700',
}

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Vacaciones': 'bg-cyan-100 text-cyan-700',
  'Licencia': 'bg-purple-100 text-purple-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
}

export function PersonalModule() {
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' })
  const [editingPer, setEditingPer] = useState<Personal | null>(null)
  
  const { hasPermission } = useSession()
  const canEdit = hasPermission('personal.editar')
  
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    cargo: '',
    contrato: 'Indefinido',
    afp: 'ProVida',
    salud: 'Fonasa',
    mutual: 'IST',
    ccaf: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    sueldoBase: 0,
    movilizacion: 0,
    colacion: 0,
    viatico: 0,
    asigFamiliar: 0,
    estado: 'Activo',
    email: '',
    telefono: '',
    notas: '',
    foto: '', // URL de la foto
  })

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'rut', label: 'RUT', defaultVisible: true },
    { key: 'cargo', label: 'Cargo', defaultVisible: true },
    { key: 'contrato', label: 'Contrato', defaultVisible: true },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'telefono', label: 'Teléfono', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Vacaciones', 'Licencia', 'Inactivo'] },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'personal',
    moduleLabel: 'Personal',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => personal
  })

  const fetchPersonal = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/personal?search=${encodeURIComponent(searchTerm)}` : '/api/personal'
      const res = await fetch(url)
      const data = await res.json()
      setPersonal(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching personal:', error)
      setPersonal([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPersonal()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchPersonal(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const data = new FormData()
    data.append('file', file)
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: data,
      })
      if (!res.ok) throw new Error(await res.text())
      const { url } = await res.json()
      setFormData(prev => ({ ...prev, foto: url }))
      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleFileRemove = async (urlToRemove: string): Promise<boolean> => {
    // Implementar lógica para eliminar archivo del servidor si es necesario
    // Por ahora, solo lo eliminamos del estado local
    setFormData(prev => ({ ...prev, foto: '' }))
    return true
  }

  const openDialog = (per?: Personal) => {
    if (per) {
      setEditingPer(per)
      setFormData({
        nombre: per.nombre,
        rut: per.rut || '',
        cargo: per.cargo || '',
        contrato: per.contrato,
        afp: per.afp,
        salud: per.salud,
        mutual: per.mutual,
        ccaf: per.ccaf || '',
        fechaIngreso: per.fechaIngreso || new Date().toISOString().split('T')[0],
        sueldoBase: per.sueldoBase,
        movilizacion: per.movilizacion,
        colacion: per.colacion,
        viatico: per.viatico,
        asigFamiliar: per.asigFamiliar,
        estado: per.estado,
        email: per.email || '',
        telefono: per.telefono || '',
        notas: per.notas || '',
        foto: per.foto || '',
      })
    } else {
      setEditingPer(null)
      setFormData({
        nombre: '',
        rut: '',
        cargo: '',
        contrato: 'Indefinido',
        afp: 'ProVida',
        salud: 'Fonasa',
        mutual: 'IST',
        ccaf: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        sueldoBase: 0,
        movilizacion: 0,
        colacion: 0,
        viatico: 0,
        asigFamiliar: 0,
        estado: 'Activo',
        email: '',
        telefono: '',
        notas: '',
        foto: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return
    try {
      const method = editingPer ? 'PUT' : 'POST'
      const url = editingPer ? `/api/personal/${editingPer.id}` : '/api/personal'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setDialogOpen(false)
      fetchPersonal(search)
    } catch (error) {
      console.error('Error saving personal:', error)
    }
  }

  return (
    <div className="space-y-5">
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
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : personal.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay registros</div>
        ) : (
          personal.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDialog(p)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-slate-100">
                    <AvatarImage src={p.foto || ''} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-400">
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{p.nombre}</h3>
                    <Badge variant="outline" className={`${contratoColors[p.contrato]} mt-1`}>{p.cargo || 'Sin cargo'}</Badge>
                    <p className="text-xs text-slate-500 mt-1 truncate">{p.rut || 'Sin RUT'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Ingreso: {formatDate(p.fechaIngreso)}</span>
                  <span className={estadoColors[p.estado]}>{p.estado}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPer ? 'Editar' : 'Nuevo'} Personal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-2">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm relative">
                <AvatarImage src={formData.foto || ''} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-400">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <FileUpload
                label="Foto de Perfil"
                description="Arrastra o haz click para subir la foto (JPG, PNG)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={formData.foto ? [formData.foto] : []}
                maxFiles={1}
                accept={{ 'image/*': ['.jpeg', '.png', '.gif'] }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nombre Completo</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>RUT</Label>
                <Input value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select value={formData.contrato} onValueChange={(v) => setFormData({...formData, contrato: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(contratoColors).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
