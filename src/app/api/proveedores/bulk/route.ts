import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession, hasPermission } from '@/lib/auth'

// CORREGIDO: Constantes de validación
const MAX_RECORDS = 500  // Límite máximo de registros por carga
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB máximo

// POST - Bulk upload proveedores from Excel
// CORREGIDO: Agregada autenticación y validación
export async function POST(request: NextRequest) {
  try {
    // CORREGIDO: Verificar autenticación
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No autenticado',
        success: false,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ['Debe iniciar sesión para realizar esta acción']
      }, { status: 401 })
    }
    
    // CORREGIDO: Verificar permisos
    if (!hasPermission(session.user.rol, 'proveedores.crear')) {
      return NextResponse.json({ 
        error: 'No tiene permisos para cargar proveedores',
        success: false,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ['Permisos insuficientes']
      }, { status: 403 })
    }
    
    // CORREGIDO: Verificar tamaño del payload
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'Archivo demasiado grande',
        success: false,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [`El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024}MB`]
      }, { status: 400 })
    }
    
    const data = await request.json()
    const proveedores = data.proveedores || data.suppliers || data.data || []
    
    // CORREGIDO: Validar que sea array y no esté vacío
    if (!Array.isArray(proveedores) || proveedores.length === 0) {
      return NextResponse.json({ 
        error: 'No hay datos para procesar',
        success: false,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ['El archivo no contiene datos válidos']
      }, { status: 400 })
    }
    
    // CORREGIDO: Limitar cantidad de registros
    if (proveedores.length > MAX_RECORDS) {
      return NextResponse.json({ 
        error: 'Demasiados registros',
        success: false,
        total: proveedores.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [`Máximo ${MAX_RECORDS} registros por carga. Encontrados: ${proveedores.length}`]
      }, { status: 400 })
    }
    
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []
    
    // CORREGIDO: Usar transacción para consistencia
    const results = await db.$transaction(async (tx) => {
      for (let i = 0; i < proveedores.length; i++) {
        const row = proveedores[i]
        try {
          // Map Excel columns to database fields (support multiple column name variations)
          const razonSocial = row['Razón Social'] || row.razonSocial || row.RazonSocial || 
                             row.Nombre || row.nombre || row.Company || row.RAZONSOCIAL || ''
          const rut = row.RUT || row.rut || row.Rut || row.RUTProveedor || ''
          const giro = row.Giro || row.giro || row.GIRO || row.Rubro || row.rubro || 
                      row.Business || row.Actividad || ''
          const direccion = row['Dirección'] || row.Direccion || row.direccion || 
                           row.Address || row.DIRECCION || ''
          const comuna = row.Comuna || row.comuna || row.COMUNA || row.Ciudad || row.ciudad || ''
          const telCorp = row['Tel. Corp.'] || row['Tel Corp'] || row.telCorp || row.TelCorp ||
                         row.Telefono || row.telefono || row.TELÉFONO || row.Phone || ''
          const emailCorp = row['Email Corp.'] || row['Email Corp'] || row.emailCorp || row.EmailCorp ||
                          row.Email || row.email || row.EMAIL || row.Mail || ''
          const web = row.Web || row.web || row.WEB || row.Sitio || row.Website || ''
          const contacto = row.Contacto || row.contacto || row.CONTACTO || row.ContactName || 
                          row.NombreContacto || ''
          const cargo = row.Cargo || row.cargo || row.CARGO || row.Position || ''
          const telDirecto = row['Tel. Directo'] || row.TelDirecto || row.telDirecto || 
                            row.TelefonoDirecto || row.DirectPhone || ''
          const emailContacto = row['Email Contacto'] || row.EmailContacto || row.emailContacto ||
                               row.ContactEmail || ''
          const celular = row.Celular || row.celular || row.CELULAR || row.Mobile || row.Movil || ''
          const estado = row.Estado || row.estado || row.ESTADO || row.Status || 'Activo'
          const notas = row.Notas || row.notas || row.NOTAS || row.Observaciones || row.Notes || ''
          
          // Validar que tenga razón social
          if (!razonSocial || !razonSocial.toString().trim()) {
            skipped++
            errors.push(`Fila ${i + 2}: Razón Social vacía`)
            continue
          }
          
          const razonSocialStr = razonSocial.toString().trim()
          const rutStr = rut ? rut.toString().trim() : null
          
          // Check if exists by RUT or RazonSocial
          const existing = await tx.proveedor.findFirst({
            where: {
              OR: [
                ...(rutStr ? [{ rut: rutStr }] : []),
                { razonSocial: razonSocialStr }
              ]
            }
          })
          
          const proveedorData = {
            razonSocial: razonSocialStr,
            rut: rutStr,
            giro: giro ? giro.toString().trim() : null,
            direccion: direccion ? direccion.toString().trim() : null,
            comuna: comuna ? comuna.toString().trim() : null,
            telCorp: telCorp ? telCorp.toString().trim() : null,
            emailCorp: emailCorp ? emailCorp.toString().trim() : null,
            web: web ? web.toString().trim() : null,
            contacto: contacto ? contacto.toString().trim() : null,
            cargo: cargo ? cargo.toString().trim() : null,
            telDirecto: telDirecto ? telDirecto.toString().trim() : null,
            emailContacto: emailContacto ? emailContacto.toString().trim() : null,
            celular: celular ? celular.toString().trim() : null,
            estado: ['Activo', 'Inactivo', 'En revisión'].includes(estado) ? estado : 'Activo',
            notas: notas ? notas.toString().trim() : null,
          }
          
          if (existing) {
            // Update existing - only update non-empty fields
            await tx.proveedor.update({
              where: { id: existing.id },
              data: {
                razonSocial: proveedorData.razonSocial,
                ...(proveedorData.rut && { rut: proveedorData.rut }),
                ...(proveedorData.giro && { giro: proveedorData.giro }),
                ...(proveedorData.direccion && { direccion: proveedorData.direccion }),
                ...(proveedorData.comuna && { comuna: proveedorData.comuna }),
                ...(proveedorData.telCorp && { telCorp: proveedorData.telCorp }),
                ...(proveedorData.emailCorp && { emailCorp: proveedorData.emailCorp }),
                ...(proveedorData.web && { web: proveedorData.web }),
                ...(proveedorData.contacto && { contacto: proveedorData.contacto }),
                ...(proveedorData.cargo && { cargo: proveedorData.cargo }),
                ...(proveedorData.telDirecto && { telDirecto: proveedorData.telDirecto }),
                ...(proveedorData.emailContacto && { emailContacto: proveedorData.emailContacto }),
                ...(proveedorData.celular && { celular: proveedorData.celular }),
                estado: proveedorData.estado,
                ...(proveedorData.notas && { notas: proveedorData.notas }),
              }
            })
            updated++
          } else {
            // Create new
            await tx.proveedor.create({
              data: proveedorData
            })
            created++
          }
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          errors.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          skipped++
        }
      }
      
      return { created, updated, skipped }
    }, {
      // CORREGIDO: Configuración de transacción con timeout
      maxWait: 10000,  // 10 segundos esperando conexión
      timeout: 30000,  // 30 segundos máximo de ejecución
    })
    
    return NextResponse.json({
      success: true,
      total: proveedores.length,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errors: errors.slice(0, 20) // Limit errors to first 20
    })
  } catch (error) {
    console.error('Error bulk uploading proveedores:', error)
    return NextResponse.json({ 
      error: 'Error al procesar carga masiva',
      success: false,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    }, { status: 500 })
  }
}

