import { spawn } from 'node:child_process'

const commands = [
  { name: 'api', script: 'npm run dev:api' },
  { name: 'web', script: 'npm run dev -- --host 127.0.0.1' },
]

const children = commands.map(({ name, script }) => {
  const child = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'sh',
    process.platform === 'win32' ? ['/d', '/s', '/c', script] : ['-lc', script],
    {
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`)
  })

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`)
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`)
    }
  })

  return child
})

function stopAll() {
  for (const child of children) {
    child.kill()
  }
}

process.on('SIGINT', () => {
  stopAll()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopAll()
  process.exit(0)
})
