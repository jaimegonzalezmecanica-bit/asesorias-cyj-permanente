
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Plus, Pencil, Trash2, Search, Users, UserCog, Calendar,
  FileText, Clock, CheckCircle, XCircle, UserCheck, Building2, Camera, X
} from 'lucide-react'
import { formatDate } from '@/lib/format'
import FileUpload from '@/components/shared/FileUpload'

// ============================================
// INTERFACES
// ============================================
interface MiembroComite {
  id: string
  nombre: string
  cargo: string
  unidad: string | null
  rut: string | null
  telefono: string | null
  email: string | null
  foto: string | null
  fechaInicio: string | null
  fechaFin: string | null
  estado: string
  notas: string | null
}

interface SesionComite {
  id: string
  titulo: string
  tipo: string
  fecha: string
  hora: string | null
  lugar: string | null
  estado: string
  ordenDia: string | null
  acuerdos: string | null
  asistentes: string | null
  acta: string | null
  quorum: number
  notas: string | null
}

const CARGOS = ['Presidente', 'Vicepresidente', 'Secretario', 'Tesorero', 'Vocal'] as const

const cargoColors: Record<string, string> = {
  'Presidente': 'bg-amber-100 text-amber-700 border-amber-200',
  'Vicepresidente': 'bg-blue-100 text-blue-700 border-blue-200',
  'Secretario': 'bg-green-100 text-green-700 border-green-200',
  'Tesorero': 'bg-purple-100 text-purple-700 border-purple-200',
  'Vocal': 'bg-slate-100 text-slate-700 border-slate-200',
}

export function ComiteModule() {
  const [miembros, setMiembros] = useState<MiembroComite[]>([])
  const [sesiones, setSesiones] = useState<SesionComite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchMiembro, setSearchMiembro] = useState('')
  const [miembroDialogOpen, setMiembroDialogOpen] = useState(false)
  const [editingMiembro, setEditingMiembro] = useState<MiembroComite | null>(null)
  
  const [miembroForm, setMiembroForm] = useState({
    nombre: '',
    cargo: 'Vocal',
    unidad: '',
    rut: '',
    telefono: '',
    email: '',
    foto: '', // Ahora será la URL de la foto
    fechaInicio: '',
    fechaFin: '',
    estado: 'Activo',
    notas: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resMiembros, resSesiones] = await Promise.all([
        fetch('/api/comite'),
        fetch('/api/comite/sesiones')
      ])
      setMiembros(await resMiembros.json())
      setSesiones(await resSesiones.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      setMiembroForm(prev => ({ ...prev, foto: url }))
      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleFileRemove = async (urlToRemove: string): Promise<boolean> => {
    // Implementar lógica para eliminar archivo del servidor si es necesario
    // Por ahora, solo lo eliminamos del estado local
    setMiembroForm(prev => ({ ...prev, foto: '' }))
    return true
  }

  const openMiembroDialog = (miembro?: MiembroComite) => {
    if (miembro) {
      setEditingMiembro(miembro)
      setMiembroForm({
        nombre: miembro.nombre,
        cargo: miembro.cargo,
        unidad: miembro.unidad || '',
        rut: miembro.rut || '',
        telefono: miembro.telefono || '',
        email: miembro.email || '',
        foto: miembro.foto || '',
        fechaInicio: miembro.fechaInicio || '',
        fechaFin: miembro.fechaFin || '',
        estado: miembro.estado,
        notas: miembro.notas || '',
      })
    } else {
      setEditingMiembro(null)
      setMiembroForm({
        nombre: '',
        cargo: 'Vocal',
        unidad: '',
        rut: '',
        telefono: '',
        email: '',
        foto: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        estado: 'Activo',
        notas: '',
      })
    }
    setMiembroDialogOpen(true)
  }

  const handleSaveMiembro = async () => {
    if (!miembroForm.nombre.trim()) return
    try {
      const method = editingMiembro ? 'PUT' : 'POST'
      const url = editingMiembro ? `/api/comite/${editingMiembro.id}` : '/api/comite'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(miembroForm),
      })
      setMiembroDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving miembro:', error)
    }
  }

  const filteredMiembros = miembros.filter(m => 
    m.nombre.toLowerCase().includes(searchMiembro.toLowerCase()) ||
    m.cargo.toLowerCase().includes(searchMiembro.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar miembro..."
            value={searchMiembro}
            onChange={(e) => setSearchMiembro(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openMiembroDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Miembro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : filteredMiembros.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hay miembros registrados</div>
        ) : (
          filteredMiembros.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openMiembroDialog(m)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-slate-100">
                    <AvatarImage src={m.foto || ''} alt={m.nombre} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-400">
                      <Users className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{m.nombre}</h3>
                    <Badge variant="outline" className={`${cargoColors[m.cargo]} mt-1`}>{m.cargo}</Badge>
                    <p className="text-xs text-slate-500 mt-1 truncate">{m.rut || 'Sin unidad'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Inicio: {formatDate(m.fechaInicio)}</span>
                  <span className={m.estado === 'Activo' ? 'text-green-500' : 'text-slate-400'}>{m.estado}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={miembroDialogOpen} onOpenChange={setMiembroDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMiembro ? 'Editar' : 'Nuevo'} Miembro del Comité</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-2">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm relative">
                <AvatarImage src={miembroForm.foto || ''} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-400">
                  <Users className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <FileUpload
                label="Foto de Miembro"
                description="Arrastra o haz click para subir la foto (JPG, PNG)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={miembroForm.foto ? [miembroForm.foto] : []}
                maxFiles={1}
                accept={{ 'image/*': ['.jpeg', '.png', '.gif'] }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nombre Completo</Label>
                <Input value={miembroForm.nombre} onChange={(e) => setMiembroForm({...miembroForm, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={miembroForm.cargo} onValueChange={(v) => setMiembroForm({...miembroForm, cargo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARGOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidad/Dpto</Label>
                <Input value={miembroForm.unidad} onChange={(e) => setMiembroForm({...miembroForm, unidad: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMiembroDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMiembro}>Guardar Miembro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
