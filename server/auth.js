import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import { HttpError } from './errors.js'

const COOKIE = 'billing_session'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WEEK_SECONDS = 7 * 24 * 60 * 60
const failures = new Map()

function clientKey(req) {
  return req.socket?.remoteAddress || 'local'
}

function secret() {
  const value = process.env.BILLING_SESSION_SECRET || ''
  return value.length >= 16 ? value : ''
}

function passwordConfigured() {
  const value = process.env.BILLING_ADMIN_PASSWORD || ''
  return value.length >= 8
}

function passwordKey(password) {
  return scryptSync(password, 'patrick-chukwu-billing-v1', 32)
}

function passwordsMatch(input, expected) {
  const left = passwordKey(input)
  const right = passwordKey(expected)
  return timingSafeEqual(left, right)
}

function sign(payload) {
  const key = secret()
  if (!key) throw new HttpError(503, 'Set BILLING_SESSION_SECRET before using billing', 'NOT_CONFIGURED')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verify(token) {
  const key = secret()
  if (!key || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', key).update(body).digest('base64url')
  const actualBuffer = Buffer.from(sig)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload || payload.v !== 1 || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function readCookie(header, name) {
  if (!header) return ''
  const parts = header.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}

function secureFlag(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
}

export function resetLoginLimits() {
  failures.clear()
}

function rateLimited(req) {
  const entry = failures.get(clientKey(req))
  if (!entry) return false
  if (Date.now() - entry.start > 10 * 60 * 1000) {
    failures.delete(clientKey(req))
    return false
  }
  return entry.count >= 8
}

function recordFailure(req) {
  const key = clientKey(req)
  const entry = failures.get(key)
  if (!entry || Date.now() - entry.start > 10 * 60 * 1000) {
    failures.set(key, { count: 1, start: Date.now() })
    return
  }
  entry.count += 1
}

export function login(req, res) {
  if (!secret() || !passwordConfigured()) {
    res.status(503).json({ error: 'Billing sign-in is not configured', code: 'NOT_CONFIGURED' })
    return
  }
  if (rateLimited(req)) {
    res.status(429).json({ error: 'Too many sign-in attempts. Try again later.', code: 'RATE_LIMIT' })
    return
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (password.length < 8 || password.length > 200 || !passwordsMatch(password, process.env.BILLING_ADMIN_PASSWORD)) {
    recordFailure(req)
    res.status(401).json({ error: 'Incorrect password', code: 'UNAUTHENTICATED' })
    return
  }
  failures.delete(clientKey(req))
  const token = sign({ exp: Date.now() + WEEK_MS, v: 1 })
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${WEEK_SECONDS}${secureFlag(req)}`)
  res.json({ ok: true })
}

export function logout(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureFlag(req)}`)
  res.status(204).end()
}

export function session(req, res) {
  const payload = verify(readCookie(req.headers.cookie, COOKIE))
  res.json({ authenticated: Boolean(payload) })
}

export function requireAuth(req, res, next) {
  const payload = verify(readCookie(req.headers.cookie, COOKIE))
  if (!payload) {
    res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' })
    return
  }
  next()
}
