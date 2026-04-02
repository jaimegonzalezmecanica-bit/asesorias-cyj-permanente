
'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Plus, Pencil, Trash2, Search, Settings, Download, Upload, FileText, X, Eye, Paperclip } from 'lucide-react'
import { formatCLP, formatDate } from '@/lib/format'
import FileUpload from '@/components/shared/FileUpload'

interface Gasto {
  id: string
  descripcion: string
  categoria: string
  estado: string
  monto: number
  fecha: string | null
  propiedad: string | null
  proveedor: { razonSocial: string } | null
  nDoc: string | null
  centroCosto: string | null
  notas: string | null
  comprobante: string | null // Ahora será la URL del archivo
}

interface CajaChica {
  id: string
  saldo: number
  saldoInicial: number
}

const categoriaColors: Record<string, string> = {
  'Mantenimiento': 'bg-orange-100 text-orange-700',
  'Administración': 'bg-blue-100 text-blue-700',
  'Seguridad': 'bg-purple-100 text-purple-700',
  'Áreas Verdes': 'bg-green-100 text-green-700',
  'Limpieza': 'bg-cyan-100 text-cyan-700',
  'Reparación': 'bg-amber-100 text-amber-700',
  'Servicios Básicos': 'bg-slate-100 text-slate-700',
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'Pagado': 'bg-green-100 text-green-700',
  'Rechazado': 'bg-red-100 text-red-700',
  'En revisión': 'bg-blue-100 text-blue-700',
}

export function GastosModule() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [caja, setCaja] = useState<CajaChica | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  
  const [formData, setFormData] = useState({
    descripcion: '',
    categoria: 'Mantenimiento',
    estado: 'Pendiente',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    propiedad: '',
    proveedorId: 'none',
    nDoc: '',
    centroCosto: 'none',
    notas: '',
    comprobante: '', // URL del comprobante
  })
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const [resGastos, resCaja] = await Promise.all([
        fetch('/api/gastos'),
        fetch('/api/caja-chica')
      ])
      setGastos(await resGastos.json())
      setCaja(await resCaja.json())
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
      setFormData(prev => ({ ...prev, comprobante: url }))
      return url
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleFileRemove = async (urlToRemove: string): Promise<boolean> => {
    // Implementar lógica para eliminar archivo del servidor si es necesario
    // Por ahora, solo lo eliminamos del estado local
    setFormData(prev => ({ ...prev, comprobante: '' }))
    return true
  }

  const handleSave = async () => {
    try {
      const method = editingGasto ? 'PUT' : 'POST'
      const url = editingGasto ? `/api/gastos/${editingGasto.id}` : '/api/gastos'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving gasto:', error)
    }
  }

  const openDialog = (gasto?: Gasto) => {
    if (gasto) {
      setEditingGasto(gasto)
      setFormData({
        descripcion: gasto.descripcion,
        categoria: gasto.categoria,
        estado: gasto.estado,
        monto: gasto.monto,
        fecha: gasto.fecha || new Date().toISOString().split('T')[0],
        propiedad: gasto.propiedad || '',
        proveedorId: (gasto as any).proveedorId || 'none',
        nDoc: gasto.nDoc || '',
        centroCosto: gasto.centroCosto || 'none',
        notas: gasto.notas || '',
        comprobante: gasto.comprobante || '',
      })
    } else {
      setEditingGasto(null)
      setFormData({
        descripcion: '',
        categoria: 'Mantenimiento',
        estado: 'Pendiente',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        propiedad: '',
        proveedorId: 'none',
        nDoc: '',
        centroCosto: 'none',
        notas: '',
        comprobante: '',
      })
    }
    setDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-[#0f2040] to-[#1a3460] text-white">
        <CardContent className="p-5">
          <div className="text-xs opacity-70 mb-1">Saldo actual de Caja Chica</div>
          <div className="text-3xl font-bold">{formatCLP(caja?.saldo || 0)}</div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar gasto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Gasto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Cargando...</div>
        ) : (
          gastos.map((g) => (
            <Card key={g.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDialog(g)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={estadoColors[g.estado]}>{g.estado}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(g.fecha)}</span>
                </div>
                <CardTitle className="text-base mt-2 truncate">{g.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{g.categoria}</span>
                  <span className="font-bold text-slate-900">{formatCLP(g.monto)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold">
                  <FileText className="w-3 h-3" /> {g.nDoc || 'Sin documento'}
                  {g.comprobante && <Paperclip className="w-3 h-3 ml-auto text-blue-500" />}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGasto ? 'Editar' : 'Nuevo'} Gasto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Descripción</Label>
                <Input value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
              </div>
            </div>
            
            {/* Comprobante Section (Req 15) */}
            <div className="space-y-2 border-t pt-4">
              <FileUpload
                label="Comprobante / Respaldo"
                description="Arrastra o haz click para subir el comprobante (PDF, JPG, PNG)"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                currentFiles={formData.comprobante ? [formData.comprobante] : []}
                maxFiles={1}
                accept={{ 'image/*': ['.jpeg', '.png', '.gif'], 'application/pdf': ['.pdf'] }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
