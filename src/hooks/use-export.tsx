'use client'

import { useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  ExportButton, 
  ExportConfig, 
  FilterField, 
  ColumnConfig, 
  exportUtils 
} from '@/components/shared/ExportButton'

interface UseExportOptions {
  moduleName: string
  moduleLabel: string
  columns: ColumnConfig[]
  filters?: FilterField[]
  getData: () => any[]
}

export function useExport({ moduleName, moduleLabel, columns, filters, getData }: UseExportOptions) {
  const { currentCondominio } = useAppStore()

  const handleExport = useCallback(async (config: ExportConfig) => {
    const data = getData()
    
    if (data.length === 0) {
      return
    }

    // Apply filters
    let filteredData = [...data]
    
    // Filter by date range if provided
    if (config.dateFrom || config.dateTo) {
      filteredData = filteredData.filter(item => {
        const itemDate = item.fecha || item.fechaIngreso || item.fechaInicio || item.createdAt
        if (!itemDate) return false
        if (config.dateFrom && itemDate < config.dateFrom) return false
        if (config.dateTo && itemDate > config.dateTo) return false
        return true
      })
    }

    // Apply other filters
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value && value !== 'todos' && value !== 'Todas') {
        filteredData = filteredData.filter(item => item[key] === value)
      }
    })

    // Filter columns
    const selectedColumns = config.columns.length > 0 ? config.columns : columns.map(c => c.key)

    switch (config.format) {
      case 'csv':
        const csv = exportUtils.toCSV(filteredData, columns, selectedColumns)
        exportUtils.downloadFile(
          csv,
          `${moduleLabel}_${new Date().toISOString().split('T')[0]}.csv`,
          'text/csv;charset=utf-8'
        )
        break

      case 'excel':
        // For Excel, we generate a simple HTML table that Excel can open
        const excelHTML = generateExcelHTML(filteredData, columns, selectedColumns, moduleLabel, currentCondominio?.nombre)
        exportUtils.downloadFile(
          excelHTML,
          `${moduleLabel}_${new Date().toISOString().split('T')[0]}.xls`,
          'application/vnd.ms-excel'
        )
        break

      case 'pdf':
        const pdfHTML = exportUtils.generatePDFHTML(
          filteredData,
          columns,
          selectedColumns,
          moduleLabel,
          config.filters,
          currentCondominio?.nombre
        )
        exportUtils.printPDF(pdfHTML)
        break
    }
  }, [getData, columns, moduleLabel, currentCondominio])

  return {
    ExportButton: () => (
      <ExportButton
        moduleName={moduleName}
        moduleLabel={moduleLabel}
        columns={columns}
        filters={filters}
        onExport={handleExport}
        data={getData()}
        totalRecords={getData().length}
      />
    ),
    handleExport,
    exportToCSV: () => handleExport({ format: 'csv', filters: {}, columns: columns.map(c => c.key) }),
    exportToExcel: () => handleExport({ format: 'excel', filters: {}, columns: columns.map(c => c.key) }),
    exportToPDF: () => handleExport({ format: 'pdf', filters: {}, columns: columns.map(c => c.key) })
  }
}

function generateExcelHTML(
  data: any[], 
  columns: ColumnConfig[], 
  selectedColumns: string[], 
  title: string,
  condominioName?: string
): string {
  const cols = columns.filter(c => selectedColumns.includes(c.key))
  
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h1 { font-size: 14px; color: #0f2040; }
        .subtitle { font-size: 11px; color: #64748b; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0f2040; color: white; padding: 8px; text-align: left; font-weight: bold; }
        td { padding: 6px 8px; border: 1px solid #e8ecf0; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
      <h1>${condominioName || 'Asesorías Integrales CyJ'}</h1>
      <p class="subtitle">${title} – Generado el ${new Date().toLocaleDateString('es-CL')}</p>
      <br>
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
              ${cols.map(col => {
                const value = exportUtils.formatValue(item[col.key], col.key)
                const isNumber = typeof item[col.key] === 'number' && !isNaN(item[col.key])
                return `<td${isNumber ? ' class="number"' : ''}>${value}</td>`
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br>
      <p>Total de registros: ${data.length}</p>
    </body>
    </html>
  `
}

// Export types
export type { ExportConfig, FilterField, ColumnConfig }
