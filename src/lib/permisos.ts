/**
 * Sistema de Permisos y Roles - Actualizado
 * Implementa: Rol Auditor (Req 2), Eliminación Cambio Condominio (Req 11), 
 * Matriz Completa de Módulos (Req 13).
 */

export type Rol = 'admin' | 'supervisor' | 'mantencion' | 'limpieza' | 'comite' | 'auditor' | 'residente' | 'usuario' | 'personal'

export interface Permisos {
  dashboard: { ver: boolean; verTodasOTs: boolean; verAprobaciones: boolean; verEstadisticas: boolean }
  ot: { ver: boolean; verAsignadas: boolean; verTodas: boolean; crear: boolean; editar: boolean; eliminar: boolean; aprobar: boolean; asignarPersonal: boolean; cambiarEstado: boolean; verCostos: boolean }
  gastos: { ver: boolean; verPropios: boolean; verTodos: boolean; crear: boolean; editar: boolean; eliminar: boolean; aprobar: boolean; necesitaAprobacion: boolean; verMontos: boolean }
  activos: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; aprobar: boolean; necesitaAprobacion: boolean }
  personal: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; gestionarUsuarios: boolean; verSueldos: boolean; asistencia: boolean }
  proveedores: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  residentes: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; verDatosContacto: boolean }
  propiedades: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  proyectos: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; verPresupuesto: boolean }
  inspecciones: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  catalogos: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  centrosCosto: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; verPresupuesto: boolean }
  reportes: { ver: boolean; exportar: boolean; verTodos: boolean; verFinancieros: boolean }
  usuarios: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; cambiarRoles: boolean }
  configuracion: { ver: boolean; editar: boolean; gestionarPermisos: boolean; gestionarBackups: boolean }
  logs: { ver: boolean; exportar: boolean }
  comite: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; verSesiones: boolean; crearSesiones: boolean; verActas: boolean }
  morosidad: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; verEstadosCuenta: boolean; generarCartas: boolean; condonar: boolean; configurarIntereses: boolean }
  reservas: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; aprobar: boolean; verTodas: boolean; calendario: boolean }
  inventario: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; ajustarStock: boolean; verMovimientos: boolean }
  portal: { ver: boolean; verEstadoCuenta: boolean; crearSolicitudes: boolean; hacerReservas: boolean; verMisOTs: boolean; pagarEnLinea: boolean }
  notificaciones: { ver: boolean; enviar: boolean; configurar: boolean; verHistorial: boolean }
  auditoria: { ver: boolean; exportar: boolean; verDetalles: boolean }
  integraciones: { ver: boolean; configurar: boolean; verPagos: boolean }
  cumplimiento: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; aprobar: boolean; verDocumentos: boolean; subirArchivos: boolean; verHistorial: boolean }
  rondas: { ver: boolean; crear: boolean; puntos: boolean; qr: boolean }
  vehiculos: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; documentos: boolean }
}

export const ROL_INFO: Record<Rol, { nombre: string; color: string; descripcion: string }> = {
  admin: {
    nombre: 'Administrador',
    color: 'red',
    descripcion: 'Acceso total al sistema y configuraciones'
  },
  supervisor: {
    nombre: 'Supervisor',
    color: 'amber',
    descripcion: 'Gestión operativa y aprobación de gastos/OT'
  },
  mantencion: {
    nombre: 'Mantención',
    color: 'blue',
    descripcion: 'Ejecución de OT y gestión de activos'
  },
  limpieza: {
    nombre: 'Limpieza',
    color: 'green',
    descripcion: 'Tareas de limpieza y rondas básicas'
  },
  comite: {
    nombre: 'Comité',
    color: 'purple',
    descripcion: 'Visualización de finanzas y aprobación de proyectos'
  },
  auditor: {
    nombre: 'Auditor',
    color: 'gray',
    descripcion: 'Visualización de reportes, logs y auditoría (Solo Lectura)'
  },
  residente: {
    nombre: 'Residente',
    color: 'teal',
    descripcion: 'Acceso al portal de copropietario y reservas'
  },
  usuario: {
    nombre: 'Usuario Estándar',
    color: 'slate',
    descripcion: 'Acceso básico a módulos asignados'
  },
  personal: {
    nombre: 'Personal Externo',
    color: 'gray',
    descripcion: 'Acceso limitado para registro de asistencia'
  }
}

