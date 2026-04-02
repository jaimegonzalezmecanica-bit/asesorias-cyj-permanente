import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // CORREGIDO: Iniciar con false en lugar de undefined para evitar problemas de hidratación
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // CORREGIDO: Verificar que window existe (solo en cliente)
    if (typeof window === 'undefined') return
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Establecer valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
