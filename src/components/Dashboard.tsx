'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Wrench, DollarSign, Users, Shield, TrendingUp, TrendingDown, Clock, Package, Car, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCLP } from '@/lib/format'

interface DashboardStats {
  otTotal: number
  otCompletadas: number
  gastosTotal: number
  gastosPendientes: number
  residentesTotal: number
  activosOperativos: number
  asistenciaHoy: number
  cumplimientoRondas: number
  totalPropiedades: number
  totalResidentes: number
  otPendientes: number
  morosos: number
  totalPersonal: number
  saldoCaja: number
}

interface DashboardState {
  data: DashboardStats | null
  loading: boolean
  error: string | null
}

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchDashboardData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error: 'Error al cargar los datos del dashboard' })
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (state.loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando dashboard...</div>

  if (state.error) return (
    <Card className="border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 mb-4">{state.error}</p>
      <Button onClick={fetchDashboardData} variant="outline">Reintentar</Button>
    </Card>
  )

  const stats = state.data!
  const cumplimientoOT = stats.otTotal > 0 ? Math.round((stats.otCompletadas / stats.otTotal) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Resumen de Cumplimiento (Req 12) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><Wrench className="w-6 h-6" /></div>
              <Badge className="bg-white/20 text-white border-none">{cumplimientoOT}%</Badge>
            </div>
            <div>
              <p className="text-sm text-blue-100 font-medium">Cumplimiento OT</p>
              <div className="flex items-end gap-2 mt-1">
                <h3 className="text-3xl font-bold">{stats.otCompletadas}</h3>
                <span className="text-xs text-blue-200 mb-1">de {stats.otTotal}</span>
              </div>
              <Progress value={cumplimientoOT} className="h-1.5 mt-3 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><DollarSign className="w-6 h-6" /></div>
              <TrendingDown className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-sm text-green-100 font-medium">Gastos del Mes</p>
              <h3 className="text-2xl font-bold mt-1">{formatCLP(stats.gastosTotal)}</h3>
              <p className="text-[10px] text-green-200 mt-2 uppercase font-bold">{stats.gastosPendientes} pendientes de pago</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-none shadow-lg">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
              <CheckCircle className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-sm text-purple-100 font-medium">Asistencia Hoy</p>
              <div className="flex items-end gap-2 mt-1">
                <h3 className="text-3xl font-bold">{stats.asistenciaHoy}%</h3>
                <span className="text-xs text-purple-200 mb-1">Personal Activo</span>
              </div>
              <Progress value={stats.asistenciaHoy} className="h-1.5 mt-3 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-none shadow-lg">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><Shield className="w-6 h-6" /></div>
              <Clock className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-sm text-orange-100 font-medium">Cumplimiento Rondas</p>
              <div className="flex items-end gap-2 mt-1">
                <h3 className="text-3xl font-bold">{stats.cumplimientoRondas}%</h3>
                <span className="text-xs text-orange-200 mb-1">Puntos Cubiertos</span>
              </div>
              <Progress value={stats.cumplimientoRondas} className="h-1.5 mt-3 bg-white/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Stats Detallado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">🏠</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Unidades</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalPropiedades}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Residentes</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalResidentes}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">🔧</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">OT Pendientes</div>
            <div className="text-2xl font-bold text-amber-600">{stats.otPendientes}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Morosos</div>
            <div className="text-2xl font-bold text-red-600">{stats.morosos}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">👤</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Personal</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalPersonal}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Caja Chica</div>
            <div className="text-sm font-bold text-slate-900">{formatCLP(stats.saldoCaja)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
