'use client'

import React, { useEffect, useState } from 'react'
import { 
  ClipboardList, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  ShieldCheck,
  CalendarDays
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts'

const complianceData = [
  { name: 'Mantenimiento', value: 85 },
  { name: 'Seguridad', value: 92 },
  { name: 'Personal', value: 78 },
  { name: 'Gastos', value: 95 },
  { name: 'Reservas', value: 88 },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    otsAbiertas: 12,
    residentesActivos: 156,
    gastosMes: 2450000,
    cumplimientoGlobal: 87.6
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard de Gestión</h1>
        <div className="text-sm text-slate-500">
          Última actualización: {new Date().toLocaleString('es-CL')}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">OTs Abiertas</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.otsAbiertas}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="mr-1 h-4 w-4" />
            <span>5% menos que el mes pasado</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Residentes</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.residentesActivos}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            <span>98% de ocupación</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Gastos del Mes</p>
              <h3 className="text-2xl font-bold text-slate-900">{APP_CONFIG.currency.format(stats.gastosMes)}</h3>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-amber-600">
            <span>Dentro del presupuesto</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Cumplimiento Global</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.cumplimientoGlobal}%</h3>
            </div>
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${stats.cumplimientoGlobal}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de Cumplimiento por Área */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Cumplimiento por Área</h3>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Cumplimiento']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 90 ? '#10b981' : entry.value >= 80 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actividades Recientes */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Actividades Críticas</h3>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { id: 1, text: 'OT #1042 requiere aprobación urgente', time: 'Hace 10 min', type: 'warning' },
              { id: 2, text: 'Ronda de seguridad completada en Sector A', time: 'Hace 25 min', type: 'success' },
              { id: 3, text: 'Gasto por reparación de bomba de agua pendiente', time: 'Hace 1 hora', type: 'info' },
              { id: 4, text: 'Reserva de Quincho confirmada para mañana', time: 'Hace 2 horas', type: 'success' },
            ].map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 border-b border-slate-50 pb-3 last:border-0">
                <div className={cn(
                  "mt-1 h-2 w-2 rounded-full shrink-0",
                  activity.type === 'warning' ? "bg-amber-500" : activity.type === 'success' ? "bg-green-500" : "bg-blue-500"
                )} />
                <div className="flex-1">
                  <p className="text-sm text-slate-900 font-medium">{activity.text}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
