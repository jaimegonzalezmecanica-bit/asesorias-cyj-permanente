
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Printer, Filter, Wrench, Package, Receipt, DollarSign, User, Calendar, QrCode, Search, RefreshCw, Car, Shield, Clock, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCLP } from '@/lib/format'
import { useAppStore } from '@/lib/store'
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export'
import FileUpload from '@/components/shared/FileUpload'
import * as XLSX from 'xlsx'

const MODULOS_CONFIG = {
  ot: { label: 'Órdenes de Trabajo', icon: Wrench, color: 'text-orange-600 bg-orange-50' },
  gastos: { label: 'Gastos', icon: DollarSign, color: 'text-green-600 bg-green-50' },
  residentes: { label: 'Residentes', icon: User, color: 'text-purple-600 bg-purple-50' },
  activos: { label: 'Activos', icon: Package, color: 'text-indigo-600 bg-indigo-50' },
  personal: { label: 'Personal', icon: Shield, color: 'text-cyan-600 bg-cyan-50' },
  vehiculos: { label: 'Vehículos', icon: Car, color: 'text-slate-600 bg-slate-50' },
  reservas: { label: 'Reservas', icon: Calendar, color: 'text-pink-600 bg-pink-50' },
  asistencia: { label: 'Asistencia', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  rondas: { label: 'Rondas', icon: QrCode, color: 'text-violet-600 bg-violet-50' },
}

export function ReportesModule() {
  const { currentCondominio } = useAppStore()
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string>('ot')
  const [filtros, setFiltros] = useState({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    estado: 'all'
  })
  const [datos, setDatos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const exportColumns: ColumnConfig[] = useMemo(() => {
    // Define columns dynamically based on moduloSeleccionado
    switch (moduloSeleccionado) {
      case 'ot':
        return [
          { key: 'otNum', label: 'Nº OT', defaultVisible: true },
          { key: 'titulo', label: 'Título', defaultVisible: true },
          { key: 'tipo', label: 'Tipo', defaultVisible: true },
          { key: 'prioridad', label: 'Prioridad', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
          { key: 'fechaInicio', label: 'Fecha Inicio', defaultVisible: true },
          { key: 'fechaLimite', label: 'Fecha Límite', defaultVisible: true },
          { key: 'costoEstimado', label: 'Costo Estimado', defaultVisible: true },
          { key: 'progreso', label: 'Progreso', defaultVisible: true },
          { key: 'asignado.nombre', label: 'Asignado', defaultVisible: true },
          { key: 'propiedad.nombre', label: 'Propiedad', defaultVisible: true },
          { key: 'descripcion', label: 'Descripción', defaultVisible: false },
          { key: 'notas', label: 'Notas', defaultVisible: false },
        ]
      case 'gastos':
        return [
          { key: 'fecha', label: 'Fecha', defaultVisible: true },
          { key: 'concepto', label: 'Concepto', defaultVisible: true },
          { key: 'monto', label: 'Monto', defaultVisible: true },
          { key: 'tipoGasto', label: 'Tipo de Gasto', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'proveedor.razonSocial', label: 'Proveedor', defaultVisible: true },
          { key: 'centroCosto.nombre', label: 'Centro de Costo', defaultVisible: true },
          { key: 'descripcion', label: 'Descripción', defaultVisible: false },
        ]
      case 'residentes':
        return [
          { key: 'rut', label: 'RUT', defaultVisible: true },
          { key: 'nombre', label: 'Nombre', defaultVisible: true },
          { key: 'apellido', label: 'Apellido', defaultVisible: true },
          { key: 'unidad', label: 'Unidad', defaultVisible: true },
          { key: 'email', label: 'Email', defaultVisible: true },
          { key: 'telefono', label: 'Teléfono', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
        ]
      case 'activos':
        return [
          { key: 'codigo', label: 'Código', defaultVisible: true },
          { key: 'nombre', label: 'Nombre', defaultVisible: true },
          { key: 'tipo', label: 'Tipo', defaultVisible: true },
          { key: 'ubicacion', label: 'Ubicación', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'valorAdquisicion', label: 'Valor Adquisición', defaultVisible: true },
          { key: 'fechaAdquisicion', label: 'Fecha Adquisición', defaultVisible: true },
          { key: 'vidaUtil', label: 'Vida Útil (años)', defaultVisible: true },
        ]
      case 'personal':
        return [
          { key: 'rut', label: 'RUT', defaultVisible: true },
          { key: 'nombre', label: 'Nombre', defaultVisible: true },
          { key: 'apellido', label: 'Apellido', defaultVisible: true },
          { key: 'cargo', label: 'Cargo', defaultVisible: true },
          { key: 'email', label: 'Email', defaultVisible: true },
          { key: 'telefono', label: 'Teléfono', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'sueldoBase', label: 'Sueldo Base', defaultVisible: true },
        ]
      case 'vehiculos':
        return [
          { key: 'patente', label: 'Patente', defaultVisible: true },
          { key: 'marca', label: 'Marca', defaultVisible: true },
          { key: 'modelo', label: 'Modelo', defaultVisible: true },
          { key: 'tipo', label: 'Tipo', defaultVisible: true },
          { key: 'propietario.nombre', label: 'Propietario', defaultVisible: true },
          { key: 'unidad', label: 'Unidad', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
        ]
      case 'reservas':
        return [
          { key: 'titulo', label: 'Título', defaultVisible: true },
          { key: 'espacio', label: 'Espacio', defaultVisible: true },
          { key: 'fecha', label: 'Fecha', defaultVisible: true },
          { key: 'horaInicio', label: 'Hora Inicio', defaultVisible: true },
          { key: 'horaFin', label: 'Hora Fin', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'residente.nombre', label: 'Residente', defaultVisible: true },
          { key: 'monto', label: 'Monto', defaultVisible: true },
          { key: 'pagado', label: 'Pagado', defaultVisible: true },
        ]
      case 'asistencia':
        return [
          { key: 'personal.nombre', label: 'Personal', defaultVisible: true },
          { key: 'fecha', label: 'Fecha', defaultVisible: true },
          { key: 'horaEntrada', label: 'Hora Entrada', defaultVisible: true },
          { key: 'horaSalida', label: 'Hora Salida', defaultVisible: true },
          { key: 'horasTrabajadas', label: 'Horas Trabajadas', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
        ]
      case 'rondas':
        return [
          { key: 'nombre', label: 'Nombre Ronda', defaultVisible: true },
          { key: 'fecha', label: 'Fecha', defaultVisible: true },
          { key: 'horaInicio', label: 'Hora Inicio', defaultVisible: true },
          { key: 'horaFin', label: 'Hora Fin', defaultVisible: true },
          { key: 'estado', label: 'Estado', defaultVisible: true },
          { key: 'guardia.nombre', label: 'Guardia', defaultVisible: true },
          { key: 'puntosCompletados', label: 'Puntos Completados', defaultVisible: true },
          { key: 'totalPuntos', label: 'Total Puntos', defaultVisible: true },
        ]
      default:
        return []
    }
  }, [moduloSeleccionado])

  const exportFilters: FilterField[] = useMemo(() => {
    // Define filters dynamically based on moduloSeleccionado
    switch (moduloSeleccionado) {
      case 'ot':
        return [
          { key: 'tipo', label: 'Tipo', type: 'select', options: ['Correctivo', 'Preventivo', 'Mejora', 'Emergencia'] },
          { key: 'prioridad', label: 'Prioridad', type: 'select', options: ['Urgente', 'Alta', 'Media', 'Baja'] },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'En Progreso', 'Completado', 'Cancelado'] },
        ]
      case 'gastos':
        return [
          { key: 'tipoGasto', label: 'Tipo de Gasto', type: 'select', options: ['Operacional', 'Administrativo', 'Mantención', 'Inversión'] },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Pagado', 'Anulado'] },
        ]
      case 'residentes':
        return [
          { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo', 'Moroso'] },
        ]
      case 'activos':
        return [
          { key: 'tipo', label: 'Tipo', type: 'select', options: ['Mueble', 'Inmueble', 'Vehículo', 'Tecnología'] },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Operativo', 'En Reparación', 'Dado de Baja'] },
        ]
      case 'personal':
        return [
          { key: 'cargo', label: 'Cargo', type: 'text' },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Vacaciones', 'Licencia', 'Desvinculado'] },
        ]
      case 'vehiculos':
        return [
          { key: 'tipo', label: 'Tipo', type: 'select', options: ['Automóvil', 'Motocicleta', 'Camioneta', 'Bicicleta'] },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo', 'En Reparación'] },
        ]
      case 'reservas':
        return [
          { key: 'espacio', label: 'Espacio', type: 'select', options: ['Quincho', 'Sala de Eventos', 'Piscina'] },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Confirmada', 'Cancelada'] },
          { key: 'pagado', label: 'Pagado', type: 'boolean' },
        ]
      case 'asistencia':
        return [
          { key: 'estado', label: 'Estado', type: 'select', options: ['Presente', 'Ausente', 'Tardanza', 'Permiso'] },
        ]
      case 'rondas':
        return [
          { key: 'estado', label: 'Estado', type: 'select', options: ['Completada', 'Incompleta', 'Pendiente'] },
        ]
      default:
        return []
    }
  }, [moduloSeleccionado])

  const { ExportButton } = useExport({
    moduleName: moduloSeleccionado,
    moduleLabel: MODULOS_CONFIG[moduloSeleccionado as keyof typeof MODULOS_CONFIG]?.label || 'Módulo',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => datos
  })

  const fetchDatos = async () => {
    if (!currentCondominio?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        modulo: moduloSeleccionado,
        condominioId: currentCondominio.id,
        ...filtros
      })
      const response = await fetch(`/api/reportes?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setDatos(result.data || [])
      } else {
        throw new Error('Error al cargar los datos')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
      setDatos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatos()
  }, [moduloSeleccionado, filtros, currentCondominio])

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file)
  }

  const handleMassImport = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.')
      return
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar datos.')
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

        // Transform data based on the selected module
        let transformedData: any[] = []
        switch (moduloSeleccionado) {
          case 'ot':
            transformedData = json.map(item => ({
              titulo: item.Titulo || '',
              tipo: item.Tipo || 'Correctivo',
              prioridad: item.Prioridad || 'Media',
              estado: item.Estado || 'Pendiente',
              ubicacion: item.Ubicacion || null,
              fechaInicio: item['Fecha Inicio'] ? new Date(item['Fecha Inicio']).toISOString().split('T')[0] : null,
              fechaLimite: item['Fecha Límite'] ? new Date(item['Fecha Límite']).toISOString().split('T')[0] : null,
              costoEstimado: Number(item['Costo Estimado']) || 0,
              progreso: Number(item.Progreso) || 0,
              descripcion: item.Descripcion || null,
              // centroCostoId: centrosCosto.find(cc => cc.nombre === item['Centro de Costo'])?.id || null, // Requires fetching catalogs
              // asignadoId: personal.find(p => p.nombre === item.Asignado)?.id || null,
              // propiedadId: propiedades.find(prop => prop.nombre === item.Propiedad)?.id || null,
              tiempoEst: Number(item['Tiempo Estimado']) || 0,
              notas: item.Notas || null,
              esRecurrente: item.Recurrente === 'TRUE',
              formaPago: item['Forma de Pago'] || 'Gasto Común Mensual',
              condominioId: currentCondominio.id,
            }))
            break
          case 'gastos':
            transformedData = json.map(item => ({
              fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              concepto: item.Concepto || '',
              monto: Number(item.Monto) || 0,
              tipoGasto: item['Tipo de Gasto'] || 'Operacional',
              estado: item.Estado || 'Pendiente',
              // proveedorId: proveedores.find(p => p.razonSocial === item.Proveedor)?.id || null,
              // centroCostoId: centrosCosto.find(cc => cc.nombre === item['Centro de Costo'])?.id || null,
              descripcion: item.Descripcion || null,
              comprobanteUrl: item.Comprobante || null,
              condominioId: currentCondominio.id,
            }))
            break
          case 'residentes':
            transformedData = json.map(item => ({
              rut: item.RUT || '',
              nombre: item.Nombre || '',
              apellido: item.Apellido || null,
              unidad: item.Unidad || null,
              email: item.Email || null,
              telefono: item.Teléfono || null,
              estado: item.Estado || 'Activo',
              condominioId: currentCondominio.id,
            }))
            break
          case 'activos':
            transformedData = json.map(item => ({
              codigo: item.Código || '',
              nombre: item.Nombre || '',
              tipo: item.Tipo || 'Mueble',
              ubicacion: item.Ubicación || null,
              estado: item.Estado || 'Operativo',
              valorAdquisicion: Number(item['Valor Adquisición']) || 0,
              fechaAdquisicion: item['Fecha Adquisición'] ? new Date(item['Fecha Adquisición']).toISOString().split('T')[0] : null,
              vidaUtil: Number(item['Vida Útil (años)']) || 0,
              descripcion: item.Descripción || null,
              // centroCostoId: centrosCosto.find(cc => cc.nombre === item['Centro de Costo'])?.id || null,
              condominioId: currentCondominio.id,
            }))
            break
          case 'personal':
            transformedData = json.map(item => ({
              rut: item.RUT || '',
              nombre: item.Nombre || '',
              apellido: item.Apellido || null,
              cargo: item.Cargo || null,
              email: item.Email || null,
              telefono: item.Teléfono || null,
              estado: item.Estado || 'Activo',
              sueldoBase: Number(item['Sueldo Base']) || 0,
              fechaContratacion: item['Fecha Contratación'] ? new Date(item['Fecha Contratación']).toISOString().split('T')[0] : null,
              fotoUrl: item.Foto || null,
              condominioId: currentCondominio.id,
            }))
            break
          case 'vehiculos':
            transformedData = json.map(item => ({
              patente: item.Patente || '',
              marca: item.Marca || '',
              modelo: item.Modelo || '',
              tipo: item.Tipo || 'Automóvil',
              // propietarioId: residentes.find(r => r.rut === item.RUT_Propietario)?.id || null,
              unidad: item.Unidad || null,
              estado: item.Estado || 'Activo',
              condominioId: currentCondominio.id,
            }))
            break
          case 'reservas':
            transformedData = json.map(item => ({
              titulo: item.Titulo || '',
              espacio: item.Espacio || '',
              fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              horaInicio: item['Hora Inicio'] || '09:00',
              horaFin: item['Hora Fin'] || '10:00',
              estado: item.Estado || 'Pendiente',
              // residenteId: residentes.find(r => r.rut === item.RUT_Residente)?.id || null,
              monto: Number(item.Monto) || 0,
              pagado: item.Pagado === 'TRUE',
              notas: item.Notas || null,
              condominioId: currentCondominio.id,
            }))
            break
          case 'asistencia':
            transformedData = json.map(item => ({
              // personalId: personal.find(p => p.rut === item.RUT_Personal)?.id || null,
              fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              horaEntrada: item['Hora Entrada'] || null,
              horaSalida: item['Hora Salida'] || null,
              horasTrabajadas: Number(item['Horas Trabajadas']) || 0,
              estado: item.Estado || 'Presente',
              condominioId: currentCondominio.id,
            }))
            break
          case 'rondas':
            transformedData = json.map(item => ({
              nombre: item['Nombre Ronda'] || '',
              fecha: item.Fecha ? new Date(item.Fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              horaInicio: item['Hora Inicio'] || null,
              horaFin: item['Hora Fin'] || null,
              estado: item.Estado || 'Completada',
              // guardiaId: personal.find(p => p.rut === item.RUT_Guardia)?.id || null,
              puntosCompletados: Number(item['Puntos Completados']) || 0,
              totalPuntos: Number(item['Total Puntos']) || 0,
              observaciones: item.Observaciones || null,
              condominioId: currentCondominio.id,
            }))
            break
          default:
            toast.error('Módulo no soportado para importación masiva.')
            setImportLoading(false)
            return
        }

        const res = await fetch(`/api/${moduloSeleccionado}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        })

        if (!res.ok) throw new Error(await res.text())

        toast.success('Datos importados con éxito.')
        setImportDialogOpen(false)
        setImportFile(null)
        fetchDatos()
      }
      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error('Error during mass import:', error)
      toast.error('Error al importar datos. Verifica el formato del archivo y que los datos sean válidos.')
    } finally {
      setImportLoading(false)
    }
  }

  const config = MODULOS_CONFIG[moduloSeleccionado as keyof typeof MODULOS_CONFIG]

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para generar reportes.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {Object.entries(MODULOS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setModuloSeleccionado(key)}
            className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-1 ${
              moduloSeleccionado === key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <cfg.icon className={`w-5 h-5 ${moduloSeleccionado === key ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold uppercase ${moduloSeleccionado === key ? 'text-blue-700' : 'text-slate-500'}`}>{cfg.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="p-4 border-b flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /> Reporte: {config?.label}</CardTitle>
            <CardDescription>Filtra y exporta datos de {config?.label.toLowerCase()}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDatos}><RefreshCw className="w-4 h-4 mr-2" /> Actualizar</Button>
            <ExportButton />
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Desde</Label>
              <Input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Hasta</Label>
              <Input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Estado</Label>
              <Select value={filtros.estado} onValueChange={(v) => setFiltros({...filtros, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo / Completado</SelectItem>
                  <SelectItem value="Pendiente">Pendiente / En Proceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  {datos.length > 0 && Object.keys(datos[0]).filter(k => !['id', 'condominioId']).slice(0, 6).map(h => (
                    <TableHead key={h} className="text-[10px] uppercase font-bold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Cargando datos...</TableCell></TableRow>
                ) : datos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No se encontraron registros</TableCell></TableRow>
                ) : (
                  datos.map((row, i) => (
                    <TableRow key={i}>
                      {Object.keys(row).filter(k => !['id', 'condominioId']).slice(0, 6).map(k => (
                        <TableCell key={k} className="text-xs truncate max-w-[150px]">{String(row[k] || '-')}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Datos Masivamente ({MODULOS_CONFIG[moduloSeleccionado as keyof typeof MODULOS_CONFIG]?.label})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos para el módulo de {MODULOS_CONFIG[moduloSeleccionado as keyof typeof MODULOS_CONFIG]?.label.toLowerCase()}. Asegúrate de que las columnas coincidan con los campos esperados.</p>
            <FileUpload
              label="Archivo de Datos"
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
