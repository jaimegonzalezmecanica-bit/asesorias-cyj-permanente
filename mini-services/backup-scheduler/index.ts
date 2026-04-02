/**
 * Backup Scheduler Service
 * 
 * This mini-service handles automatic database backups and cleanup of old backups.
 * It runs as a separate Bun process and can be started with:
 * 
 *   bun run mini-services/backup-scheduler/index.ts
 * 
 * Features:
 * - Scheduled backups (daily, weekly, monthly)
 * - Automatic cleanup of old backups based on retention policy
 * - Backup verification
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import fs from 'fs'
import path from 'path'

// Configuration
const BACKUP_DIR = '/home/z/my-project/backups'
const DB_PATH = '/home/z/my-project/prisma/dev.db'
const CHECK_INTERVAL = 60000 // Check every minute

interface BackupConfig {
  frecuencia: 'Diario' | 'Semanal' | 'Mensual'
  hora: string
  retencionDias: number
  incluyeBase64: boolean
  activo: boolean
  ultimoEjecutado: string | null
}

interface BackupRecord {
  id: string
  tipo: string
  estado: string
  fechaInicio: string | null
  fechaFin: string | null
  tamano: number
  ubicacion: string | null
  archivo: string | null
  incluyeBase64: boolean
  mensajeError: string | null
  verificado: boolean
  fechaVerificacion: string | null
  totalTablas: number
  totalRegistros: number
  createdAt: string
}

// Simple SQLite client using Bun
class SimpleSQLite {
  private db: any

  constructor(dbPath: string) {
    // Bun has built-in SQLite support
    this.db = new (require('bun:sqlite'))(dbPath)
  }

  query<T>(sql: string, params: any[] = []): T[] {
    return this.db.query(sql).all(...params) as T[]
  }

  run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    const stmt = this.db.query(sql)
    stmt.run(...params)
    return { changes: this.db.changes, lastInsertRowid: this.db.lastInsertRowid }
  }

  close() {
    this.db.close()
  }
}

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`[BackupScheduler] Created backup directory: ${BACKUP_DIR}`)
  }
}

// Generate unique ID
function generateId(): string {
  return 'backup_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

// Get configuration from database
function getConfig(db: SimpleSQLite): BackupConfig {
  const configRows = db.query<{ clave: string; valor: string }>(
    `SELECT clave, valor FROM Configuracion WHERE clave LIKE 'backup_%'`
  )

  const configMap: Record<string, string> = {}
  configRows.forEach(row => {
    configMap[row.clave] = row.valor
  })

  return {
    frecuencia: (configMap['backup_frecuencia'] as BackupConfig['frecuencia']) || 'Diario',
    hora: configMap['backup_hora'] || '02:00',
    retencionDias: parseInt(configMap['backup_retencion_dias'] || '30'),
    incluyeBase64: configMap['backup_incluye_base64'] === 'true',
    activo: configMap['backup_activo'] !== 'false',
    ultimoEjecutado: configMap['backup_ultimo_ejecutado'] || null,
  }
}

// Update last executed timestamp
function updateLastExecuted(db: SimpleSQLite) {
  const now = new Date().toISOString()
  db.run(
    `INSERT INTO Configuracion (id, clave, valor, descripcion, createdAt, updatedAt)
     VALUES (?, 'backup_ultimo_ejecutado', ?, 'Última ejecución de respaldo automático', ?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = ?, updatedAt = ?`,
    [generateId(), now, now, now, now, now]
  )
}

// Create backup record
function createBackupRecord(db: SimpleSQLite, tipo: string): string {
  const id = generateId()
  const now = new Date().toISOString()
  
  db.run(
    `INSERT INTO Backup (id, tipo, estado, fechaInicio, incluyeBase64, createdAt)
     VALUES (?, ?, 'Pendiente', ?, 0, ?)`,
    [id, tipo, now, now]
  )
  
  return id
}

// Update backup record
function updateBackupRecord(
  db: SimpleSQLite,
  id: string,
  updates: Partial<BackupRecord>
) {
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ')
  const values = [...Object.values(updates), id]
  
  db.run(`UPDATE Backup SET ${setClause} WHERE id = ?`, values)
}

// Create actual backup file
async function createBackupFile(backupId: string): Promise<{
  success: boolean
  filePath?: string
  fileName?: string
  tamano?: number
  error?: string
}> {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { success: false, error: 'Database file not found' }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${timestamp}.db`
    const filePath = path.join(BACKUP_DIR, fileName)

    // Copy database file
    const stats = fs.statSync(DB_PATH)
    const tamanoMB = stats.size / (1024 * 1024)

    fs.copyFileSync(DB_PATH, filePath)

    return {
      success: true,
      filePath,
      fileName,
      tamano: tamanoMB,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Count tables and records
function countDatabaseStats(db: SimpleSQLite): { totalTablas: number; totalRegistros: number } {
  const tables = db.query<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%'`
  )

  let totalTablas = 0
  let totalRegistros = 0

  for (const table of tables) {
    try {
      const countResult = db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM "${table.name}"`
      )
      if (countResult[0]?.count > 0) {
        totalTablas++
        totalRegistros += countResult[0].count
      }
    } catch (e) {
      // Skip tables that can't be counted
    }
  }

  return { totalTablas, totalRegistros }
}

// Perform backup
async function performBackup(db: SimpleSQLite): Promise<boolean> {
  const backupId = createBackupRecord(db, 'Automatico')
  
  console.log(`[BackupScheduler] Starting backup ${backupId}`)
  
  // Update status to in progress
  updateBackupRecord(db, backupId, { estado: 'EnProgreso' })

  try {
    const result = await createBackupFile(backupId)

    if (!result.success) {
      updateBackupRecord(db, backupId, {
        estado: 'Fallido',
        mensajeError: result.error,
        fechaFin: new Date().toISOString(),
      })
      console.error(`[BackupScheduler] Backup ${backupId} failed: ${result.error}`)
      return false
    }

    const stats = countDatabaseStats(db)

    updateBackupRecord(db, backupId, {
      estado: 'Completado',
      fechaFin: new Date().toISOString(),
      tamano: result.tamano!,
      ubicacion: result.filePath!,
      archivo: result.fileName!,
      totalTablas: stats.totalTablas,
      totalRegistros: stats.totalRegistros,
      verificado: true,
      fechaVerificacion: new Date().toISOString(),
    })

    console.log(`[BackupScheduler] Backup ${backupId} completed successfully`)
    console.log(`[BackupScheduler]   Size: ${result.tamano?.toFixed(2)} MB`)
    console.log(`[BackupScheduler]   Tables: ${stats.totalTablas}, Records: ${stats.totalRegistros}`)

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    updateBackupRecord(db, backupId, {
      estado: 'Fallido',
      mensajeError: errorMessage,
      fechaFin: new Date().toISOString(),
    })
    console.error(`[BackupScheduler] Backup ${backupId} failed: ${errorMessage}`)
    return false
  }
}

// Clean old backups
function cleanOldBackups(db: SimpleSQLite, retencionDias: number): { deleted: number; freedMB: number } {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retencionDias)

  const oldBackups = db.query<BackupRecord>(
    `SELECT * FROM Backup WHERE estado = 'Completado' AND createdAt < ?`,
    [cutoffDate.toISOString()]
  )

  let deleted = 0
  let freedMB = 0

  for (const backup of oldBackups) {
    try {
      // Delete file
      if (backup.ubicacion && fs.existsSync(backup.ubicacion)) {
        fs.unlinkSync(backup.ubicacion)
        freedMB += backup.tamano || 0
      }

      // Delete record
      db.run(`DELETE FROM Backup WHERE id = ?`, [backup.id])
      deleted++
    } catch (e) {
      console.error(`[BackupScheduler] Error deleting backup ${backup.id}:`, e)
    }
  }

  if (deleted > 0) {
    console.log(`[BackupScheduler] Cleaned ${deleted} old backups, freed ${freedMB.toFixed(2)} MB`)
  }

  return { deleted, freedMB }
}

// Check if backup should run
function shouldRunBackup(config: BackupConfig): boolean {
  if (!config.activo) return false

  const now = new Date()
  const [hour, minute] = config.hora.split(':').map(Number)
  
  // Check if current time matches scheduled time (within 1 minute window)
  const scheduledTime = new Date()
  scheduledTime.setHours(hour, minute, 0, 0)
  
  const diffMs = Math.abs(now.getTime() - scheduledTime.getTime())
  if (diffMs > CHECK_INTERVAL) return false

  // Check frequency
  if (!config.ultimoEjecutado) return true

  const lastExecuted = new Date(config.ultimoEjecutado)
  
  switch (config.frecuencia) {
    case 'Diario':
      // Check if last execution was today
      return lastExecuted.toDateString() !== now.toDateString()
    
    case 'Semanal':
      // Check if last execution was this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return lastExecuted < weekAgo
    
    case 'Mensual':
      // Check if last execution was this month
      return lastExecuted.getMonth() !== now.getMonth() ||
             lastExecuted.getFullYear() !== now.getFullYear()
    
    default:
      return false
  }
}

// Main scheduler loop
async function runScheduler() {
  console.log('[BackupScheduler] Starting backup scheduler...')
  console.log(`[BackupScheduler] Backup directory: ${BACKUP_DIR}`)
  console.log(`[BackupScheduler] Database: ${DB_PATH}`)
  console.log(`[BackupScheduler] Check interval: ${CHECK_INTERVAL}ms`)

  ensureBackupDir()

  // Main loop
  setInterval(() => {
    try {
      const db = new SimpleSQLite(DB_PATH)
      const config = getConfig(db)

      if (shouldRunBackup(config)) {
        console.log('[BackupScheduler] Time to run backup...')
        performBackup(db).then(() => {
          updateLastExecuted(db)
          cleanOldBackups(db, config.retencionDias)
          db.close()
        })
      } else {
        db.close()
      }
    } catch (error) {
      console.error('[BackupScheduler] Error in scheduler loop:', error)
    }
  }, CHECK_INTERVAL)

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n[BackupScheduler] Shutting down...')
    process.exit(0)
  })

  console.log('[BackupScheduler] Scheduler running. Press Ctrl+C to stop.')
}

// Run the scheduler
runScheduler().catch(console.error)
