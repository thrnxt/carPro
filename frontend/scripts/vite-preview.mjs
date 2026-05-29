import { spawn } from 'node:child_process'

const defaultPort = process.argv[2] || '4173'
const port = process.env.PORT || defaultPort
const viteCommand = process.platform === 'win32' ? 'vite.cmd' : 'vite'

const child = spawn(viteCommand, ['preview', '--host', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
