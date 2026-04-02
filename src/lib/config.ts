export const APP_CONFIG = {
  currency: {
    code: 'CLP',
    symbol: '$',
    locale: 'es-CL',
    format: (value: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(value).replace('$', '$ ')
    }
  },
  time: {
    increments: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8]
  },
  roles: ['Admin', 'Supervisor', 'Operador', 'Auditor'],
  permissions: {
    Admin: ['*'],
    Supervisor: ['dashboard', 'residentes', 'ot', 'personal', 'gastos', 'activos', 'reportes', 'aprobaciones'],
    Operador: ['dashboard', 'ot', 'rondas', 'asistencia'],
    Auditor: ['dashboard', 'reportes', 'gastos', 'activos', 'proyectos', 'contabilidad']
  }
}
