'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Users, 
  Wrench, 
  AlertTriangle, 
  User, 
  DollarSign,
  TrendingUp
} from 'lucide-react'

interface DashboardStats {
  totalPropiedades: number
  totalResidentes: number
  otPendientes: number
  otEnProgreso: number
  otCompletadas: number
  morosos: number
  totalPersonal: number
  totalActivos: number
  valorActivos: number
  saldoCaja: number
  saldoInicialCaja: number
  totalGastado: number
  gastosDelMes: number
}

interface EstadoPropiedades {
  Ocupado: number
  Disponible: number
  Arriendo: number
  Venta: number
  Mantenimiento: number
}

interface OrdenTrabajo {
  id: string
  otNum: string
  titulo: string
  prioridad: string
  estado: string
  fechaLimite: string | null
}

interface DashboardData {
  stats: DashboardStats
  estadoPropiedades: EstadoPropiedades
  recentOT: OrdenTrabajo[]
  centrosConGasto: Array<{
    id: string
    nombre: string
    presupuesto: number
    gastado: number
    porcentaje: number
  }>
}

const formatCLP = (n: number) => 
  '$' + new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

const formatDate = (d: string | null) => {
  if (!d) return '–'
  try {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  } catch {
    return d
  }
}

const priorityColors: Record<string, string> = {
  'Urgente': 'bg-red-100 text-red-700',
  'Alta': 'bg-orange-100 text-orange-700',
  'Media': 'bg-yellow-100 text-yellow-700',
  'Baja': 'bg-green-100 text-green-700',
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { stats, estadoPropiedades, recentOT, centrosConGasto } = data

  return (
    <div className="space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">🏠</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Unidades</div>
            <div className="text-2xl font-bold text-[#0f2040]">{stats.totalPropiedades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Residentes</div>
            <div className="text-2xl font-bold text-[#0f2040]">{stats.totalResidentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">🔧</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">OT Pendientes</div>
            <div className="text-2xl font-bold text-amber-600">{stats.otPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Morosos</div>
            <div className="text-2xl font-bold text-red-600">{stats.morosos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">👤</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Personal</div>
            <div className="text-2xl font-bold text-[#0f2040]">{stats.totalPersonal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Caja Chica</div>
            <div className="text-base font-bold text-[#0f2040]">{formatCLP(stats.saldoCaja)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* OT Recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4" /> OT Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">N° OT</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Título</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Prioridad</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase">F. Límite</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOT.length > 0 ? (
                    recentOT.map((ot) => (
                      <tr key={ot.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs font-bold text-[#0f2040]">{ot.otNum}</td>
                        <td className="p-3 font-medium">{ot.titulo}</td>
                        <td className="p-3">
                          <Badge className={priorityColors[ot.prioridad] || 'bg-slate-100'}>
                            {ot.prioridad}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={estadoColors[ot.estado] || 'bg-slate-100'}>
                            {ot.estado}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{formatDate(ot.fechaLimite)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Sin órdenes de trabajo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Side */}
        <div className="space-y-5">
          {/* Estado Unidades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Home className="w-4 h-4" /> Estado Unidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(estadoPropiedades).map(([estado, count]) => 
                count > 0 && (
                  <div key={estado} className="flex items-center justify-between py-1 border-b last:border-0">
                    <Badge className={
                      estado === 'Ocupado' ? 'bg-red-100 text-red-700' :
                      estado === 'Disponible' ? 'bg-green-100 text-green-700' :
                      estado === 'Arriendo' ? 'bg-purple-100 text-purple-700' :
                      estado === 'Venta' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {estado}
                    </Badge>
                    <span className="font-bold text-[#0f2040]">{count}</span>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Gastos del Mes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Gastos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">{formatCLP(stats.gastosDelMes)}</div>
              <div className="text-xs text-slate-500 mt-1">Total gastado este mes</div>
            </CardContent>
          </Card>

          {/* Centro de Costos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Centros de Costo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {centrosConGasto.slice(0, 4).map((cc) => (
                <div key={cc.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{cc.nombre}</span>
                    <span className={cc.porcentaje > 90 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                      {cc.porcentaje}%
                    </span>
                  </div>
                  <Progress value={cc.porcentaje} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
