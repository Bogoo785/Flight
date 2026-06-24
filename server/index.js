import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3001)
const csvPath = path.resolve('outputs/taiwan_japan_flights_seed_700.csv')
const hasDatabase = Boolean(process.env.DATABASE_URL)
const pool = hasDatabase
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null

app.use(cors())
app.use(express.json())

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

function loadCsvFlights() {
  if (!fs.existsSync(csvPath)) {
    return []
  }

  const [headerLine, ...lines] = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/)
  const headers = parseCsvLine(headerLine)

  return lines.map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

function normalizeBoolean(value) {
  return value === 'true' || value === true
}

function mapFlight(row) {
  return {
    flightId: Number(row.flight_id),
    airline: row.airline_name,
    airlineCode: row.airline_code,
    code: row.flight_number,
    route: `${row.origin_airport_code} → ${row.destination_airport_code}`,
    flightDate: String(row.flight_date).slice(0, 10),
    time: `${String(row.departure_time).slice(0, 5)} - ${String(row.arrival_time).slice(0, 5)}`,
    durationMinutes: Number(row.duration_minutes),
    duration: `${Math.floor(Number(row.duration_minutes) / 60)}h ${Number(row.duration_minutes) % 60}m`,
    stops: Number(row.stops) === 0 ? '直飛' : `轉機 ${row.stops} 次`,
    cabinClass: row.cabin_class,
    priceTwd: Number(row.price_twd),
    price: `NT$ ${Number(row.price_twd).toLocaleString()}`,
    seatsAvailable: Number(row.seats_available),
    baggageKg: Number(row.baggage_kg),
    status: row.status,
  }
}

async function queryDatabaseFlights(filters) {
  const values = [filters.from, filters.to, filters.departDate, filters.cabinClass]
  const conditions = [
    'origin_airport_code = $1',
    'destination_airport_code = $2',
    'flight_date >= $3',
    'cabin_class = $4',
  ]

  if (filters.nonstopOnly) {
    values.push(0)
    conditions.push(`stops = $${values.length}`)
  }

  values.push(filters.budget)
  conditions.push(`price_twd <= $${values.length}`)

  const result = await pool.query(
    `
    SELECT *
    FROM flights
    WHERE ${conditions.join(' AND ')}
    ORDER BY flight_date ASC, price_twd ASC, departure_time ASC
    LIMIT 30
    `,
    values,
  )

  return result.rows.map(mapFlight)
}

function queryCsvFlights(filters) {
  return loadCsvFlights()
    .filter((flight) => flight.origin_airport_code === filters.from)
    .filter((flight) => flight.destination_airport_code === filters.to)
    .filter((flight) => flight.flight_date >= filters.departDate)
    .filter((flight) => flight.cabin_class === filters.cabinClass)
    .filter((flight) => !filters.nonstopOnly || Number(flight.stops) === 0)
    .filter((flight) => Number(flight.price_twd) <= filters.budget)
    .sort((first, second) => {
      const dateCompare = first.flight_date.localeCompare(second.flight_date)
      if (dateCompare !== 0) {
        return dateCompare
      }

      const priceCompare = Number(first.price_twd) - Number(second.price_twd)
      if (priceCompare !== 0) {
        return priceCompare
      }

      return first.departure_time.localeCompare(second.departure_time)
    })
    .slice(0, 30)
    .map(mapFlight)
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dataSource: hasDatabase ? 'neon' : 'local_csv',
  })
})

app.get('/api/flights', async (req, res) => {
  const filters = {
    from: String(req.query.from ?? ''),
    to: String(req.query.to ?? ''),
    departDate: String(req.query.departDate ?? ''),
    cabinClass: String(req.query.cabinClass ?? 'economy'),
    nonstopOnly: normalizeBoolean(req.query.nonstopOnly),
    budget: Number(req.query.budget ?? 999999),
  }

  if (!filters.from || !filters.to || !filters.departDate) {
    res.status(400).json({ error: 'from, to, and departDate are required' })
    return
  }

  try {
    const flights = hasDatabase
      ? await queryDatabaseFlights(filters)
      : queryCsvFlights(filters)

    res.json({
      dataSource: hasDatabase ? 'neon' : 'local_csv',
      count: flights.length,
      flights,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to search flights' })
  }
})

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
  console.log(`Data source: ${hasDatabase ? 'Neon/PostgreSQL' : 'local CSV fallback'}`)
})
