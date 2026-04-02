import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const inspeccion = await db.inspeccion.findUnique({
      where: { id },
    })
    
    if (!inspeccion) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 })
    }

    // Parse JSON fields
    const observaciones = inspeccion.observaciones ? JSON.parse(inspeccion.observaciones) : []
    const recomendaciones = inspeccion.recomendaciones ? JSON.parse(inspeccion.recomendaciones) : []

    // Format date
    const formatDate = (d: string | null) => {
      if (!d) return '–'
      try {
        const [y, m, dd] = d.split('-')
        return `${dd}/${m}/${y}`
      } catch {
        return d
      }
    }

    // Generate HTML report that can be printed as PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inspección - ${inspeccion.titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 11px; 
      line-height: 1.4;
      padding: 20mm;
      color: #1a1a1a;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      border-bottom: 3px solid #0f2040; 
      padding-bottom: 15px; 
      margin-bottom: 20px;
    }
    .logo-section { display: flex; align-items: center; gap: 15px; }
    .logo { width: 60px; height: 60px; background: #0f2040; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .logo-text { color: white; font-size: 10px; font-weight: bold; text-align: center; }
    .company-name { font-size: 18px; font-weight: bold; color: #0f2040; }
    .company-sub { font-size: 10px; color: #666; }
    .title-section { text-align: right; }
    .doc-title { font-size: 20px; font-weight: bold; color: #0f2040; }
    .doc-subtitle { font-size: 11px; color: #666; margin-top: 5px; }
    
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 12px; 
      margin-bottom: 20px; 
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item {}
    .info-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: 600; }
    .info-value { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-top: 3px; }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
    }
    .status-Planificado { background: #dbeafe; color: #1e40af; }
    .status-En { background: #fef3c7; color: #92400e; }
    .status-Completado { background: #dcfce7; color: #166534; }
    .status-Cancelado { background: #fee2e2; color: #991b1b; }
    
    .section { margin-bottom: 20px; }
    .section-title { 
      font-size: 13px; 
      font-weight: bold; 
      color: #0f2040; 
      border-bottom: 2px solid #e5e7eb; 
      padding-bottom: 8px; 
      margin-bottom: 12px;
    }
    
    .descripcion { 
      background: white; 
      border: 1px solid #e5e7eb; 
      padding: 12px; 
      border-radius: 6px; 
      font-size: 11px;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 10px;
    }
    th, td { 
      border: 1px solid #e5e7eb; 
      padding: 8px 10px; 
      text-align: left; 
      font-size: 10px;
    }
    th { 
      background: #0f2040; 
      color: white; 
      font-weight: 600;
    }
    tr:nth-child(even) { background: #f9fafb; }
    
    .observaciones-table th { background: #f97316; }
    .recomendaciones-table th { background: #22c55e; }
    
    .signatures { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-top: 30px; 
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .signature-box { text-align: center; }
    .signature-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: 600; }
    .signature-name { font-size: 11px; font-weight: 600; margin-top: 5px; }
    .signature-img { 
      height: 60px; 
      margin: 10px auto; 
      border-bottom: 1px solid #333;
      min-width: 150px;
    }
    .signature-line { 
      border-bottom: 1px solid #333; 
      margin: 30px auto 10px; 
      width: 180px;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 20mm;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    
    @media print {
      body { padding: 15mm; }
      .footer { position: fixed; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo">
        <div class="logo-text">ASESORÍAS<br>CyJ</div>
      </div>
      <div>
        <div class="company-name">Asesorías Integrales CyJ</div>
        <div class="company-sub">Administración de Condominios</div>
      </div>
    </div>
    <div class="title-section">
      <div class="doc-title">INSPECCIÓN U OBSERVACIÓN</div>
      <div class="doc-subtitle">Documento de Control</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Tipo</div>
      <div class="info-value">${inspeccion.tipo}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Estado</div>
      <div class="info-value">
        <span class="status-badge status-${inspeccion.estado.split(' ')[0]}">${inspeccion.estado}</span>
      </div>
    </div>
    <div class="info-item">
      <div class="info-label">Fecha</div>
      <div class="info-value">${formatDate(inspeccion.fecha)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Hora</div>
      <div class="info-value">${inspeccion.hora || '–'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Ubicación</div>
      <div class="info-value">${inspeccion.ubicacion || '–'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Asignado</div>
      <div class="info-value">${inspeccion.asignado || '–'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Inspector</div>
      <div class="info-value">${inspeccion.nombreInspector || '–'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Recurrente</div>
      <div class="info-value">${inspeccion.recurrente ? 'Sí' : 'No'}</div>
    </div>
  </div>

  ${inspeccion.descripcion ? `
  <div class="section">
    <div class="section-title">Descripción</div>
    <div class="descripcion">${inspeccion.descripcion}</div>
  </div>
  ` : ''}

  ${observaciones.length > 0 ? `
  <div class="section">
    <div class="section-title">Observaciones (${observaciones.length})</div>
    <table class="observaciones-table">
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 15%">Área</th>
          <th style="width: 15%">Equipo</th>
          <th style="width: 15%">Material</th>
          <th style="width: 15%">Lugar</th>
          <th style="width: 35%">Observación</th>
        </tr>
      </thead>
      <tbody>
        ${observaciones.map((obs: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${obs.area || '–'}</td>
          <td>${obs.equipo || '–'}</td>
          <td>${obs.material || '–'}</td>
          <td>${obs.lugar || '–'}</td>
          <td>${obs.observacion || '–'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${recomendaciones.length > 0 ? `
  <div class="section">
    <div class="section-title">Recomendaciones (${recomendaciones.length})</div>
    <table class="recomendaciones-table">
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 15%">Área</th>
          <th style="width: 15%">Equipo</th>
          <th style="width: 15%">Material</th>
          <th style="width: 15%">Lugar</th>
          <th style="width: 35%">Recomendación</th>
        </tr>
      </thead>
      <tbody>
        ${recomendaciones.map((rec: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${rec.area || '–'}</td>
          <td>${rec.equipo || '–'}</td>
          <td>${rec.material || '–'}</td>
          <td>${rec.lugar || '–'}</td>
          <td>${rec.observacion || '–'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${inspeccion.notas ? `
  <div class="section">
    <div class="section-title">Notas Adicionales</div>
    <div class="descripcion">${inspeccion.notas}</div>
  </div>
  ` : ''}

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-label">Firma del Inspector</div>
      ${inspeccion.firmaInspector ? 
        `<img src="${inspeccion.firmaInspector}" class="signature-img" alt="Firma Inspector" />` :
        `<div class="signature-line"></div>`
      }
      <div class="signature-name">${inspeccion.nombreInspector || '____________________'}</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Firma del Supervisor</div>
      ${inspeccion.firmaSupervisor ? 
        `<img src="${inspeccion.firmaSupervisor}" class="signature-img" alt="Firma Supervisor" />` :
        `<div class="signature-line"></div>`
      }
      <div class="signature-name">${inspeccion.nombreSupervisor || '____________________'}</div>
    </div>
  </div>

  <div class="footer">
    <span>Generado: ${new Date().toLocaleString('es-CL')}</span>
    <span>Asesorías Integrales CyJ - Sistema de Gestión</span>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
    `

    // Return HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating inspection PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
