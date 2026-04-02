'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2, Search, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'

interface Residente {
  id: string
  nombre: string
  rut: string | null
  unidad: string | null
  tipo: string
  telefono: string | null
  email: string | null
  fechaIngreso: string | null
  estado: string
  notas: string | null
}

const tipoColors: Record<string, string> = {
  'Residente': 'bg-blue-100 text-blue-700',
  'Propietario': 'bg-green-100 text-green-700',
  'Arrendatario': 'bg-purple-100 text-purple-700',
  'Visita': 'bg-slate-100 text-slate-700',
}

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Moroso': 'bg-red-100 text-red-700',
  'Vacaciones': 'bg-cyan-100 text-cyan-700',
  'Licencia': 'bg-purple-100 text-purple-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
}

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

export function ResidentesModule() {
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<Residente | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    unidad: '',
    tipo: 'Residente',
    telefono: '',
    email: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'Activo',
    notas: '',
  })
  
  // Bulk upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<{
    show: boolean
    total: number
    created: number
    updated: number
    skipped: number
    errors: string[]
  } | null>(null)

  const fetchResidentes = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/residentes?search=${encodeURIComponent(searchTerm)}` : '/api/residentes'
      const res = await fetch(url)
      const data = await res.json()
      setResidentes(data)
    } catch (error) {
      console.error('Error fetching residentes:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchResidentes()
    })()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchResidentes(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (res?: Residente) => {
    if (res) {
      setEditingRes(res)
      setFormData({
        nombre: res.nombre,
        rut: res.rut || '',
        unidad: res.unidad || '',
        tipo: res.tipo,
        telefono: res.telefono || '',
        email: res.email || '',
        fechaIngreso: res.fechaIngreso || new Date().toISOString().split('T')[0],
        estado: res.estado,
        notas: res.notas || '',
      })
    } else {
      setEditingRes(null)
      setFormData({
        nombre: '',
        rut: '',
        unidad: '',
        tipo: 'Residente',
        telefono: '',
        email: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        estado: 'Activo',
        notas: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return

    try {
      if (editingRes) {
        await fetch(`/api/residentes/${editingRes.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/residentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      setDialogOpen(false)
      fetchResidentes(search)
    } catch (error) {
      console.error('Error saving residente:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este residente?')) return
    try {
      await fetch(`/api/residentes/${id}`, { method: 'DELETE' })
      fetchResidentes(search)
    } catch (error) {
      console.error('Error deleting residente:', error)
    }
  }
  
  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkUploading(true)
    setBulkResult(null)
    
    try {
      // Read Excel file using dynamic import
      const XLSX = await import('xlsx')
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Send to bulk upload API
          const response = await fetch('/api/residentes/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ residents: jsonData }),
          })
          
          const result = await response.json()
          
          setBulkResult({
            show: true,
            total: result.total,
            created: result.created,
            updated: result.updated,
            skipped: result.skipped,
            errors: result.errors || [],
          })
          
          fetchResidentes()
        } catch (error) {
          console.error('Error processing Excel:', error)
          setBulkResult({
            show: true,
            total: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: ['Error al procesar el archivo Excel'],
          })
        }
        setBulkUploading(false)
      }
      
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error reading file:', error)
      setBulkUploading(false)
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Download template
  const downloadTemplate = () => {
    const templateData = [
      { Nombre: 'Juan', Apellidos: 'Pérez García', RUT: '12.345.678-9', Casa_Depto: 'A101', Etapa: 'Etapa 1', Telefono: '+56912345678', Tipo_Residente: 'Propietario', Vehículos: 'Auto ABC-123' },
      { Nombre: 'María', Apellidos: 'López', RUT: '98.765.432-1', Casa_Depto: 'B202', Etapa: 'Etapa 2', Telefono: '+56987654321', Tipo_Residente: 'Arrendatario', Vehículos: '' },
    ]
    
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Residentes')
      XLSX.writeFile(wb, 'plantilla_residentes.xlsx')
    })
  }

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Plantilla
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={bulkUploading}
          className="flex items-center gap-2"
        >
          {bulkUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Cargar Excel
            </>
          )}
        </Button>
        
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>
      
      {/* Bulk upload result */}
      {bulkResult?.show && (
        <Card className={`border-l-4 ${bulkResult.created > 0 || bulkResult.updated > 0 ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              {bulkResult.created > 0 || bulkResult.updated > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-sm">Resultado de carga masiva</div>
                <div className="text-xs text-slate-600 mt-1">
                  Total: {bulkResult.total} | 
                  <span className="text-green-600 font-semibold ml-1">Creados: {bulkResult.created}</span> | 
                  <span className="text-blue-600 font-semibold ml-1">Actualizados: {bulkResult.updated}</span> | 
                  <span className="text-yellow-600 font-semibold ml-1">Omitidos: {bulkResult.skipped}</span>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    Errores: {bulkResult.errors.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setBulkResult(null)}>✕</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Residentes ({residentes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">RUT</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Unidad</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Teléfono</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Email</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Ingreso</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : residentes.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Sin residentes</td></tr>
                ) : (
                  residentes.map((res) => (
                    <tr key={res.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-[#0f2040] text-white text-xs font-bold">
                              {res.nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{res.nombre}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{res.rut || '–'}</td>
                      <td className="p-3 font-semibold">{res.unidad || '–'}</td>
                      <td className="p-3">
                        <Badge className={tipoColors[res.tipo] || 'bg-slate-100'}>{res.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={estadoColors[res.estado] || 'bg-slate-100'}>{res.estado}</Badge>
                      </td>
                      <td className="p-3 text-xs">{res.telefono || '–'}</td>
                      <td className="p-3 text-xs">{res.email || '–'}</td>
                      <td className="p-3 text-xs">{formatDate(res.fechaIngreso)}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(res)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(res.id)}>
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
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRes ? 'Editar' : 'Nuevo'} Residente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>RUT</Label>
                <Input placeholder="12.345.678-9" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Input value={formData.unidad} onChange={(e) => setFormData({...formData, unidad: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Residente', 'Propietario', 'Arrendatario', 'Visita'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Activo', 'Moroso', 'Vacaciones', 'Licencia', 'Inactivo'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Ingreso</Label>
                <Input type="date" value={formData.fechaIngreso} onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} />
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
