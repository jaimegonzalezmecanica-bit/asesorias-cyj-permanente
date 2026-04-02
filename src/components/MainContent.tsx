'use client'

import { useAppStore } from '@/lib/store'
import { Dashboard } from './Dashboard'
import { ResidentesModule } from './residentes/ResidentesModule'
import { PersonalModule } from './personal/PersonalModule'
import { AsistenciaModule } from './asistencia/AsistenciaModule'
import { ActivosModule } from './activos/ActivosModule'
import { ProveedoresModule } from './proveedores/ProveedoresModule'
import { OrdenesTrabajoModule } from './ordenes-trabajo/OrdenesTrabajoModule'
import { GastosModule } from './gastos/GastosModule'
import { CentroCostoModule } from './centros-costo/CentroCostoModule'
import { ProyectosModule } from './proyectos/ProyectosModule'
import { InspeccionesModule } from './inspecciones/InspeccionesModule'
import { CatalogosModule } from './catalogos/CatalogosModule'
import { MaterialesModule } from './materiales/MaterialesModule'
import { TareasModule } from './tareas/TareasModule'
import { ReportesModule } from './reportes/ReportesModule'
import { UsuariosModule } from './usuarios/UsuariosModule'
import { InventarioModule } from './inventario/InventarioModule'
import { HerramientasModule } from './herramientas/HerramientasModule'
import { ReservasModule } from './reservas/ReservasModule'
import { AprobacionesModule } from './aprobaciones/AprobacionesModule'
import { AprobacionesOTModule } from './aprobaciones-ot/AprobacionesOTModule'
import { GastosComunesModule } from './gastos-comunes/GastosComunesModule'
import { MorosidadModule } from './morosidad/MorosidadModule'
import { NotificacionesModule } from './notificaciones/NotificacionesModule'
import { ContabilidadModule } from './contabilidad/ContabilidadModule'
import { CumplimientoModule } from './cumplimiento/CumplimientoModule'
import { AuditoriaModule } from './auditoria/AuditoriaModule'
import { RondasModule } from './rondas/RondasModule'
import { VehiculosModule } from './vehiculos/VehiculosModule'
import { useIsMobile } from '@/hooks/use-mobile'
import { ScrollArea } from '@/components/ui/scroll-area'

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  residentes: 'Residentes',
  ot: 'Órdenes de Trabajo',
  proyectos: 'Proyectos',
  inspecciones: 'Inspecciones',
  personal: 'Personal',
  asistencia: 'Control de Asistencia',
  activos: 'Activos',
  vehiculos: 'Vehículos',
  proveedores: 'Proveedores',
  gastos: 'Gastos / Rendición',
  centrocostos: 'Centro de Costos',
  catalogos: 'Catálogos',
  materiales: 'Materiales',
  tareas: 'Tareas',
  reportes: 'Reportes',
  usuarios: 'Gestión de Usuarios',
  inventario: 'Inventario',
  herramientas: 'Herramientas',
  reservas: 'Reservas',
  aprobaciones: 'Seguimiento de Aprobaciones',
  aprobacionesot: 'Aprobaciones de Órdenes de Trabajo',
  gastoscomunes: 'Gastos Comunes',
  morosidad: 'Control de Morosidad',
  notificaciones: 'Notificaciones',
  contabilidad: 'Contabilidad',
  cumplimiento: 'Cumplimiento Legal',
  auditoria: 'Auditoría',
  rondas: 'Rondas y Control',
}

export function MainContent() {
  const { currentModule } = useAppStore()
  const isMobile = useIsMobile()

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard': return <Dashboard />
      case 'residentes': return <ResidentesModule />
      case 'personal': return <PersonalModule />
      case 'asistencia': return <AsistenciaModule />
      case 'activos': return <ActivosModule />
      case 'vehiculos': return <VehiculosModule />
      case 'proveedores': return <ProveedoresModule />
      case 'ot': return <OrdenesTrabajoModule />
      case 'gastos': return <GastosModule />
      case 'centrocostos': return <CentroCostoModule />
      case 'proyectos': return <ProyectosModule />
      case 'inspecciones': return <InspeccionesModule />
      case 'catalogos': return <CatalogosModule />
      case 'materiales': return <MaterialesModule />
      case 'tareas': return <TareasModule />
      case 'reportes': return <ReportesModule />
      case 'usuarios': return <UsuariosModule />
      case 'inventario': return <InventarioModule />
      case 'herramientas': return <HerramientasModule />
      case 'reservas': return <ReservasModule />
      case 'aprobaciones': return <AprobacionesModule />
      case 'aprobacionesot': return <AprobacionesOTModule />
      case 'gastoscomunes': return <GastosComunesModule />
      case 'morosidad': return <MorosidadModule />
      case 'notificaciones': return <NotificacionesModule />
      case 'contabilidad': return <ContabilidadModule />
      case 'cumplimiento': return <CumplimientoModule />
      case 'auditoria': return <AuditoriaModule />
      case 'rondas': return <RondasModule />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className={`h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-5 shrink-0 ${isMobile ? 'hidden' : ''}`}>
        <h1 className="text-sm font-bold text-[#0f2040] uppercase tracking-wider">
          {moduleTitles[currentModule] || 'Dashboard'}
        </h1>
      </header>
      
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
        <ScrollArea className="h-full">
          <div className={`p-3 sm:p-5 ${isMobile ? 'pb-20' : ''}`}>
            {isMobile && (
              <h1 className="text-base font-bold text-[#0f2040] mb-4 uppercase tracking-wider">
                {moduleTitles[currentModule] || 'Dashboard'}
              </h1>
            )}
            {renderModule()}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
