import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

dotenv.config()

const csvPath = path.resolve('outputs/taiwan_japan_flights_seed_700.csv')
const schemaPath = path.resolve('database/schema.sql')

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and paste your Neon connection string.')
  process.exit(1)
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function readCsvRows(filePath) {
  const [headerLine, ...lines] = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/)
  const headers = parseCsvLine(headerLine)
  return lines.map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null]))
  })
}

const numericColumns = new Set([
  'flight_id',
  'duration_minutes',
  'stops',
  'price_twd',
  'seats_total',
  'seats_available',
  'baggage_kg',
])

function normalizeValue(header, value) {
  if (value === '') {
    return null
  }

  if (numericColumns.has(header)) {
    return Number(value)
  }

  return value
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const client = await pool.connect()

try {
  const rows = readCsvRows(csvPath)
  const headers = Object.keys(rows[0])
  const schema = fs.readFileSync(schemaPath, 'utf8')

  await client.query('BEGIN')
  await client.query(schema)
  await client.query('TRUNCATE TABLE flights')

  const values = []
  const placeholders = rows.map((row, rowIndex) => {
    const cells = headers.map((header, columnIndex) => {
      values.push(normalizeValue(header, row[header]))
      return `$${rowIndex * headers.length + columnIndex + 1}`
    })
    return `(${cells.join(', ')})`
  })

  await client.query(
    `
    INSERT INTO flights (${headers.join(', ')})
    VALUES ${placeholders.join(',\n')}
    `,
    values,
  )

  await client.query('COMMIT')
  console.log(`Imported ${rows.length} rows into flights.`)
} catch (error) {
  await client.query('ROLLBACK')
  console.error(error)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
