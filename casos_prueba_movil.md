# Casos de Prueba (Testing): Optimización Móvil de Tareas OT

Para validar la nueva funcionalidad de gestos de swipe y actualización atómica, se han diseñado los siguientes escenarios de prueba:

## Caso 1: Flujo Normal (Completar Tarea)
**Objetivo**: Verificar que el técnico puede completar una tarea rápidamente mediante un gesto de swipe a la derecha.

- **Entrada (Input)**:
    - Usuario en dispositivo móvil visualizando el detalle de una OT.
    - Gesto: Deslizar el item "Revisión de tableros" hacia la **derecha** más de 100px.
- **Acción del Sistema**:
    - Dispara `PATCH /api/ordenes-trabajo/tareas` con `{ id: "task_123", estado: "Completado", cumple: true }`.
- **Salida Esperada (Output)**:
    - El item muestra un fondo verde durante el gesto.
    - Toast de éxito: "Tarea completada".
    - El badge de la tarea cambia a "Completado" y "Cumple".
    - El progreso de la OT se actualiza automáticamente en la UI (ej. de 20% a 35%).

## Caso 2: Caso de Error / Límite (Incumplimiento sin Motivo)
**Objetivo**: Asegurar que no se pueda marcar una tarea como no cumplida sin proporcionar una justificación.

- **Entrada (Input)**:
    - Gesto: Deslizar el item hacia la **izquierda** más de 100px.
    - Acción: En el Drawer abierto, dejar el campo de notas vacío y pulsar "Confirmar No Cumplimiento".
- **Acción del Sistema**:
    - Validación en el componente `MobileTaskItem`.
- **Salida Esperada (Output)**:
    - Toast de error: "Por favor, indica el motivo".
    - El Drawer permanece abierto y la tarea no se actualiza en el backend.

## Caso 3: Caso de Robustez (Concurrencia y Notas)
**Objetivo**: Verificar que la nota de incumplimiento se persiste correctamente y se concatena a las notas de la OT sin borrar información previa.

- **Entrada (Input)**:
    - Tarea: "Limpieza de filtros".
    - Gesto: Swipe izquierda.
    - Nota: "Filtros dañados, requieren repuesto".
- **Acción del Sistema**:
    - `PATCH` envía la nota al backend.
    - El backend recupera las notas actuales de la OT y concatena: `[Tarea: Limpieza de filtros]: Filtros dañados...`.
- **Salida Esperada (Output)**:
    - La tarea se marca como "Completado" pero "No cumple".
    - Al recargar o ver las notas de la OT, aparece la justificación detallada con el nombre de la tarea afectada.
    - No se afectan otros campos de la OT (ej. el técnico asignado o la ubicación permanecen intactos).
