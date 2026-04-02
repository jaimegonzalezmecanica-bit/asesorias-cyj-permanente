import { create } from 'zustand'

export type Module = 
  | 'dashboard' 
  | 'condominio' 
  | 'residentes' 
  | 'reservas'
  | 'ot' 
  | 'proyectos' 
  | 'inspecciones' 
  | 'personal' 
  | 'activos' 
  | 'proveedores' 
  | 'gastos' 
  | 'centrocostos' 
  | 'catalogos' 
  | 'reportes'
  | 'usuarios'

interface AppState {
  currentModule: Module
  setCurrentModule: (module: Module) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: 'dashboard',
  setCurrentModule: (module) => set({ currentModule: module }),
}))
