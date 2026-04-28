import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbUrl = `file:${path.join(__dirname, 'dev.db')}`

const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const p = new PrismaClient({ adapter })

try {
  const r = await p.project.findMany()
  console.log('OK', r)
} catch(e) {
  console.error('ERR', e.message)
} finally {
  await p.$disconnect()
}
