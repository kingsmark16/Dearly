import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneRoot = resolve(appRoot, '.next/standalone/apps/web')

async function copyIfPresent(source, destination) {
  if (existsSync(source)) {
    await cp(source, destination, { recursive: true, force: true })
  }
}

await copyIfPresent(
  resolve(appRoot, '.next/static'),
  resolve(standaloneRoot, '.next/static'),
)
await copyIfPresent(
  resolve(appRoot, 'public'),
  resolve(standaloneRoot, 'public'),
)

const server = spawn(process.execPath, [resolve(standaloneRoot, 'server.js')], {
  env: process.env,
  stdio: 'inherit',
})

function forwardSignal(signal) {
  server.kill(signal)
}

process.on('SIGINT', () => forwardSignal('SIGINT'))
process.on('SIGTERM', () => forwardSignal('SIGTERM'))

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exitCode = code ?? 1
})
