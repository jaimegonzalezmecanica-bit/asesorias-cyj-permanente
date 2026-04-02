'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  CheckSquare, 
  Briefcase, 
  UserCircle, 
  Clock, 
  Box, 
  Truck,
  Building2, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Users2, 
  ShieldCheck, 
  QrCode,
  LogOut
} from 'lucide-react'
import { useAppStore, Module } from '@/lib/store'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

interface NavItem {
  id: Module
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'residentes', label: 'Residentes', icon: Users },
  { id: 'reservas', label: 'Reservas', icon: Calendar },
  { id: 'ot', label: 'Ordenes de Trabajo', icon: ClipboardList },
  { id: 'aprobacionesot', label: 'Aprobaciones OT', icon: CheckSquare },
  { id: 'proyectos', label: 'Proyectos', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'asistencia', label: 'Asistencia', icon: Clock },
  { id: 'activos', label: 'Activos', icon: Box },
  { id: 'vehiculos', label: 'Vehículos', icon: Truck },
  { id: 'gastos', label: 'Gastos', icon: DollarSign },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'rondas', label: 'Rondas QR', icon: QrCode },
  { id: 'auditoria', label: 'Auditoría', icon: ShieldCheck },
]

export default function Sidebar() {
  const { currentModule, setCurrentModule, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out",
      sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold text-blue-400">CYJ Gestión</span>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentModule(item.id)
                setSidebarOpen(false)
              }}
              className={cn(
                "group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentModule === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 shrink-0",
                currentModule === item.id ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button 
            onClick={() => signOut()}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  )
}
