import {
  hasDatabaseUrl,
  normalizeBoolean,
  queryTripFlights,
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
    const flights = tripResults.outboundFlights

    res.status(200).json({
      dataSource: hasDatabaseUrl() ? 'neon' : 'local_csv',
      count: flights.length,
      flights,
      ...tripResults,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to search flights' })
  }
}
