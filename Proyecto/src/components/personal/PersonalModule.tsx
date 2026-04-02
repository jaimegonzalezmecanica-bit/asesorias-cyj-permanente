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
import { Plus, Pencil, Trash2, Search, DollarSign, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'

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
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

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
  const [editingPer, setEditingPer] = useState<Personal | null>(null)
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

  const fetchPersonal = async (searchTerm = '') => {
    setLoading(true)
    try {
      const url = searchTerm ? `/api/personal?search=${encodeURIComponent(searchTerm)}` : '/api/personal'
      const res = await fetch(url)
      const data = await res.json()
      setPersonal(data)
    } catch (error) {
      console.error('Error fetching personal:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await fetchPersonal()
    })()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchPersonal(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

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
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return

    try {
      if (editingPer) {
        await fetch(`/api/personal/${editingPer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      setDialogOpen(false)
      fetchPersonal(search)
    } catch (error) {
      console.error('Error saving personal:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado?')) return
    try {
      await fetch(`/api/personal/${id}`, { method: 'DELETE' })
      fetchPersonal(search)
    } catch (error) {
      console.error('Error deleting personal:', error)
    }
  }
  
  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setBulkUploading(true)
    setBulkResult(null)
    
    try {
      const XLSX = await import('xlsx')
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const response = await fetch('/api/personal/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff: jsonData }),
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
          
          fetchPersonal()
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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Download template
  const downloadTemplate = () => {
    const templateData = [
      { Nombre: 'Juan Pérez', RUT: '12.345.678-9', Cargo: 'Conserje', Telefono: '+56912345678', Email: 'juan@email.com', FechaIngreso: '2024-01-15', SueldoBase: 450000, Movilizacion: 30000, Colacion: 25000, AFP: 'ProVida', Salud: 'Fonasa' },
      { Nombre: 'María López', RUT: '98.765.432-1', Cargo: 'Jardinería', Telefono: '+56987654321', Email: 'maria@email.com', FechaIngreso: '2024-02-01', SueldoBase: 400000, Movilizacion: 30000, Colacion: 25000, AFP: 'Habitat', Salud: 'Consalud' },
    ]
    
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Personal')
      XLSX.writeFile(wb, 'plantilla_personal.xlsx')
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
          <CardTitle className="text-sm">Personal ({personal.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">RUT</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Cargo</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Contrato</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">AFP</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Sueldo Base</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : personal.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">Sin personal</td></tr>
                ) : (
                  personal.map((per) => (
                    <tr key={per.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-[#0f2040] text-white text-xs font-bold">
                              {per.nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{per.nombre}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{per.rut || '–'}</td>
                      <td className="p-3">{per.cargo || '–'}</td>
                      <td className="p-3">
                        <Badge className={contratoColors[per.contrato] || 'bg-slate-100'}>{per.contrato}</Badge>
                      </td>
                      <td className="p-3 text-xs">{per.afp}</td>
                      <td className="p-3 font-mono text-xs">{formatCLP(per.sueldoBase)}</td>
                      <td className="p-3">
                        <Badge className={estadoColors[per.estado] || 'bg-slate-100'}>{per.estado}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-amber-600 hover:text-amber-700" 
                            title="Descargar Liquidación"
                            onClick={() => {
                              window.open(`/api/pdf/liquidacion/${per.id}`, '_blank')
                            }}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(per)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(per.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPer ? 'Editar' : 'Nuevo'} Empleado</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>RUT</Label>
                <Input value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select value={formData.contrato} onValueChange={(v) => setFormData({...formData, contrato: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Indefinido', 'Plazo Fijo', 'Por Obra', 'Part-Time'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Ingreso</Label>
                <Input type="date" value={formData.fechaIngreso} onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Activo', 'Vacaciones', 'Licencia', 'Inactivo'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-xs font-semibold text-slate-500 mb-3">REMUNERACIÓN</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sueldo Base ($)</Label>
                  <Input type="number" value={formData.sueldoBase} onChange={(e) => setFormData({...formData, sueldoBase: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Movilización ($)</Label>
                  <Input type="number" value={formData.movilizacion} onChange={(e) => setFormData({...formData, movilizacion: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Colación ($)</Label>
                  <Input type="number" value={formData.colacion} onChange={(e) => setFormData({...formData, colacion: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Viático ($)</Label>
                  <Input type="number" value={formData.viatico} onChange={(e) => setFormData({...formData, viatico: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Asignación Familiar ($)</Label>
                  <Input type="number" value={formData.asigFamiliar} onChange={(e) => setFormData({...formData, asigFamiliar: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-xs font-semibold text-slate-500 mb-3">PREVISIÓN</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AFP</Label>
                  <Select value={formData.afp} onValueChange={(v) => setFormData({...formData, afp: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['ProVida', 'Cuprum', 'Habitat', 'Capital', 'Planvital', 'Modelo', 'Uno'].map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salud</Label>
                  <Select value={formData.salud} onValueChange={(v) => setFormData({...formData, salud: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Fonasa', 'Cruz del Norte', 'Banmédica', 'Colmena', 'Consalud', 'Vida Tres', 'MasVida'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mutual</Label>
                  <Select value={formData.mutual} onValueChange={(v) => setFormData({...formData, mutual: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['IST', 'ACHS', 'Mutual de Seguridad', 'CChC'].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CCAF</Label>
                  <Input value={formData.ccaf} onChange={(e) => setFormData({...formData, ccaf: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-xs font-semibold text-slate-500 mb-3">CONTACTO</div>
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
