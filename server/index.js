import path from 'node:path'
import { createApp } from './app.js'
import { loadEnv } from '../scripts/load-env.js'

const rootDir = path.resolve(import.meta.dirname, '..')
loadEnv(path.join(rootDir, '.env'))

if ((process.env.BILLING_ADMIN_PASSWORD || '').trim().length < 8) {
  console.warn('Billing sign-in is disabled until BILLING_ADMIN_PASSWORD (8+ characters) is set.')
}

const port = Number(process.env.PORT || 8787)
const app = createApp({ rootDir })
app.listen(port, () => {
  console.log(`Portfolio server listening on ${port}`)
})
