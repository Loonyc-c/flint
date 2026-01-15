import 'dotenv/config'
import { getDbConnection } from '../src/data/db'
import fs from 'fs'
import path from 'path'

const runMigrations = async (direction: 'up' | 'down') => {
  const db = await getDbConnection()
  const migrationsDir = path.join(__dirname, '../migrations')
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort()

  console.log(`🚀 Starting migrations [${direction}]...`)

  for (const file of files) {
    console.log(`   - Executing ${file}`)
    const migration = await import(path.join(migrationsDir, file))
    
    try {
      if (direction === 'up' && migration.up) {
        await migration.up(db)
      } else if (direction === 'down' && migration.down) {
        await migration.down(db)
      }
      console.log(`   ✅ ${file} success`)
    } catch (err) {
      console.error(`   ❌ ${file} failed:`, err)
      process.exit(1)
    }
  }

  console.log('🏁 All migrations complete')
  process.exit(0)
}

const direction = (process.argv[2] as 'up' | 'down') || 'up'
runMigrations(direction)
