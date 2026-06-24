import {
  hasDatabaseUrl,
  normalizeBoolean,
  queryCsvFlights,
  queryDatabaseFlights,
} from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

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
    const flights = hasDatabaseUrl()
      ? await queryDatabaseFlights(filters)
      : queryCsvFlights(filters)

    res.status(200).json({
      dataSource: hasDatabaseUrl() ? 'neon' : 'local_csv',
      count: flights.length,
      flights,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to search flights' })
  }
}
