import { Download, FileArchive, FileText, Database, Code, Server, Shield, Users, Wrench, DollarSign, BarChart3, Calendar, Bell, FileCheck, ClipboardList, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DescargarPage() {
  const archivos = [
    {
      nombre: 'SISTEMA_CYJ_RESPALDO_COMPLETO.tar.gz',
      tamano: '2.2 MB',
      descripcion: 'Código fuente completo del sistema',
      url: '/descargas/SISTEMA_CYJ_RESPALDO_COMPLETO.tar.gz',
      principal: true,
    },
    {
      nombre: 'DOCUMENTACION_SISTEMA_CYJ.md',
      tamano: '12 KB',
      descripcion: 'Documentación técnica completa',
      url: '/descargas/DOCUMENTACION_SISTEMA_CYJ.md',
      principal: false,
    },
    {
      nombre: 'INSTRUCCIONES_IMPLEMENTACION.txt',
      tamano: '7 KB',
      descripcion: 'Guía paso a paso de instalación',
      url: '/descargas/INSTRUCCIONES_IMPLEMENTACION.txt',
      principal: false,
    },
    {
      nombre: 'schema.prisma',
      tamano: '37 KB',
      descripcion: 'Esquema de base de datos Prisma',
      url: '/descargas/schema.prisma',
      principal: false,
    },
  ]

  const modulos = [
    { nombre: 'Dashboard', icon: BarChart3, desc: 'Estadísticas y métricas' },
    { nombre: 'Propiedades', icon: Database, desc: 'Gestión de unidades' },
    { nombre: 'Residentes', icon: Users, desc: 'Importación Excel' },
    { nombre: 'Personal', icon: Users, desc: 'Liquidaciones' },
    { nombre: 'Órdenes de Trabajo', icon: Wrench, desc: 'Control completo' },
    { nombre: 'Gastos', icon: DollarSign, desc: 'Rendiciones' },
    { nombre: 'Contabilidad', icon: FileText, desc: 'Plan de cuentas' },
    { nombre: 'Reservas', icon: Calendar, desc: 'Espacios comunes' },
    { nombre: 'Notificaciones', icon: Bell, desc: 'Alertas' },
    { nombre: 'Auditoría', icon: FileCheck, desc: 'Control interno' },
    { nombre: 'Cumplimiento', icon: ClipboardList, desc: 'Obligaciones legales' },
    { nombre: 'Configuración', icon: Settings, desc: 'Parámetros' },
  ]

  const tecnologias = [
    'Next.js 16', 'TypeScript 5', 'Prisma ORM', 'shadcn/ui', 
    'Tailwind CSS 4', 'Zustand', 'SQLite/PostgreSQL', 'Recharts'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0A1172] to-[#080d54] rounded-2xl mb-4 overflow-hidden shadow-xl">
            <img 
              src="/logo.jpg" 
              alt="Asesorías Integrales CyJ" 
              width={64} 
              height={64}
              className="w-16 h-16 object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Gestión de Condominios
          </h1>
          <p className="text-lg text-[#0A1172] font-medium">
            Asesorías Integrales CyJ
          </p>
          <p className="text-gray-500 mt-2">
            Descarga completa del sistema para implementación
          </p>
        </div>

        {/* Archivos de descarga */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Archivos de Descarga
          </h2>
          <div className="grid gap-4">
            {archivos.map((archivo) => (
              <Card 
                key={archivo.nombre} 
                className={`${archivo.principal ? 'border-[#0A1172] border-2 bg-blue-50' : 'border-gray-200'}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${archivo.principal ? 'bg-[#0A1172] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{archivo.nombre}</span>
                        <Badge variant={archivo.principal ? 'default' : 'secondary'}>
                          {archivo.tamano}
                        </Badge>
                        {archivo.principal && (
                          <Badge className="bg-green-600">Principal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{archivo.descripcion}</p>
                    </div>
                  </div>
                  <Button asChild className={archivo.principal ? 'bg-[#0A1172] hover:bg-[#080d54]' : ''}>
                    <a href={archivo.url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Módulos incluidos */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Módulos Incluidos (36)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {modulos.map((modulo) => (
              <Card key={modulo.nombre} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <modulo.icon className="w-5 h-5 text-[#0A1172]" />
                  <div>
                    <p className="font-medium text-sm">{modulo.nombre}</p>
                    <p className="text-xs text-gray-500">{modulo.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            + 24 módulos adicionales | 123 endpoints API | 52 componentes UI
          </p>
        </div>

        {/* Tecnologías */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Tecnologías
          </h2>
          <div className="flex flex-wrap gap-2">
            {tecnologias.map((tech) => (
              <Badge key={tech} variant="outline" className="text-sm py-1 px-3">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Credenciales */}
        <Card className="mb-12 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Credenciales de Acceso
            </CardTitle>
            <CardDescription>
              Credenciales por defecto para el primer acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded border">admin@cyjcondominios.cl</code>
              </div>
              <div>
                <span className="font-medium text-gray-600">Contraseña:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded border">admin123</code>
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-3">
              ⚠️ Cambiar la contraseña inmediatamente después del primer acceso
            </p>
          </CardContent>
        </Card>

        {/* Instrucciones rápidas */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-lg">Instrucciones Rápidas de Instalación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
              <div className="text-green-400"># 1. Descomprimir el archivo</div>
              <div>tar -xzvf SISTEMA_CYJ_RESPALDO_COMPLETO.tar.gz</div>
              <div className="text-green-400 mt-4"># 2. Instalar dependencias</div>
              <div>bun install</div>
              <div className="text-green-400 mt-4"># 3. Configurar base de datos</div>
              <div>bunx prisma generate</div>
              <div>bunx prisma db push</div>
              <div className="text-green-400 mt-4"># 4. Crear usuario administrador</div>
              <div>bun scripts/create-admin.mjs</div>
              <div className="text-green-400 mt-4"># 5. Iniciar servidor</div>
              <div>bun run dev</div>
              <div className="text-green-400 mt-4"># Abrir http://localhost:3000</div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">© 2024-2026 Asesorías Integrales CyJ. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4">
            <a href="tel:+56964650643" className="hover:text-[#0A1172]">📞 +56 964 650 643</a>
            <a href="tel:+56974408794" className="hover:text-[#0A1172]">📞 +56 974 408 794</a>
            <a href="mailto:asesoriasintegralescyj@gmail.com" className="hover:text-[#0A1172]">✉️ asesoriasintegralescyj@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  )
}
