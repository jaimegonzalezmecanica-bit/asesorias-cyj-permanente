'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  Plus,
  Search,
  Download,
  Scan,
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'

interface PuntoRonda {
  id: string
  nombre: string
  ubicacion: string
  descripcion?: string
  codigoQr: string
  activo: boolean
  createdAt: string
}

interface RegistroRonda {
  id: string
  puntoId: string
  punto?: PuntoRonda
  usuarioId?: string
  usuarioNombre?: string
  fechaHora: string
  ubicacion?: string
  observaciones?: string
  estado: string
}

export function RondasModule() {
  const [puntos, setPuntos] = useState<PuntoRonda[]>([])
  const [registros, setRegistros] = useState<RegistroRonda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedPunto, setSelectedPunto] = useState<PuntoRonda | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [activeTab, setActiveTab] = useState<'puntos' | 'registros'>('puntos')
  
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [puntosRes, registrosRes] = await Promise.all([
        fetch('/api/rondas'),
        fetch('/api/rondas/registros'),
      ])
      if (puntosRes.ok) setPuntos(await puntosRes.json())
      if (registrosRes.ok) setRegistros(await registrosRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (codigoQr: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(codigoQr, {
        width: 300,
        margin: 2,
        color: { dark: '#0f2040', light: '#ffffff' },
      })
      setQrCodeImage(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  const handleCreatePunto = async () => {
    if (!formData.nombre || !formData.ubicacion) return
    try {
      const response = await fetch('/api/rondas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setDialogOpen(false)
        setFormData({ nombre: '', ubicacion: '', descripcion: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating punto:', error)
    }
  }

  const handleRefreshQR = async (id: string) => {
    try {
      const response = await fetch(`/api/rondas/${id}/refresh-qr`, { method: 'POST' })
      if (response.ok) {
        const updatedPunto = await response.json()
        setPuntos(puntos.map(p => p.id === id ? updatedPunto : p))
        if (selectedPunto?.id === id) {
          setSelectedPunto(updatedPunto)
          await generateQRCode(updatedPunto.codigoQr)
        }
        toast.success('Código QR actualizado')
      }
    } catch (error) {
      toast.error('Error al actualizar QR')
    }
  }

  const handleShowQR = async (punto: PuntoRonda) => {
    setSelectedPunto(punto)
    await generateQRCode(punto.codigoQr)
    setQrDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('puntos')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'puntos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600'}`}>Puntos de Ronda</button>
        <button onClick={() => setActiveTab('registros')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'registros' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600'}`}>Registro de Rondas</button>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nuevo Punto</Button>
      </div>

      {activeTab === 'puntos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {puntos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((punto) => (
            <Card key={punto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                <CardTitle className="text-base truncate">{punto.nombre}</CardTitle>
                <Badge className={punto.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100'}>{punto.activo ? 'Activo' : 'Inactivo'}</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" /> {punto.ubicacion}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleShowQR(punto)}><QrCode className="w-3 h-3 mr-2" /> Ver QR</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRefreshQR(punto.id)}><RefreshCw className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Punto</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Ubicación GPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.punto?.nombre}</TableCell>
                    <TableCell className="flex items-center gap-2"><User className="w-3 h-3" /> {r.usuarioNombre}</TableCell>
                    <TableCell className="text-xs text-slate-500"><Clock className="w-3 h-3 inline mr-1" /> {new Date(r.fechaHora).toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-xs text-blue-600 font-mono">{r.ubicacion || 'No disponible'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Código QR: {selectedPunto?.nombre}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="p-4 bg-white border rounded-xl shadow-sm"><img src={qrCodeImage} alt="QR" className="w-48 h-48" /></div>
            <p className="text-xs text-center text-slate-500">Este código es dinámico y debe ser escaneado para registrar la ronda.</p>
          </div>
          <DialogFooter><Button variant="outline" className="w-full" onClick={() => setQrDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Punto de Ronda</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} /></div>
            <div className="space-y-2"><Label>Ubicación</Label><Input value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreatePunto}>Crear Punto</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
