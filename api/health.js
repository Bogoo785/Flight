import { getPool, hasDatabaseUrl } from './_shared.js'

export default async function handler(_req, res) {
  if (!hasDatabaseUrl()) {
    res.status(200).json({
      ok: true,
      dataSource: 'local_csv',
    })
    return
  }

  try {
    const result = await getPool().query('SELECT COUNT(*)::int AS count FROM flights')

    res.status(200).json({
      ok: true,
      dataSource: 'neon',
      flights: result.rows[0]?.count ?? 0,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      dataSource: 'neon',
      error: 'Database connection failed',
    })
  }
}