const PERMISOS_BASE_LECTURA: Permisos = {
  dashboard: { ver: true, verTodasOTs: true, verAprobaciones: false, verEstadisticas: true },
  ot: { ver: true, verAsignadas: true, verTodas: true, crear: false, editar: false, eliminar: false, aprobar: false, asignarPersonal: false, cambiarEstado: false, verCostos: true },
  gastos: { ver: true, verPropios: false, verTodos: true, crear: false, editar: false, eliminar: false, aprobar: false, necesitaAprobacion: false, verMontos: true },
  activos: { ver: true, crear: false, editar: false, eliminar: false, aprobar: false, necesitaAprobacion: false },
  personal: { ver: true, crear: false, editar: false, eliminar: false, gestionarUsuarios: false, verSueldos: false, asistencia: false },
  proveedores: { ver: true, crear: false, editar: false, eliminar: false },
  residentes: { ver: true, crear: false, editar: false, eliminar: false, verDatosContacto: true },
  propiedades: { ver: true, crear: false, editar: false, eliminar: false },
  proyectos: { ver: true, crear: false, editar: false, eliminar: false, verPresupuesto: true },
  inspecciones: { ver: true, crear: false, editar: false, eliminar: false },
  catalogos: { ver: true, crear: false, editar: false, eliminar: false },
  centrosCosto: { ver: true, crear: false, editar: false, eliminar: false, verPresupuesto: true },
  reportes: { ver: true, exportar: true, verTodos: true, verFinancieros: true },
  usuarios: { ver: false, crear: false, editar: false, eliminar: false, cambiarRoles: false },
  configuracion: { ver: true, editar: false, gestionarPermisos: false, gestionarBackups: false },
  logs: { ver: true, exportar: true },
  comite: { ver: true, crear: false, editar: false, eliminar: false, verSesiones: true, crearSesiones: false, verActas: true },
  morosidad: { ver: true, crear: false, editar: false, eliminar: false, verEstadosCuenta: true, generarCartas: false, condonar: false, configurarIntereses: false },
  reservas: { ver: true, crear: false, editar: false, eliminar: false, aprobar: false, verTodas: true, calendario: true },
  inventario: { ver: true, crear: false, editar: false, eliminar: false, ajustarStock: false, verMovimientos: true },
  portal: { ver: true, verEstadoCuenta: true, crearSolicitudes: false, hacerReservas: false, verMisOTs: false, pagarEnLinea: false },
  notificaciones: { ver: true, enviar: false, configurar: false, verHistorial: true },
  auditoria: { ver: true, exportar: true, verDetalles: true },
  integraciones: { ver: false, configurar: false, verPagos: false },
  cumplimiento: { ver: true, crear: false, editar: false, eliminar: false, aprobar: false, verDocumentos: true, subirArchivos: false, verHistorial: true },
  rondas: { ver: true, crear: false, puntos: true, qr: false },
  vehiculos: { ver: true, crear: false, editar: false, eliminar: false, documentos: false }
}

