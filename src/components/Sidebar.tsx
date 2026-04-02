'use client'

import { 
  LayoutDashboard, Users, Wrench, DraftingCompass, Search, User, Package, 
  Building2, Receipt, PiggyBank, FileText, LogOut, ChevronUp, Shield, 
  UserCog, Calendar, DollarSign, AlertTriangle, Bell, Calculator, 
  CheckCircle, Scale, ClipboardCheck, QrCode, Eye, Menu, X, Home, Car, Clock
} from 'lucide-react'
import { useAppStore, type Module } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/use-session'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'

const modulePermissions: Partial<Record<Module, string>> = {
  dashboard: undefined,
  residentes: 'residentes.ver',
  ot: 'ots.ver',
  proyectos: 'proyectos.ver',
  inspecciones: 'inspecciones.ver',
  personal: 'personal.ver',
  activos: 'activos.ver',
  proveedores: 'proveedores.ver',
  gastos: 'gastos.ver',
  centrocostos: 'centros-costo.ver',
  materiales: 'catalogos.ver',
  tareas: 'catalogos.ver',
  herramientas: 'catalogos.ver',
  reportes: 'reportes.ver',
  inventario: 'inventario.ver',
  catalogos: 'catalogos.ver',
  reservas: 'reservas.ver',
  gastoscomunes: 'gastos.ver',
  morosidad: 'gastos.ver',
  notificaciones: 'usuarios.ver',
  contabilidad: 'gastos.ver',
  cumplimiento: 'cumplimiento.ver',
  auditoria: 'auditoria.ver',
  aprobacionesot: 'ots.aprobar',
  asistencia: 'personal.ver',
  rondas: 'rondas.ver',
  usuarios: 'usuarios.ver',
  vehiculos: 'activos.ver',
}

const menuItems: { section: string; items: { id: Module; label: string; icon: React.ReactNode }[] }[] = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ]
  },
  {
    section: 'Gestión',
    items: [
      { id: 'residentes', label: 'Residentes', icon: <Users className="w-4 h-4" /> },
      { id: 'reservas', label: 'Reservas', icon: <Calendar className="w-4 h-4" /> },
      { id: 'ot', label: 'Órdenes de Trabajo', icon: <Wrench className="w-4 h-4" /> },
      { id: 'aprobacionesot', label: 'Aprobaciones OT', icon: <CheckCircle className="w-4 h-4" /> },
      { id: 'proyectos', label: 'Proyectos', icon: <DraftingCompass className="w-4 h-4" /> },
      { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
      { id: 'asistencia', label: 'Control Asistencia', icon: <Clock className="w-4 h-4" /> },
      { id: 'activos', label: 'Activos', icon: <Package className="w-4 h-4" /> },
      { id: 'vehiculos', label: 'Vehículos', icon: <Car className="w-4 h-4" /> },
      { id: 'rondas', label: 'Rondas QR', icon: <QrCode className="w-4 h-4" /> },
    ]
  },
  {
    section: 'Finanzas',
    items: [
      { id: 'gastos', label: 'Gastos / Rendición', icon: <Receipt className="w-4 h-4" /> },
      { id: 'gastoscomunes', label: 'Gastos Comunes', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'morosidad', label: 'Morosidad', icon: <AlertTriangle className="w-4 h-4" /> },
      { id: 'centrocostos', label: 'Centro de Costos', icon: <PiggyBank className="w-4 h-4" /> },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { id: 'reportes', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
      { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
      { id: 'auditoria', label: 'Auditoría', icon: <ClipboardCheck className="w-4 h-4" /> },
    ]
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentModule, setCurrentModule } = useAppStore()
  const { user, logout, hasPermission, isAdmin } = useSession()
  const router = useRouter()

  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.id === 'dashboard') return true
      if (isAdmin()) return true
      const permission = modulePermissions[item.id]
      return permission ? hasPermission(permission) : false
    })
  })).filter(section => section.items.length > 0)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleNavigate = (module: Module) => {
    setCurrentModule(module)
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full bg-[#0f2040]">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">CyJ</div>
        <div>
          <div className="text-white text-[10px] font-bold uppercase leading-tight">Asesorías Integrales</div>
          <div className="text-blue-300 text-[8px] font-medium uppercase">Gestión Profesional</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-4">
          {filteredMenuItems.map((section) => (
            <div key={section.section}>
              <div className="px-3 py-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">{section.section}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all mb-0.5',
                    currentModule === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-white/50 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {user && (
        <div className="p-3 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto text-white/70 hover:bg-white/5">
                <Avatar className="h-7 w-7"><AvatarFallback className="bg-blue-600 text-white text-[10px]">{user.nombre?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-bold truncate uppercase">{user.nombre}</p>
                  <p className="text-[8px] text-white/40 uppercase">{user.rol}</p>
                </div>
                <ChevronUp className="h-3 w-3 text-white/30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#1a3155] border-white/10 text-white">
              <DropdownMenuItem className="text-[10px] uppercase font-bold focus:bg-white/10 cursor-pointer" onClick={() => handleNavigate('usuarios')}>Perfil</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-[10px] uppercase font-bold text-red-400 focus:bg-red-500/10 cursor-pointer" onClick={handleLogout}>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { loading, authenticated } = useSession()
  const isMobile = useIsMobile()

  if (loading && !authenticated) return null

  if (isMobile) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f2040] border-b border-white/10 flex items-center justify-between px-4 z-40">
          <div className="font-bold text-white text-xs uppercase tracking-widest">CyJ Gestión</div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white"><Menu className="w-5 h-5" /></Button>
        </header>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-[#0f2040] border-r-0">
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return <aside className="w-56 bg-[#0f2040] flex flex-col h-full shrink-0 border-r border-white/5"><SidebarContent /></aside>
}
