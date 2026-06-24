import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import {
  hasDatabaseUrl,
  normalizeBoolean,
  queryTripFlights,
} from '../api/_shared.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dataSource: hasDatabaseUrl() ? 'neon' : 'local_csv',
  })
})

app.get('/api/flights', async (req, res) => {
  const filters = {
    from: String(req.query.from ?? ''),
    to: String(req.query.to ?? ''),
    departDate: String(req.query.departDate ?? ''),
    returnDate: String(req.query.returnDate ?? ''),
    tripType: String(req.query.tripType ?? 'oneway'),
    cabinClass: String(req.query.cabinClass ?? 'economy'),
    nonstopOnly: normalizeBoolean(req.query.nonstopOnly),
    budget: Number(req.query.budget ?? 999999),
  }

  if (!filters.from || !filters.to || !filters.departDate) {
    res.status(400).json({ error: 'from, to, and departDate are required' })
    return
  }

  if (filters.tripType === 'roundtrip' && !filters.returnDate) {
    res.status(400).json({ error: 'returnDate is required for roundtrip searches' })
    return
  }

  try {
    const tripResults = await queryTripFlights(filters)

    res.json({
      dataSource: hasDatabaseUrl() ? 'neon' : 'local_csv',
      count: tripResults.outboundFlights.length,
      flights: tripResults.outboundFlights,
      ...tripResults,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to search flights' })
  }
})

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
  console.log(`Data source: ${hasDatabaseUrl() ? 'Neon/PostgreSQL' : 'local CSV fallback'}`)
})