// GET - Download template
export async function GET() {
  // Return template structure
  const template = [
    {
      'Razón Social': 'Empresa Ejemplo S.A.',
      'RUT': '76.123.456-7',
      'Giro': 'Servicios de Mantenimiento',
      'Dirección': 'Av. Principal 123',
      'Comuna': 'Santiago',
      'Tel. Corp.': '+56 2 2345 6789',
      'Email Corp.': 'contacto@empresa.cl',
      'Web': 'www.empresa.cl',
      'Contacto': 'Juan Pérez',
      'Cargo': 'Gerente Comercial',
      'Tel. Directo': '+56 2 2345 6790',
      'Email Contacto': 'jperez@empresa.cl',
      'Celular': '+56 9 1234 5678',
      'Estado': 'Activo',
      'Notas': 'Proveedor preferente para servicios eléctricos'
    },
    {
      'Razón Social': 'Otra Empresa Ltda.',
      'RUT': '77.654.321-8',
      'Giro': 'Fontanería',
      'Dirección': 'Calle Secundaria 456',
      'Comuna': 'Providencia',
      'Tel. Corp.': '+56 2 2432 1098',
      'Email Corp.': 'info@otraempresa.cl',
      'Web': '',
      'Contacto': 'María García',
      'Cargo': 'Jefa de Ventas',
      'Tel. Directo': '',
      'Email Contacto': 'mgarcia@otraempresa.cl',
      'Celular': '+56 9 8765 4321',
      'Estado': 'Activo',
      'Notas': ''
    }
  ]
  
  return NextResponse.json({ 
    template,
    columns: [
      'Razón Social (obligatorio)',
      'RUT',
      'Giro',
      'Dirección',
      'Comuna',
      'Tel. Corp.',
      'Email Corp.',
      'Web',
      'Contacto',
      'Cargo',
      'Tel. Directo',
      'Email Contacto',
      'Celular',
      'Estado (Activo/Inactivo/En revisión)',
      'Notas'
    ],
    // CORREGIDO: Agregar información de límites
    limits: {
      maxRecords: MAX_RECORDS,
      maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  })
}
