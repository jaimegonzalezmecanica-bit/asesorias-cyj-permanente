import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Module = 
  | 'dashboard' 
  | 'residentes' 
  | 'ot' 
  | 'proyectos' 
  | 'inspecciones' 
  | 'personal' 
  | 'asistencia'
  | 'activos' 
  | 'proveedores' 
  | 'gastos' 
  | 'centrocostos' 
  | 'materiales'
  | 'tareas'
  | 'herramientas'
  | 'reportes'
  | 'usuarios'
  | 'inventario'
  | 'catalogos'
  | 'reservas'
  | 'aprobaciones'
  | 'aprobacionesot'
  | 'gastoscomunes'
  | 'morosidad'
  | 'notificaciones'
  | 'contabilidad'
  | 'cumplimiento'
  | 'auditoria'
  | 'rondas'

export interface CondominioInfo {
  id: string
  nombre: string
  direccion?: string | null
  comuna?: string | null
}

interface AppState {
  currentModule: Module
  setCurrentModule: (module: Module) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  currentCondominio: CondominioInfo | null
  setCurrentCondominio: (condominio: CondominioInfo | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentModule: 'dashboard',
      setCurrentModule: (module) => set({ currentModule: module }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      currentCondominio: null,
      setCurrentCondominio: (condominio) => set({ currentCondominio: condominio }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ 
        currentModule: state.currentModule,
        currentCondominio: state.currentCondominio 
      }),
    }
  )
)
