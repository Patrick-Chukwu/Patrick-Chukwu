import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { PROFESSIONAL_NAME, PUBLIC_EMAIL } from '../shared/branding.js'

/**
 * Billing storage.
 *
 * One code path serves both environments:
 *  - Local development and tests use a SQLite file (`file:` URL).
 *  - Vercel (or any serverless host) uses a hosted libSQL database such as Turso,
 *    because serverless functions have no durable disk.
 *
 * The SQL dialect is plain SQLite in both cases, so migrations and queries are shared.
 */

export class ConfigError extends Error {
  constructor(message, variables = []) {
    super(message)
    this.name = 'ConfigError'
    this.variables = variables
  }
}

function nowIso() {
  return new Date().toISOString()
}

export function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

function fileUrl(filePath) {
  return `file:${path.resolve(filePath)}`
}

/** Decide where billing data lives. Never falls back to ephemeral storage on a serverless host. */
export function resolveDatabase(options = {}) {
  if (options.url) return { url: options.url, authToken: options.authToken || undefined, local: options.url.startsWith('file:') }
  if (options.dbPath) return { url: fileUrl(options.dbPath), local: true }
  const remote = process.env.BILLING_DATABASE_URL || process.env.TURSO_DATABASE_URL || ''
  if (remote) {
    const authToken = process.env.BILLING_DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || ''
    // Serverless functions do not benefit from long-lived websockets; use the HTTP transport.
    const url = remote.startsWith('libsql://') ? `https://${remote.slice('libsql://'.length)}` : remote
    if (!url.startsWith('file:') && !authToken) {
      throw new ConfigError('The billing database token is not configured', ['BILLING_DATABASE_AUTH_TOKEN'])
    }
    return { url, authToken: authToken || undefined, local: url.startsWith('file:') }
  }
  if (isServerless()) {
    throw new ConfigError('The billing database is not configured', ['BILLING_DATABASE_URL', 'BILLING_DATABASE_AUTH_TOKEN'])
  }
  const localPath = process.env.BILLING_DATABASE_PATH || path.join(import.meta.dirname, '..', 'data', 'billing.sqlite')
  return { url: fileUrl(localPath), local: true }
}

function plain(result) {
  return result.rows.map((row) => {
    const out = {}
    result.columns.forEach((column, index) => {
      out[column] = row[index]
    })
    return out
  })
}

function bindable(args) {
  return args.map((value) => {
    if (value === undefined) return null
    if (typeof value === 'boolean') return value ? 1 : 0
    if (Buffer.isBuffer(value)) return new Uint8Array(value)
    return value
  })
}

/** Small async wrapper that keeps the `prepare(sql).get/all/run` shape of the previous driver. */
class Handle {
  constructor(executor) {
    this.executor = executor
  }

  prepare(sql) {
    const run = async (args) => this.executor.execute({ sql, args: bindable(args) })
    return {
      get: async (...args) => plain(await run(args))[0],
      all: async (...args) => plain(await run(args)),
      run: async (...args) => {
        const result = await run(args)
        return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid }
      },
    }
  }
}

export class Database extends Handle {
  constructor(client, info) {
    super(client)
    this.client = client
    this.info = info
  }

  async transaction(fn) {
    const tx = await this.client.transaction('write')
    try {
      const result = await fn(new Handle(tx))
      await tx.commit()
      return result
    } catch (error) {
      try {
        await tx.rollback()
      } catch (rollbackError) {
        console.error('billing rollback failed', rollbackError.name)
      }
      throw error
    } finally {
      tx.close()
    }
  }

  close() {
    this.client.close()
  }
}

export function withTransaction(db, fn) {
  return db.transaction(fn)
}

async function applyMigrations(db) {
  await db.client.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`)
  const directory = path.join(import.meta.dirname, 'migrations')
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const applied = await db.prepare('SELECT id FROM schema_migrations WHERE id = ?').get(file)
    if (applied) continue
    const sql = fs.readFileSync(path.join(directory, file), 'utf8')
    const tx = await db.client.transaction('write')
    try {
      // Another cold start may have applied this migration while we waited for the write lock.
      const raced = plain(await tx.execute({ sql: 'SELECT id FROM schema_migrations WHERE id = ?', args: [file] }))[0]
      if (!raced) {
        await tx.executeMultiple(sql)
        await tx.execute({ sql: 'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', args: [file, nowIso()] })
      }
      await tx.commit()
    } catch (error) {
      try {
        await tx.rollback()
      } catch (rollbackError) {
        console.error('billing migration rollback failed', rollbackError.name)
      }
      throw error
    } finally {
      tx.close()
    }
  }
}

async function seedIssuer(db) {
  await db.prepare(`INSERT OR IGNORE INTO issuer_settings (
    id, professional_name, business_name, email, phone, address,
    payment_instructions, default_terms, default_notes, logo_file, updated_at
  ) VALUES (1, ?, '', ?, '', '', '', '', '', '', ?)`).run(PROFESSIONAL_NAME, PUBLIC_EMAIL, nowIso())
}

export async function openDatabase(options = {}) {
  const info = resolveDatabase(options)
  if (info.local) {
    const filePath = info.url.slice('file:'.length)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
  }
  const client = createClient({ url: info.url, authToken: info.authToken })
  const db = new Database(client, info)
  try {
    if (info.local) {
      await client.execute('PRAGMA busy_timeout = 5000')
      await client.execute('PRAGMA journal_mode = WAL')
    }
    await applyMigrations(db)
    await seedIssuer(db)
  } catch (error) {
    client.close()
    throw error
  }
  return db
}
