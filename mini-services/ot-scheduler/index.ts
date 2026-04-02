/**
 * OT Scheduler Service
 * Generates recurrent work orders based on task frequency
 * 
 * Frequencies:
 * - Diaria: Every day
 * - Semanal: Every week (7 days)
 * - Mensual: Every month (30 days)
 * - Trimestral: Every 3 months (90 days)
 * - Semestral: Every 6 months (180 days)
 * - Anual: Every year (365 days)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PORT = 3010

// Frequency in days
const FREQUENCY_DAYS: Record<string, number> = {
  'Diaria': 1,
  'Semanal': 7,
  'Mensual': 30,
  'Trimestral': 90,
  'Semestral': 180,
  'Anual': 365,
}

// Get next execution date based on frequency
function getNextExecutionDate(frequency: string, fromDate: Date = new Date()): Date {
  const days = FREQUENCY_DAYS[frequency] || 30
  const nextDate = new Date(fromDate)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

// Check if a task needs to generate an OT today
function needsExecutionToday(ultimaEjecucion: string | null, frequency: string): boolean {
  if (!ultimaEjecucion) return true
  
  const lastExec = new Date(ultimaEjecucion)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastExec.setHours(0, 0, 0, 0)
  
  const daysSinceLastExec = Math.floor((today.getTime() - lastExec.getTime()) / (1000 * 60 * 60 * 24))
  const frequencyDays = FREQUENCY_DAYS[frequency] || 30
  
  return daysSinceLastExec >= frequencyDays
}

// Generate OT from a catalog task
async function generateOTFromTask(tarea: any) {
  const today = new Date()
  const fechaInicio = today.toISOString().split('T')[0]
  
  // Get next OT number
  const lastOT = await prisma.ordenTrabajo.findFirst({
    orderBy: { otNum: 'desc' }
  })
  
  let nextNum = 'OT-1001'
  if (lastOT && lastOT.otNum) {
    const lastNum = parseInt(lastOT.otNum.replace('OT-', ''))
    nextNum = `OT-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  // Create the OT
  const ot = await prisma.ordenTrabajo.create({
    data: {
      otNum: nextNum,
      titulo: `${tarea.codigo ? `[${tarea.codigo}] ` : ''}${tarea.nombre}`,
      tipo: tarea.tipoMantencion === 'Preventivo' ? 'Preventivo' : 
            tarea.tipoMantencion === 'Correctivo' ? 'Correctivo' : 
            tarea.tipoMantencion === 'Legal' ? 'Preventivo' : 'Correctivo',
      prioridad: 'Media',
      estado: 'Pendiente',
      descripcion: `Generado automáticamente desde tarea recurrente: ${tarea.nombre}\nFrecuencia: ${tarea.frecuencia}\nResponsable sugerido: ${tarea.responsable || 'No especificado'}`,
      fechaInicio: fechaInicio,
      tiempoEst: tarea.tiempoEstimado || 0,
      centroCostoId: tarea.centroCostoId,
      esRecurrente: true,
      tareaOrigenId: tarea.id,
      notas: `Tarea del catálogo: ${tarea.codigo || 'Sin código'}\nSistema: ${tarea.sistema || 'No especificado'}\nCategoría: ${tarea.categoria}`,
      tareas: {
        create: [{
          descripcion: tarea.nombre,
          cantidad: 1,
          estado: 'Pendiente',
        }]
      }
    }
  })
  
  // Update the task with new execution date
  await prisma.catTarea.update({
    where: { id: tarea.id },
    data: {
      ultimaEjecucion: fechaInicio,
      proximaEjecucion: getNextExecutionDate(tarea.frecuencia || 'Mensual').toISOString().split('T')[0]
    }
  })
  
  console.log(`✅ Created OT ${ot.otNum} from task ${tarea.codigo || tarea.nombre}`)
  return ot
}

// Main scheduler function
async function runScheduler() {
  console.log(`\n[${new Date().toISOString()}] 🔍 Checking for recurrent tasks...`)
  
  try {
    // Get all active recurrent tasks
    const recurrentTasks = await prisma.catTarea.findMany({
      where: {
        esRecurrente: true,
        activa: true,
      },
      include: {
        centroCosto: true
      }
    })
    
    console.log(`📋 Found ${recurrentTasks.length} recurrent tasks`)
    
    let createdCount = 0
    
    for (const tarea of recurrentTasks) {
      const frequency = tarea.frecuencia || 'Mensual'
      
      if (needsExecutionToday(tarea.ultimaEjecucion, frequency)) {
        console.log(`⏰ Task ${tarea.codigo || tarea.nombre} needs execution (${frequency})`)
        await generateOTFromTask(tarea)
        createdCount++
      }
    }
    
    console.log(`\n✨ Scheduler complete. Created ${createdCount} new OTs.`)
  } catch (error) {
    console.error('❌ Error running scheduler:', error)
  }
}

// Start HTTP server for health checks
async function startServer() {
  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url)
      
      if (url.pathname === '/health') {
        return Response.json({ 
          status: 'ok', 
          service: 'ot-scheduler',
          timestamp: new Date().toISOString() 
        })
      }
      
      if (url.pathname === '/run') {
        // Manual trigger endpoint
        await runScheduler()
        return Response.json({ 
          status: 'executed',
          timestamp: new Date().toISOString() 
        })
      }
      
      if (url.pathname === '/tasks') {
        // List recurrent tasks
        const tasks = await prisma.catTarea.findMany({
          where: { esRecurrente: true, activa: true },
          include: { centroCosto: true }
        })
        return Response.json({ count: tasks.length, tasks })
      }
      
      return Response.json({ error: 'Not found' }, { status: 404 })
    },
  })
  
  console.log(`🚀 OT Scheduler running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/health`)
  console.log(`   Manual run: http://localhost:${PORT}/run`)
  console.log(`   List tasks: http://localhost:${PORT}/tasks`)
  
  // Run scheduler every hour
  setInterval(runScheduler, 60 * 60 * 1000)
  
  // Also run on startup
  await runScheduler()
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

startServer().catch(console.error)
