import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { PROFESSIONAL_NAME, PUBLIC_EMAIL } from '../shared/branding.js'

function nowIso() {
  return new Date().toISOString()
}

function migrate(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)
  const applied = new Set(db.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id))
  const directory = path.join(import.meta.dirname, 'migrations')
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort()
  files.forEach((file) => {
    if (applied.has(file)) return
    const sql = fs.readFileSync(path.join(directory, file), 'utf8')
    db.exec('BEGIN')
    try {
      db.exec(sql)
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(file, nowIso())
      db.exec('COMMIT')
    } catch (error) {
      try {
        db.exec('ROLLBACK')
      } catch (rollbackError) {
        console.error('billing migration rollback failed', rollbackError.name)
      }
      throw error
    }
  })
}

function seedIssuer(db) {
  const existing = db.prepare('SELECT id FROM issuer_settings WHERE id = 1').get()
  if (existing) return
  db.prepare(`INSERT INTO issuer_settings (
    id, professional_name, business_name, email, phone, address,
    payment_instructions, default_terms, default_notes, logo_file, updated_at
  ) VALUES (1, ?, '', ?, '', '', '', '', '', '', ?)`).run(PROFESSIONAL_NAME, PUBLIC_EMAIL, nowIso())
}

export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA busy_timeout = 5000')
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL')
  migrate(db)
  seedIssuer(db)
  return db
}

export function withTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (error) {
    try {
      db.exec('ROLLBACK')
    } catch (rollbackError) {
      console.error('billing rollback failed', rollbackError.name)
    }
    throw error
  }
}
