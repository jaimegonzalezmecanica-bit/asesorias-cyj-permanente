'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Home, 
  Trees, 
  ArrowRight, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin,
  Users,
  Shield,
  Clock,
  Star,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

// Color principal azul
const PRIMARY_COLOR = '#1e40af' // Azul oscuro profesional
const PRIMARY_LIGHT = '#3b82f6' // Azul claro para hover
const PRIMARY_BG = 'rgba(30, 64, 175, 0.1)' // Fondo azul claro

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const servicios = [
    {
      icon: Building2,
      title: 'Administración de Condominios',
      description: 'Gestión integral de condominios con control de residentes, órdenes de trabajo, personal, proveedores y finanzas.',
      features: ['Control de residentes y propiedades', 'Gestión de órdenes de trabajo', 'Administración financiera', 'Reportes en tiempo real'],
      image: '/images/condominios.png',
    },
    {
      icon: Home,
      title: 'Corretaje de Propiedades',
      description: 'Servicios profesionales de compra, venta y arriendo de propiedades con asesoría personalizada.',
      features: ['Valuación de propiedades', 'Marketing inmobiliario', 'Asesoría legal', 'Gestión de contratos'],
      image: '/images/corretaje.png',
    },
    {
      icon: Trees,
      title: 'Mantenimiento de Áreas Verdes',
      description: 'Servicios profesionales de jardinería y mantenimiento de áreas verdes para condominios y empresas.',
      features: ['Jardinería profesional', 'Sistemas de riego', 'Poda y mantenimiento', 'Diseño paisajístico'],
      image: '/images/areas-verdes.png',
    }
  ]

  const caracteristicas = [
    {
      icon: Users,
      title: 'Equipo Profesional',
      description: 'Contamos con un equipo altamente capacitado y comprometido.'
    },
    {
      icon: Shield,
      title: 'Confianza y Seguridad',
      description: 'Años de experiencia nos respaldan en el mercado.'
    },
    {
      icon: Clock,
      title: 'Atención 24/7',
      description: 'Servicio disponible para emergencias y consultas.'
    },
    {
      icon: Star,
      title: 'Calidad Garantizada',
      description: 'Comprometidos con la excelencia en cada servicio.'
    }
  ]

  const estadisticas = [
    { valor: '15+', label: 'Años de Experiencia' },
    { valor: '50+', label: 'Condominios Administrados' },
    { valor: '500+', label: 'Clientes Satisfechos' },
    { valor: '100%', label: 'Compromiso' }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-black">
                <img 
                  src="/logo.png" 
                  alt="Asesorías Integrales CYJ" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Asesorías Integrales</h1>
                <p className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>CYJ</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#servicios" className="text-sm font-medium text-slate-600 hover:text-[#1e40af] transition-colors">
                Servicios
              </a>
              <a href="#nosotros" className="text-sm font-medium text-slate-600 hover:text-[#1e40af] transition-colors">
                Nosotros
              </a>
              <a href="#contacto" className="text-sm font-medium text-slate-600 hover:text-[#1e40af] transition-colors">
                Contacto
              </a>
              <Link href="/sistema">
                <Button className="text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  Acceder al Sistema
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#servicios" 
                className="block text-sm font-medium text-slate-600 hover:text-[#1e40af]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Servicios
              </a>
              <a 
                href="#nosotros" 
                className="block text-sm font-medium text-slate-600 hover:text-[#1e40af]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Nosotros
              </a>
              <a 
                href="#contacto" 
                className="block text-sm font-medium text-slate-600 hover:text-[#1e40af]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </a>
              <Link href="/sistema" className="block">
                <Button className="w-full text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                  Acceder al Sistema
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-4" style={{ backgroundColor: PRIMARY_BG, color: PRIMARY_COLOR, borderColor: 'rgba(30, 64, 175, 0.2)' }}>
                +15 años de experiencia
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Soluciones Integrales para{' '}
                <span style={{ color: PRIMARY_COLOR }}>
                  tu Propiedad
                </span>
              </h1>
              <p className="mt-4 md:mt-6 text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                Administración de condominios, corretaje de propiedades y mantenimiento de áreas verdes. 
                Un solo proveedor para todas tus necesidades inmobiliarias.
              </p>
              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sistema">
                  <Button size="lg" className="w-full sm:w-auto text-white text-base" style={{ backgroundColor: PRIMARY_COLOR }}>
                    Acceder al Sistema
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#contacto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 text-base">
                    Contáctanos
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/hero.png" 
                  alt="Asesorías Integrales CYJ" 
                  className="w-full h-64 md:h-80 lg:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white rounded-xl shadow-xl p-4 md:p-6 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: PRIMARY_BG }}>
                    <CheckCircle2 className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Servicio Garantizado</p>
                    <p className="text-xs text-slate-500">+500 clientes satisfechos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12" style={{ backgroundColor: PRIMARY_COLOR }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {estadisticas.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl md:text-4xl font-bold text-white">{stat.valor}</p>
                <p className="text-xs md:text-sm text-white/80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <Badge className="mb-4" style={{ backgroundColor: PRIMARY_BG, color: PRIMARY_COLOR, borderColor: 'rgba(30, 64, 175, 0.2)' }}>
              Nuestros Servicios
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900">
              Soluciones Completas para tu Propiedad
            </h2>
            <p className="mt-3 md:mt-4 text-sm md:text-lg text-slate-600 max-w-2xl mx-auto">
              Ofrecemos una gama completa de servicios inmobiliarios para satisfacer todas tus necesidades.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {servicios.map((servicio, index) => (
              <Card key={index} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={servicio.image} 
                    alt={servicio.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <servicio.icon className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl text-slate-900">{servicio.title}</CardTitle>
                  <CardDescription className="text-slate-600 text-sm">{servicio.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {servicio.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="nosotros" className="py-12 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <Badge className="mb-4" style={{ backgroundColor: PRIMARY_BG, color: PRIMARY_COLOR, borderColor: 'rgba(30, 64, 175, 0.2)' }}>
              Por qué elegirnos
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900">
              Comprometidos con la Excelencia
            </h2>
            <p className="mt-3 md:mt-4 text-sm md:text-lg text-slate-600 max-w-2xl mx-auto">
              Nuestra experiencia y dedicación nos permiten ofrecer servicios de primera calidad.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {caracteristicas.map((item, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: PRIMARY_BG }}>
                  <item.icon className="w-7 h-7" style={{ color: PRIMARY_COLOR }} />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: PRIMARY_COLOR }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            ¿Listo para Optimizar la Gestión de tu Propiedad?
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Accede a nuestro sistema de gestión integral y descubre cómo podemos ayudarte.
          </p>
          <Link href="/sistema">
            <Button size="lg" className="bg-white hover:bg-slate-50 text-base" style={{ color: PRIMARY_COLOR }}>
              Acceder al Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Info */}
            <div>
              <Badge className="mb-4" style={{ backgroundColor: PRIMARY_BG, color: PRIMARY_COLOR, borderColor: 'rgba(30, 64, 175, 0.2)' }}>
                Contáctanos
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6">
                Estamos para Ayudarte
              </h2>
              <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8">
                Contáctanos para conocer más sobre nuestros servicios y cómo podemos ayudarte 
                con la administración de tu propiedad.
              </p>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY_BG }}>
                    <MapPin className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Dirección</h3>
                    <p className="text-sm text-slate-600">Av. Principal 1234, Oficina 56<br />Ciudad, Región</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY_BG }}>
                    <Phone className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Teléfono</h3>
                    <p className="text-sm text-slate-600">+56 9 1234 5678<br />+56 2 2345 6789</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY_BG }}>
                    <Mail className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email</h3>
                    <p className="text-sm text-slate-600">contacto@asesoriascyj.cl<br />info@asesoriascyj.cl</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Envíanos un Mensaje</CardTitle>
                <CardDescription className="text-sm">Completa el formulario y nos pondremos en contacto contigo.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Nombre</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Teléfono</label>
                      <input 
                        type="tel" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Servicio de Interés</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm">
                      <option>Administración de Condominios</option>
                      <option>Corretaje de Propiedades</option>
                      <option>Mantenimiento de Áreas Verdes</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Mensaje</label>
                    <textarea 
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm resize-none"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>
                  <Button type="submit" className="w-full text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                    Enviar Mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-black">
                  <img 
                    src="/logo.png" 
                    alt="Asesorías Integrales CYJ" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Asesorías Integrales</h3>
                  <p className="text-sm" style={{ color: '#60a5fa' }}>CYJ</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-md">
                Empresa líder en administración de condominios, corretaje de propiedades y 
                mantenimiento de áreas verdes. Más de 15 años de experiencia nos respaldan.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#servicios" className="hover:text-blue-400 transition-colors">Servicios</a></li>
                <li><a href="#nosotros" className="hover:text-blue-400 transition-colors">Nosotros</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">Contacto</a></li>
                <li><Link href="/sistema" className="hover:text-blue-400 transition-colors">Sistema de Gestión</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>+56 9 1234 5678</li>
                <li>contacto@asesoriascyj.cl</li>
                <li>Av. Principal 1234, Oficina 56</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400 text-center md:text-left">
              © {new Date().getFullYear()} Asesorías Integrales CYJ. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <Link href="/sistema">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Acceder al Sistema
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
