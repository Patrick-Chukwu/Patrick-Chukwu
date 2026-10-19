import path from 'node:path'
import { createApp } from './app.js'
import { loadEnv } from '../scripts/load-env.js'

const rootDir = path.resolve(import.meta.dirname, '..')
loadEnv(path.join(rootDir, '.env'))

const password = process.env.BILLING_ADMIN_PASSWORD || ''
const secret = process.env.BILLING_SESSION_SECRET || ''
if (password.length < 8 || secret.length < 16) {
  console.warn('Billing sign-in is disabled until BILLING_ADMIN_PASSWORD (8+) and BILLING_SESSION_SECRET (16+) are set.')
}

const port = Number(process.env.PORT || 8787)
const app = createApp({ rootDir })
app.listen(port, () => {
  console.log(`Portfolio server listening on ${port}`)
})
