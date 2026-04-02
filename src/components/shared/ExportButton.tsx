'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  FileDown, FileSpreadsheet, FileText, Printer, Settings, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange'
  options?: string[]
}

export interface ColumnConfig {
  key: string
  label: string
  defaultVisible?: boolean
}

interface ExportButtonProps {
  moduleName: string
  moduleLabel: string
  filters?: FilterField[]
  columns?: ColumnConfig[]
  onExport: (config: ExportConfig) => Promise<void> | void
  data?: any[]
  totalRecords?: number
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf'
  filters: Record<string, string>
  columns: string[]
  dateFrom?: string
  dateTo?: string
}

export function ExportButton({
  moduleName,
  moduleLabel,
  filters = [],
  columns = [],
  onExport,
  data = [],
  totalRecords = 0
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(c => c.defaultVisible !== false).map(c => c.key)
  )
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await onExport({
        format: exportFormat,
        filters: selectedFilters,
        columns: selectedColumns,
        dateFrom,
        dateTo
      })
      toast.success(`Exportación a ${exportFormat.toUpperCase()} completada`)
      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar los datos')
    } finally {
      setExporting(false)
    }
  }

  const quickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true)
    try {
      await onExport({
        format,
        filters: {},
        columns: columns.map(c => c.key),
        dateFrom: '',
        dateTo: ''
      })
      toast.success(`Exportación a ${format.toUpperCase()} completada`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar los datos')
    } finally {
      setExporting(false)
    }
  }

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const selectAllColumns = () => {
    setSelectedColumns(columns.map(c => c.key))
  }

  const deselectAllColumns = () => {
    setSelectedColumns([])
  }

  return (
    <div className="flex gap-2">
      {/* Quick Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={exporting || data.length === 0}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => quickExport('excel')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickExport('csv')}>
            <FileText className="w-4 h-4 mr-2" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickExport('pdf')}>
            <Printer className="w-4 h-4 mr-2" />
            PDF / Imprimir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Export Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={data.length === 0}>
            <Settings className="w-4 h-4 mr-2" />
            Avanzado
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exportar - {moduleLabel}</DialogTitle>
            <DialogDescription>
              Configure filtros y columnas para la exportación. Total: {totalRecords || data.length} registros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Formato de exportación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Formato de Exportación</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={exportFormat === 'excel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat('excel')}
                  className="flex-1"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  type="button"
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat('csv')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat('pdf')}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Filtros de fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Fecha Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Fecha Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Filtros específicos del módulo */}
            {filters.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filtros</Label>
                <div className="grid grid-cols-2 gap-4">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1">
                      <Label className="text-xs">{filter.label}</Label>
                      {filter.type === 'select' ? (
                        <Select
                          value={selectedFilters[filter.key] || 'todos'}
                          onValueChange={(v) => setSelectedFilters(prev => ({
                            ...prev,
                            [filter.key]: v === 'todos' ? '' : v
                          }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {filter.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : filter.type === 'text' ? (
                        <Input
                          className="h-9"
                          placeholder={`Buscar ${filter.label.toLowerCase()}...`}
                          value={selectedFilters[filter.key] || ''}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            [filter.key]: e.target.value
                          }))}
                        />
                      ) : filter.type === 'date' ? (
                        <Input
                          type="date"
                          className="h-9"
                          value={selectedFilters[filter.key] || ''}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            [filter.key]: e.target.value
                          }))}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selección de columnas */}
            {columns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Columnas a Exportar</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={selectAllColumns}>
                      Todos
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={deselectAllColumns}>
                      Ninguno
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                    >
                      <Checkbox
                        checked={selectedColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Registros a exportar:</span>
                <span className="font-medium">{totalRecords || data.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Columnas seleccionadas:</span>
                <span className="font-medium">{selectedColumns.length} de {columns.length}</span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={exporting || selectedColumns.length === 0}>
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar {exportFormat.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Utility functions for export
export const exportUtils = {
  toCSV: (data: any[], columns: ColumnConfig[], selectedColumns: string[]) => {
    const cols = columns.filter(c => selectedColumns.includes(c.key))
    const headers = cols.map(c => c.label).join(',')
    
    const rows = data.map(item =>
      cols.map(col => {
        let val = exportUtils.formatValue(item[col.key], col.key)
        if (val.includes(',') || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
    ).join('\n')
    
    return '\ufeff' + headers + '\n' + rows
  },

  formatValue: (value: any, key: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date')) {
      try {
        return new Date(value).toLocaleDateString('es-CL')
      } catch { return String(value) }
    }
    if (key.toLowerCase().includes('monto') || key.toLowerCase().includes('precio') || 
        key.toLowerCase().includes('sueldo') || key.toLowerCase().includes('costo') ||
        key.toLowerCase().includes('total') || key.toLowerCase().includes('saldo')) {
      return '$' + new Intl.NumberFormat('es-CL').format(Math.round(value || 0))
    }
    return String(value)
  },

  downloadFile: (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  generatePDFHTML: (
    data: any[],
    columns: ColumnConfig[],
    selectedColumns: string[],
    title: string,
    filters: Record<string, string>,
    condominioName?: string
  ) => {
    const cols = columns.filter(c => selectedColumns.includes(c.key))
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; color: #000; }
          h1 { color: #0f2040; font-size: 14px; margin-bottom: 5px; }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 3px solid #f0a500; padding-bottom: 12px; }
          .logo { width: 40px; height: 40px; background: #0f2040; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
          .subtitle { font-size: 11px; color: #64748b; }
          .filters { background: #f8fafc; padding: 8px 12px; margin-bottom: 12px; border-radius: 4px; font-size: 9px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f2040; color: white; padding: 6px 8px; font-size: 9px; text-align: left; font-weight: bold; }
          td { padding: 5px 8px; border-bottom: 1px solid #e8ecf0; font-size: 9px; }
          tr:nth-child(even) td { background: #f8fafc; }
          .footer { margin-top: 12px; font-size: 8px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏘️</div>
          <div>
            <h1>${condominioName || 'Asesorías Integrales CyJ'}</h1>
            <p class="subtitle">${title} – Generado el ${new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>
        
        ${Object.values(filters).some(v => v) ? `
        <div class="filters">
          <strong>Filtros aplicados:</strong>
          ${Object.entries(filters).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ')}
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              ${cols.map(c => `<th>${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                ${cols.map(col => `<td>${exportUtils.formatValue(item[col.key], col.key)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Total de registros: ${data.length} | Generado: ${new Date().toLocaleString('es-CL')}
        </div>
      </body>
      </html>
    `
  },

  printPDF: (html: string) => {
    const w = window.open('', '_blank', 'width=960,height=720')
    if (w) {
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.onload = () => setTimeout(() => w.print(), 400)
    }
  }
}
