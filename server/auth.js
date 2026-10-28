import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { isServerless } from './db.js'
import { HttpError } from './errors.js'

/**
 * Admin authentication for /api/billing.
 *
 * - The password only ever lives in the server environment (BILLING_ADMIN_PASSWORD).
 * - A successful login creates a random opaque session token. Only its SHA-256 hash is stored
 *   in the database, so sessions work across serverless invocations and can be revoked.
 * - The cookie is HttpOnly, SameSite=Strict, and Secure on HTTPS / Vercel.
 * - Failed logins are throttled per client and globally, in the database, so limits hold across
 *   serverless instances.
 */

export const SESSION_TTL_SECONDS = 12 * 60 * 60
export const MAX_FAILURES_PER_CLIENT = 8
export const MAX_FAILURES_GLOBAL = 60
const WINDOW_MS = 10 * 60 * 1000
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 200
const PLAIN_COOKIE = 'billing_session'
const SECURE_COOKIE = '__Host-billing_session'
const KDF_SALT = 'patrick-chukwu-billing-v1'

let cachedSecret = { password: null, key: null }

function configuredPassword() {
  const value = (process.env.BILLING_ADMIN_PASSWORD || '').trim()
  return value.length >= MIN_PASSWORD_LENGTH ? value : ''
}

function notConfigured() {
  // Variable names only. The value is never logged or returned.
  console.error('billing sign-in is not configured: set BILLING_ADMIN_PASSWORD (8+ characters) for this Vercel environment')
  return new HttpError(503, 'Billing sign-in is not configured on the server', 'NOT_CONFIGURED')
}

function expectedKey() {
  const password = configuredPassword()
  if (!password) throw notConfigured()
  if (cachedSecret.password !== password) {
    cachedSecret = { password, key: scryptSync(password, KDF_SALT, 32) }
  }
  return cachedSecret.key
}

// Changing BILLING_ADMIN_PASSWORD changes this value, which signs out every existing session.
function passwordFingerprint() {
  return createHash('sha256').update('billing-session-v1').update(expectedKey()).digest('hex').slice(0, 32)
}

function passwordMatches(input) {
  const expected = expectedKey()
  const actual = scryptSync(input, KDF_SALT, 32)
  return timingSafeEqual(actual, expected)
}

export function readCookie(header, name) {
  if (!header) return ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) {
      try {
        return decodeURIComponent(rest.join('='))
      } catch {
        return ''
      }
    }
  }
  return ''
}

function isSecureRequest(req) {
  if (req.secure || isServerless()) return true
  return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'
}

function cookieName(req) {
  return isSecureRequest(req) ? SECURE_COOKIE : PLAIN_COOKIE
}

function cookieHeader(req, value, maxAge) {
  return `${cookieName(req)}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${isSecureRequest(req) ? '; Secure' : ''}`
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function clientAddress(req) {
  // Vercel sets these headers itself and strips client-supplied values. Elsewhere, trust only the socket.
  if (isServerless()) {
    const real = req.headers['x-real-ip']
    if (typeof real === 'string' && real) return real.trim()
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

function bucketFor(req) {
  return `client:${createHash('sha256').update(clientAddress(req)).digest('hex').slice(0, 32)}`
}

async function reserveAttempt(db, bucket, now) {
  const row = await db.prepare(`INSERT INTO login_attempts (bucket, count, window_start) VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
    RETURNING count`).get(bucket, now, now - WINDOW_MS, now - WINDOW_MS, now)
  return Number(row.count)
}

async function globalFailures(db, now) {
  const row = await db.prepare('SELECT count, window_start FROM login_attempts WHERE bucket = ?').get('global')
  if (!row || Number(row.window_start) <= now - WINDOW_MS) return 0
  return Number(row.count)
}

function rateLimitResponse(res) {
  res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)))
  res.status(429).json({ error: 'Too many sign-in attempts. Try again later.', code: 'RATE_LIMIT' })
}

async function readSession(db, req) {
  const token = readCookie(req.headers.cookie, cookieName(req))
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const row = await db.prepare('SELECT password_fingerprint, expires_at FROM admin_sessions WHERE id = ?').get(hashToken(token))
  if (!row || Number(row.expires_at) <= Date.now()) return null
  if (row.password_fingerprint !== passwordFingerprint()) return null
  return { token }
}

export async function login(req, res) {
  expectedKey()
  const { db } = req.app.locals.ctx
  const password = req.body?.password
  if (typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ error: 'Enter the admin password', code: 'VALIDATION' })
    return
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    res.status(400).json({ error: 'Enter the admin password', code: 'VALIDATION' })
    return
  }
  const now = Date.now()
  if ((await globalFailures(db, now)) >= MAX_FAILURES_GLOBAL) {
    rateLimitResponse(res)
    return
  }
  // The attempt is counted before the comparison so parallel guesses cannot bypass the limit.
  const bucket = bucketFor(req)
  if ((await reserveAttempt(db, bucket, now)) > MAX_FAILURES_PER_CLIENT) {
    rateLimitResponse(res)
    return
  }
  if (!passwordMatches(password)) {
    await reserveAttempt(db, 'global', now)
    res.status(401).json({ error: 'Incorrect password', code: 'UNAUTHENTICATED' })
    return
  }
  await db.prepare('DELETE FROM login_attempts WHERE bucket = ?').run(bucket)
  await db.prepare('DELETE FROM login_attempts WHERE window_start <= ?').run(now - WINDOW_MS)
  await db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now)
  const token = randomBytes(32).toString('base64url')
  await db.prepare('INSERT INTO admin_sessions (id, password_fingerprint, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), passwordFingerprint(), now, now + SESSION_TTL_SECONDS * 1000)
  res.setHeader('Set-Cookie', cookieHeader(req, token, SESSION_TTL_SECONDS))
  res.json({ ok: true })
}

export async function logout(req, res) {
  const token = readCookie(req.headers.cookie, cookieName(req))
  if (token) {
    await req.app.locals.ctx.db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(hashToken(token))
  }
  res.setHeader('Set-Cookie', cookieHeader(req, '', 0))
  res.status(204).end()
}

export async function session(req, res) {
  expectedKey()
  const found = await readSession(req.app.locals.ctx.db, req)
  res.json({ authenticated: Boolean(found) })
}

export async function requireAuth(req, res, next) {
  try {
    expectedKey()
    const found = await readSession(req.app.locals.ctx.db, req)
    if (!found) {
      res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' })
      return
    }
    next()
  } catch (error) {
    next(error)
  }
}