export const PERMISOS_POR_ROL: Record<Rol, Permisos> = {
  admin: {
    dashboard: { ver: true, verTodasOTs: true, verAprobaciones: true, verEstadisticas: true },
    ot: { ver: true, verAsignadas: true, verTodas: true, crear: true, editar: true, eliminar: true, aprobar: true, asignarPersonal: true, cambiarEstado: true, verCostos: true },
    gastos: { ver: true, verPropios: true, verTodos: true, crear: true, editar: true, eliminar: true, aprobar: true, necesitaAprobacion: false, verMontos: true },
    activos: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true, necesitaAprobacion: false },
    personal: { ver: true, crear: true, editar: true, eliminar: true, gestionarUsuarios: true, verSueldos: true, asistencia: true },
    proveedores: { ver: true, crear: true, editar: true, eliminar: true },
    residentes: { ver: true, crear: true, editar: true, eliminar: true, verDatosContacto: true },
    propiedades: { ver: true, crear: true, editar: true, eliminar: true },
    proyectos: { ver: true, crear: true, editar: true, eliminar: true, verPresupuesto: true },
    inspecciones: { ver: true, crear: true, editar: true, eliminar: true },
    catalogos: { ver: true, crear: true, editar: true, eliminar: true },
    centrosCosto: { ver: true, crear: true, editar: true, eliminar: true, verPresupuesto: true },
    reportes: { ver: true, exportar: true, verTodos: true, verFinancieros: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true, cambiarRoles: true },
    configuracion: { ver: true, editar: true, gestionarPermisos: true, gestionarBackups: true },
    logs: { ver: true, exportar: true },
    comite: { ver: true, crear: true, editar: true, eliminar: true, verSesiones: true, crearSesiones: true, verActas: true },
    morosidad: { ver: true, crear: true, editar: true, eliminar: true, verEstadosCuenta: true, generarCartas: true, condonar: true, configurarIntereses: true },
    reservas: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true, verTodas: true, calendario: true },
    inventario: { ver: true, crear: true, editar: true, eliminar: true, ajustarStock: true, verMovimientos: true },
    portal: { ver: true, verEstadoCuenta: true, crearSolicitudes: true, hacerReservas: true, verMisOTs: true, pagarEnLinea: true },
    notificaciones: { ver: true, enviar: true, configurar: true, verHistorial: true },
    auditoria: { ver: true, exportar: true, verDetalles: true },
    integraciones: { ver: true, configurar: true, verPagos: true },
    cumplimiento: { ver: true, crear: true, editar: true, eliminar: true, aprobar: true, verDocumentos: true, subirArchivos: true, verHistorial: true },
    rondas: { ver: true, crear: true, puntos: true, qr: true },
    vehiculos: { ver: true, crear: true, editar: true, eliminar: true, documentos: true }
  },
  auditor: PERMISOS_BASE_LECTURA,
  supervisor: {
    ...PERMISOS_BASE_LECTURA,
    ot: { ...PERMISOS_BASE_LECTURA.ot, crear: true, editar: true, asignarPersonal: true, cambiarEstado: true },
    gastos: { ...PERMISOS_BASE_LECTURA.gastos, crear: true, editar: true, necesitaAprobacion: true },
    inspecciones: { ...PERMISOS_BASE_LECTURA.inspecciones, crear: true, editar: true },
    personal: { ...PERMISOS_BASE_LECTURA.personal, asistencia: true },
    reservas: { ...PERMISOS_BASE_LECTURA.reservas, crear: true, editar: true, aprobar: true }
  },
  mantencion: {
    ...PERMISOS_BASE_LECTURA,
    ot: { ...PERMISOS_BASE_LECTURA.ot, editar: true, cambiarEstado: true },
    rondas: { ...PERMISOS_BASE_LECTURA.rondas, qr: true }
  },
  limpieza: {
    ...PERMISOS_BASE_LECTURA,
    ot: { ...PERMISOS_BASE_LECTURA.ot, cambiarEstado: true },
    rondas: { ...PERMISOS_BASE_LECTURA.rondas, qr: true }
  },
  comite: {
    ...PERMISOS_BASE_LECTURA,
    comite: { ...PERMISOS_BASE_LECTURA.comite, crear: true, editar: true, crearSesiones: true },
    gastos: { ...PERMISOS_BASE_LECTURA.gastos, aprobar: true }
  },
  residente: {
    ...PERMISOS_BASE_LECTURA,
    dashboard: { ...PERMISOS_BASE_LECTURA.dashboard, ver: false },
    portal: { ...PERMISOS_BASE_LECTURA.portal, crearSolicitudes: true, hacerReservas: true, pagarEnLinea: true },
    reservas: { ...PERMISOS_BASE_LECTURA.reservas, crear: true, editar: true }
  },
  usuario: PERMISOS_BASE_LECTURA,
  personal: {
    ...PERMISOS_BASE_LECTURA,
    dashboard: { ...PERMISOS_BASE_LECTURA.dashboard, ver: false },
    personal: { ...PERMISOS_BASE_LECTURA.personal, asistencia: true }
  }
}

