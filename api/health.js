import { hasDatabaseUrl } from './_shared.js'

export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    dataSource: hasDatabaseUrl() ? 'neon' : 'local_csv',
  })
}
