import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next')

const proc = spawn(process.execPath, [nextBin, 'dev', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env },
})

proc.on('exit', (code) => process.exit(code ?? 0))