export function hasPermission(userRol: Rol, path: string): boolean {
  if (userRol === 'admin') return true
  const [modulo, accion] = path.split('.')
  const permisosRol = PERMISOS_POR_ROL[userRol]
  if (!permisosRol) return false
  const moduloPermisos = (permisosRol as any)[modulo]
  return moduloPermisos ? !!moduloPermisos[accion] : false
}

export function getMenuForRole(userRol: Rol) {
  const items = []
  const p = PERMISOS_POR_ROL[userRol]

  if (p.dashboard.ver) items.push({ title: 'Dashboard', icon: 'LayoutDashboard', module: 'dashboard' })
  
  // Comunidad
  if (p.residentes.ver || p.propiedades.ver || p.comite.ver || p.reservas.ver) {
    const children = []
    if (p.residentes.ver) children.push({ title: 'Residentes', module: 'residentes' })
    if (p.propiedades.ver) children.push({ title: 'Propiedades', module: 'propiedades' })
    if (p.comite.ver) children.push({ title: 'Comité', module: 'comite' })
    if (p.reservas.ver) children.push({ title: 'Reservas', module: 'reservas' })
    items.push({ title: 'Comunidad', icon: 'Building', children })
  }

  // Operaciones
  if (p.ot.ver || p.proyectos.ver || p.inspecciones.ver || p.rondas.ver || p.vehiculos.ver) {
    const children = []
    if (p.ot.ver) children.push({ title: 'Órdenes de Trabajo', module: 'ot' })
    if (p.proyectos.ver) children.push({ title: 'Proyectos', module: 'proyectos' })
    if (p.inspecciones.ver) children.push({ title: 'Inspecciones', module: 'inspecciones' })
    if (p.rondas.ver) children.push({ title: 'Rondas QR', module: 'rondas' })
    if (p.vehiculos.ver) children.push({ title: 'Vehículos', module: 'vehiculos' })
    items.push({ title: 'Operaciones', icon: 'Wrench', children })
  }

  // RRHH
  if (p.personal.ver || p.personal.asistencia) {
    const children = []
    if (p.personal.ver) children.push({ title: 'Personal', module: 'personal' })
    if (p.personal.asistencia) children.push({ title: 'Asistencia', module: 'asistencia' })
    items.push({ title: 'Recursos Humanos', icon: 'Users', children })
  }

  // Finanzas
  if (p.gastos.ver || p.centrosCosto.ver || p.morosidad.ver) {
    const children = []
    if (p.gastos.ver) children.push({ title: 'Gastos / Caja Chica', module: 'gastos' })
    if (p.centrosCosto.ver) children.push({ title: 'Centros de Costo', module: 'centrocostos' })
    if (p.morosidad.ver) children.push({ title: 'Morosidad', module: 'morosidad' })
    if (p.proveedores.ver) children.push({ title: 'Proveedores', module: 'proveedores' })
    items.push({ title: 'Finanzas', icon: 'DollarSign', children })
  }

  // Auditoría
  if (p.reportes.ver || p.auditoria.ver || p.cumplimiento.ver) {
    const children = []
    if (p.reportes.ver) children.push({ title: 'Reportes', module: 'reportes' })
    if (p.auditoria.ver) children.push({ title: 'Auditorías', module: 'auditoria' })
    if (p.cumplimiento.ver) children.push({ title: 'Cumplimiento', module: 'cumplimiento' })
    items.push({ title: 'Auditoría y Reportes', icon: 'FileBarChart', children })
  }

  if (userRol === 'admin') {
    items.push({
      title: 'Configuración',
      icon: 'Settings',
      children: [
        { title: 'Usuarios y Roles', module: 'usuarios' },
        { title: 'Catálogos Base', module: 'catalogos' },
        { title: 'Logs del Sistema', module: 'logs' },
      ]
    })
  }

  return items
}
