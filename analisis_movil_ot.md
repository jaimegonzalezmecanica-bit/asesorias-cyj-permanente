# Análisis de Funcionamiento y Detección de Errores: Órdenes de Trabajo (Móvil)

## 1. Análisis de Funcionamiento Actual
El sistema de Órdenes de Trabajo (OT) está construido con **Next.js 16** y **React 19**, utilizando **Tailwind CSS** para el diseño. 

### Gestión de Tareas
Actualmente, las tareas dentro de una OT se gestionan de la siguiente manera:
- **Visualización**: Se muestran en una tabla clásica dentro de un `Dialog` (modal) de Radix UI.
- **Interacción**: El usuario debe abrir el diálogo de edición, navegar a la pestaña "Tareas" y utilizar un `Select` para cambiar el estado (Pendiente, En Progreso, Completado) o un `Checkbox` para marcar el cumplimiento.
- **Persistencia**: Los cambios se guardan al hacer clic en el botón "Guardar" general de la OT, lo que envía un `PUT` a `/api/ordenes-trabajo/[id]`.

### Adaptabilidad Móvil
- El diseño utiliza clases `md:grid-cols-2`, lo que indica un esfuerzo por ser responsive.
- Sin embargo, la gestión de tareas mediante tablas y diálogos anidados es **poco eficiente en celulares**, donde el espacio es limitado y la precisión táctil es menor que la de un cursor.

---

## 2. Detección de Errores y Oportunidades de Mejora

### Errores de Lógica y UX
1. **Fricción en la Ejecución**: Un técnico en terreno necesita marcar tareas rápidamente. El flujo actual (Abrir OT -> Editar -> Pestaña Tareas -> Cambiar Select -> Guardar) requiere demasiados clics.
2. **Falta de Notas Contextuales**: No hay un campo específico por tarea para justificar por qué una tarea no se cumplió, lo que obliga a usar el campo de "Notas" general de la OT, perdiendo trazabilidad.
3. **Dependencia de Guardado Global**: Si el técnico marca una tarea y cierra el diálogo sin querer o pierde la conexión antes de dar a "Guardar", pierde el progreso de esa tarea específica.

### Vulnerabilidades y Malas Prácticas
1. **Race Conditions en Actualización**: Al guardar la OT completa para actualizar una sola tarea, se corre el riesgo de sobreescribir cambios realizados por otros usuarios en otros campos de la misma OT.
2. **Carga de Datos Ineficiente**: El componente `OrdenesTrabajoModule` tiene más de 1800 líneas, lo que dificulta el mantenimiento y aumenta el tiempo de renderizado en dispositivos móviles menos potentes.
3. **Ausencia de Feedback Háptico/Visual**: En móvil, los gestos de deslizamiento (swipe) son el estándar para acciones rápidas, y su ausencia hace que la aplicación se sienta "pesada" y no nativa.

---

## 3. Propuesta de Optimización
Implementaremos un componente `MobileTaskItem` utilizando **framer-motion** para permitir:
- **Swipe Izquierda**: Marcar como "Completado" instantáneamente.
- **Swipe Derecha**: Abrir un `Drawer` (panel inferior) para marcar como "No Cumplido" y capturar obligatoriamente la nota del motivo.
- **Actualización Atómica**: Implementar un endpoint de API dedicado para actualizar el estado de una tarea individual sin necesidad de enviar toda la OT.
