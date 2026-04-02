/**
 * Utilidades de formato para el sistema
 * Implementa: Configuración de CLP en miles/millones separados por puntos (Req 19)
 */

/**
 * Formatea un número como moneda CLP con separadores de puntos
 * Ejemplo: 1000000 -> $1.000.000
 */
export const formatCLP = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0'
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '–'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CL')
}

/**
 * Formatea horas para selectores según Req 20
 */
export const formatHours = (hours: number): string => {
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

export const TIME_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 24]
