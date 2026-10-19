import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from './load-env.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv(path.join(root, '.env'))

const env = { ...process.env, BILLING_SERVE_STATIC: '0', PORT: process.env.PORT || '8787' }
const server = spawn(process.execPath, ['server/index.js'], { cwd: root, env, stdio: 'inherit' })
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const vite = spawn(process.execPath, [viteBin], { cwd: root, env: process.env, stdio: 'inherit' })

function stop() {
  server.kill('SIGTERM')
  vite.kill('SIGTERM')
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
server.on('exit', (code) => {
  if (code) vite.kill('SIGTERM')
})
vite.on('exit', (code) => {
  server.kill('SIGTERM')
  process.exit(code ?? 0)
})
