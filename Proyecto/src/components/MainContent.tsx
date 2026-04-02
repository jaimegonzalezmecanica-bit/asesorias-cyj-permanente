'use client'

import { useAppStore } from '@/lib/store'
import { Dashboard } from './Dashboard'
import { CondominioModule } from './condominio/CondominioModule'
import { ResidentesModule } from './residentes/ResidentesModule'
import { ReservasModule } from './reservas/ReservasModule'
import { PersonalModule } from './personal/PersonalModule'
import { ActivosModule } from './activos/ActivosModule'
import { ProveedoresModule } from './proveedores/ProveedoresModule'
import { OrdenesTrabajoModule } from './ordenes-trabajo/OrdenesTrabajoModule'
import { GastosModule } from './gastos/GastosModule'
import { CentroCostoModule } from './centros-costo/CentroCostoModule'
import { ProyectosModule } from './proyectos/ProyectosModule'
import { InspeccionesModule } from './inspecciones/InspeccionesModule'
import { CatalogosModule } from './catalogos/CatalogosModule'
import { ReportesModule } from './reportes/ReportesModule'
import { UsuariosModule } from './usuarios/UsuariosModule'

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  condominio: 'Condominio',
  residentes: 'Residentes',
  reservas: 'Reservas de Espacios',
  ot: 'Órdenes de Trabajo',
  proyectos: 'Proyectos',
  inspecciones: 'Inspecciones',
  personal: 'Personal',
  activos: 'Activos',
  proveedores: 'Proveedores',
  gastos: 'Gastos / Rendición',
  centrocostos: 'Centro de Costos',
  catalogos: 'Catálogos',
  reportes: 'Reportes',
  usuarios: 'Gestión de Usuarios',
}

export function MainContent() {
  const { currentModule } = useAppStore()

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />
      case 'condominio':
        return <CondominioModule />
      case 'residentes':
        return <ResidentesModule />
      case 'reservas':
        return <ReservasModule />
      case 'personal':
        return <PersonalModule />
      case 'activos':
        return <ActivosModule />
      case 'proveedores':
        return <ProveedoresModule />
      case 'ot':
        return <OrdenesTrabajoModule />
      case 'gastos':
        return <GastosModule />
      case 'centrocostos':
        return <CentroCostoModule />
      case 'proyectos':
        return <ProyectosModule />
      case 'inspecciones':
        return <InspeccionesModule />
      case 'catalogos':
        return <CatalogosModule />
      case 'reportes':
        return <ReportesModule />
      case 'usuarios':
        return <UsuariosModule />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 shrink-0 dark:bg-slate-900 dark:border-slate-700">
        <h1 className="text-base font-bold text-[#0f2040] dark:text-white">
          {moduleTitles[currentModule]}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-5">
        {renderModule()}
      </main>
    </div>
  )
}
