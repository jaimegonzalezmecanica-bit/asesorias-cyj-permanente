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
import { Plus, Pencil, Trash2, Search, Settings } from 'lucide-react'

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
}

interface CajaChica {
  id: string
  saldo: number
  saldoInicial: number
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
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
  const [proveedores, setProveedores] = useState<{ id: string; razonSocial: string }[]>([])
  const [centros, setCentros] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cajaDialogOpen, setCajaDialogOpen] = useState(false)
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
  })
  const [cajaForm, setCajaForm] = useState({ saldo: 0, saldoInicial: 0 })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gastosRes, cajaRes, provRes, centrosRes] = await Promise.all([
        fetch('/api/gastos'),
        fetch('/api/caja-chica'),
        fetch('/api/proveedores'),
        fetch('/api/centros-costo'),
      ])
      setGastos(await gastosRes.json())
      const cajaData = await cajaRes.json()
      setCaja(cajaData)
      setCajaForm({ saldo: cajaData.saldo, saldoInicial: cajaData.saldoInicial })
      setProveedores(await provRes.json())
      setCentros(await centrosRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchData()
    })()
  }, [])

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
        proveedorId: (gasto.proveedor as any)?.id || 'none',
        nDoc: gasto.nDoc || '',
        centroCosto: gasto.centroCosto || 'none',
        notas: gasto.notas || '',
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
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.descripcion.trim()) return

    const dataToSend = {
      ...formData,
      proveedorId: formData.proveedorId === 'none' ? null : formData.proveedorId,
      centroCosto: formData.centroCosto === 'none' ? null : formData.centroCosto,
    }

    try {
      if (editingGasto) {
        await fetch(`/api/gastos/${editingGasto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      } else {
        await fetch('/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      }
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving gasto:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting gasto:', error)
    }
  }

  const handleSaveCaja = async () => {
    try {
      await fetch('/api/caja-chica', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cajaForm),
      })
      setCajaDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving caja:', error)
    }
  }

  const totalGastado = gastos.reduce((sum, g) => sum + g.monto, 0)

  return (
    <div className="space-y-5">
      {/* Caja Chica Card */}
      <Card className="bg-gradient-to-br from-[#0f2040] to-[#1a3460] text-white">
        <CardContent className="p-5">
          <div className="text-xs opacity-70 mb-1">Saldo actual de Caja Chica</div>
          <div className="text-3xl font-bold">{formatCLP(caja?.saldo || 0)}</div>
          <div className="text-xs opacity-60 mt-2">
            Saldo inicial: {formatCLP(caja?.saldoInicial || 0)} | Total gastado: {formatCLP(totalGastado)}
          </div>
        </CardContent>
      </Card>

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
        <Button variant="outline" onClick={() => setCajaDialogOpen(true)}>
          <Settings className="w-4 h-4 mr-1" /> Configurar Caja
        </Button>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Gasto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Registros de Gasto ({gastos.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">N° Doc.</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Fecha</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Descripción</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Categoría</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Centro Costo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Proveedor</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Monto</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : gastos.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin gastos registrados</td></tr>
                ) : (
                  [...gastos].reverse().map((g) => (
                    <tr key={g.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{g.nDoc || '–'}</td>
                      <td className="p-3 text-xs">{formatDate(g.fecha)}</td>
                      <td className="p-3">{g.descripcion}</td>
                      <td className="p-3">
                        <Badge className={categoriaColors[g.categoria] || 'bg-slate-100'}>{g.categoria}</Badge>
                      </td>
                      <td className="p-3 text-xs">{g.centroCosto || '–'}</td>
                      <td className="p-3 text-xs">{g.proveedor?.razonSocial || '–'}</td>
                      <td className="p-3 font-mono text-sm font-bold text-red-600">{formatCLP(g.monto)}</td>
                      <td className="p-3">
                        <Badge className={estadoColors[g.estado] || 'bg-slate-100'}>{g.estado}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(g)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(g.id)}>
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
          <div className="p-3 border-t flex justify-end gap-5 text-sm">
            <span>Total gastos: <b className="text-red-600">{formatCLP(totalGastado)}</b></span>
          </div>
        </CardContent>
      </Card>

      {/* Gasto Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingGasto ? 'Editar' : 'Nuevo'} Gasto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Mantenimiento', 'Administración', 'Seguridad', 'Áreas Verdes', 'Limpieza', 'Reparación', 'Servicios Básicos', 'Otro'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pendiente', 'Pagado', 'Rechazado', 'En revisión'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto ($)</Label>
                <Input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Propiedad/Área</Label>
                <Input value={formData.propiedad} onChange={(e) => setFormData({...formData, propiedad: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select value={formData.proveedorId} onValueChange={(v) => setFormData({...formData, proveedorId: v})}>
                  <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {proveedores.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>N° Boleta/Factura</Label>
                <Input value={formData.nDoc} onChange={(e) => setFormData({...formData, nDoc: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Centro de Costo</Label>
                <Select value={formData.centroCosto} onValueChange={(v) => setFormData({...formData, centroCosto: v})}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {centros.map(c => (
                      <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Caja Dialog */}
      <Dialog open={cajaDialogOpen} onOpenChange={setCajaDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurar Caja Chica</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Saldo Inicial ($)</Label>
              <Input type="number" value={cajaForm.saldoInicial} onChange={(e) => setCajaForm({...cajaForm, saldoInicial: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Saldo Actual ($)</Label>
              <Input type="number" value={cajaForm.saldo} onChange={(e) => setCajaForm({...cajaForm, saldo: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCajaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCaja}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
