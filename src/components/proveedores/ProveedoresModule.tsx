
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Pencil, Trash2, Search, Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import FileUpload from '@/components/shared/FileUpload'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'

interface Proveedor {
  id: string
  razonSocial: string
  rut: string | null
  giro: string | null
  direccion: string | null
  comuna: string | null
  telCorp: string | null
  emailCorp: string | null
  web: string | null
  contacto: string | null
  cargo: string | null
  telDirecto: string | null
  emailContacto: string | null
  celular: string | null
  estado: string
  notas: string | null
}

const estadoColors: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Inactivo': 'bg-slate-100 text-slate-700',
  'En revisión': 'bg-yellow-100 text-yellow-700',
}

const ESTADOS_PROVEEDOR = ['Activo', 'Inactivo', 'En revisión']

export function ProveedoresModule() {
  const { currentCondominio } = useAppStore()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProv, setEditingProv] = useState<Proveedor | null>(null)
  
  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'razonSocial', label: 'Razón Social', defaultVisible: true },
    { key: 'rut', label: 'RUT', defaultVisible: true },
    { key: 'giro', label: 'Giro', defaultVisible: true },
    { key: 'direccion', label: 'Dirección', defaultVisible: true },
    { key: 'comuna', label: 'Comuna', defaultVisible: true },
    { key: 'telCorp', label: 'Tel. Corp.', defaultVisible: true },
    { key: 'emailCorp', label: 'Email Corp.', defaultVisible: true },
    { key: 'web', label: 'Web', defaultVisible: false },
    { key: 'contacto', label: 'Contacto', defaultVisible: true },
    { key: 'cargo', label: 'Cargo', defaultVisible: false },
    { key: 'telDirecto', label: 'Tel. Directo', defaultVisible: false },
    { key: 'emailContacto', label: 'Email Contacto', defaultVisible: false },
    { key: 'celular', label: 'Celular', defaultVisible: false },
    { key: 'estado', label: 'Estado', defaultVisible: true },
    { key: 'notas', label: 'Notas', defaultVisible: false },
  ], [])

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_PROVEEDOR },
  ], [])

  const { ExportButton } = useExport({
    moduleName: 'proveedores',
    moduleLabel: 'Proveedores',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => proveedores
  })

  const [formData, setFormData] = useState({
    razonSocial: '',
    rut: '',
    giro: '',
    direccion: '',
    comuna: '',
    telCorp: '',
    emailCorp: '',
    web: '',
    contacto: '',
    cargo: '',
    telDirecto: '',
    emailContacto: '',
    celular: '',
    estado: 'Activo',
    notas: '',
  })

  const fetchProveedores = async (searchTerm = '') => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const url = searchTerm ? `/api/proveedores?condominioId=${currentCondominio.id}&search=${encodeURIComponent(searchTerm)}` : `/api/proveedores?condominioId=${currentCondominio.id}`
      const res = await fetch(url)
      const data = await res.json()
      setProveedores(data)
    } catch (error) {
      console.error('Error fetching proveedores:', error)
      toast.error('Error al cargar los proveedores.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProveedores()
  }, [currentCondominio])

  useEffect(() => {
    const timeout = setTimeout(() => fetchProveedores(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const openDialog = (prov?: Proveedor) => {
    if (prov) {
      setEditingProv(prov)
      setFormData({
        razonSocial: prov.razonSocial,
        rut: prov.rut || '',
        giro: prov.giro || '',
        direccion: prov.direccion || '',
        comuna: prov.comuna || '',
        telCorp: prov.telCorp || '',
        emailCorp: prov.emailCorp || '',
        web: prov.web || '',
        contacto: prov.contacto || '',
        cargo: prov.cargo || '',
        telDirecto: prov.telDirecto || '',
        emailContacto: prov.emailContacto || '',
        celular: prov.celular || '',
        estado: prov.estado,
        notas: prov.notas || '',
      })
    } else {
      setEditingProv(null)
      setFormData({
        razonSocial: '',
        rut: '',
        giro: '',
        direccion: '',
        comuna: '',
        telCorp: '',
        emailCorp: '',
        web: '',
        contacto: '',
        cargo: '',
        telDirecto: '',
        emailContacto: '',
        celular: '',
        estado: 'Activo',
        notas: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar el proveedor.')
      return
    }
    if (!formData.razonSocial.trim()) {
      toast.error('La razón social es obligatoria.')
      return
    }

    const payload = {
      ...formData,
      condominioId: currentCondominio.id,
    }

    try {
      if (editingProv) {
        await fetch(`/api/proveedores/${editingProv.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Proveedor actualizado con éxito.')
      } else {
        await fetch('/api/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Proveedor creado con éxito.')
      }
      setDialogOpen(false)
      fetchProveedores(search)
    } catch (error) {
      console.error('Error saving proveedor:', error)
      toast.error('Error al guardar proveedor.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    try {
      await fetch(`/api/proveedores/${id}`, { method: 'DELETE' })
      toast.success('Proveedor eliminado con éxito.')
      fetchProveedores(search)
    } catch (error) {
      console.error('Error deleting proveedor:', error)
      toast.error('Error al eliminar proveedor.')
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
      toast.error('Debe seleccionar un condominio para importar proveedores.')
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
          razonSocial: item['Razón Social'] || '',
          rut: item.RUT || null,
          giro: item.Giro || null,
          direccion: item.Dirección || null,
          comuna: item.Comuna || null,
          telCorp: item['Tel. Corp.'] || null,
          emailCorp: item['Email Corp.'] || null,
          web: item.Web || null,
          contacto: item.Contacto || null,
          cargo: item.Cargo || null,
          telDirecto: item['Tel. Directo'] || null,
          emailContacto: item['Email Contacto'] || null,
          celular: item.Celular || null,
          estado: item.Estado || 'Activo',
          notas: item.Notas || null,
          condominioId: currentCondominio.id,
        }))

        const res = await fetch('/api/proveedores/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Proveedores importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchProveedores(search)
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar proveedores. Verifica el formato del archivo.')
    } finally {
      setImportLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando proveedores...</div>
  }

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar los proveedores.
      </div>
    )
  }

  return (
    <div className="space-y-5">
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
        <ExportButton />
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-1" /> Importar
        </Button>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Proveedor
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Proveedores ({proveedores.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Razón Social</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">RUT</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Contacto</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Teléfono</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Email</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                ) : proveedores.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Sin proveedores</td></tr>
                ) : (
                  proveedores.map((prov) => (
                    <tr key={prov.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-semibold">{prov.razonSocial}</td>
                      <td className="p-3">{prov.rut}</td>
                      <td className="p-3">{prov.contacto || 'N/A'}</td>
                      <td className="p-3">{prov.telCorp || prov.celular || 'N/A'}</td>
                      <td className="p-3">{prov.emailCorp || prov.emailContacto || 'N/A'}</td>
                      <td className="p-3">
                        <Badge className={estadoColors[prov.estado] || 'bg-slate-100'}>{prov.estado}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDialog(prov)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(prov.id)}>
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

      {/* Dialogo Nuevo/Editar Proveedor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProv ? 'Editar' : 'Nuevo'} Proveedor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Razón Social</Label>
              <Input value={formData.razonSocial} onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={formData.rut || ''} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Giro</Label>
              <Input value={formData.giro || ''} onChange={(e) => setFormData({ ...formData, giro: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={formData.direccion || ''} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Comuna</Label>
              <Input value={formData.comuna || ''} onChange={(e) => setFormData({ ...formData, comuna: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono Corporativo</Label>
              <Input value={formData.telCorp || ''} onChange={(e) => setFormData({ ...formData, telCorp: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email Corporativo</Label>
              <Input value={formData.emailCorp || ''} onChange={(e) => setFormData({ ...formData, emailCorp: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Web</Label>
              <Input value={formData.web || ''} onChange={(e) => setFormData({ ...formData, web: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input value={formData.contacto || ''} onChange={(e) => setFormData({ ...formData, contacto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cargo Contacto</Label>
              <Input value={formData.cargo || ''} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono Directo Contacto</Label>
              <Input value={formData.telDirecto || ''} onChange={(e) => setFormData({ ...formData, telDirecto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email Contacto</Label>
              <Input value={formData.emailContacto || ''} onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Celular Contacto</Label>
              <Input value={formData.celular || ''} onChange={(e) => setFormData({ ...formData, celular: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_PROVEEDOR.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notas</Label>
              <Textarea value={formData.notas || ''} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Proveedor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Proveedores Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los proveedores. Asegúrate de que las columnas coincidan con los campos (Razón Social, RUT, Giro, Dirección, Comuna, Tel. Corp., Email Corp., Web, Contacto, Cargo, Tel. Directo, Email Contacto, Celular, Estado, Notas).</p>
            <FileUpload
              label="Archivo de Proveedores"
              description="Arrastra o haz click para subir el archivo (XLSX, CSV)"
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
