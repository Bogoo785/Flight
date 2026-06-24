import fs from 'node:fs'
import path from 'node:path'

const csvPath = path.resolve('outputs/taiwan_japan_flights_seed_700.csv')
const taiwanAirports = new Set(['TPE', 'KHH'])

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
  return {
    headers,
    rows: lines.map((line) => {
      const values = parseCsvLine(line)
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
    }),
  }
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function pad(number) {
  return String(number).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}:00`
}

function addMinutes(dateTime, minutes) {
  const normalized = dateTime.includes('T') ? dateTime : dateTime.replace(' ', 'T')
  return new Date(new Date(normalized).getTime() + minutes * 60000)
}

function buildReturnFlight(row, nextFlightId) {
  const departureDateTime = addMinutes(row.arrival_datetime, 150)
  const arrivalDateTime = addMinutes(formatDateTime(departureDateTime), Number(row.duration_minutes))
  const priceTwd = Math.max(1000, Math.round((Number(row.price_twd) * 0.97) / 10) * 10)
  const flightSerial = (Number(String(row.flight_number).replace(/\D/g, '')) + 500) % 1000
  const flightNumber = `${row.airline_code}${String(flightSerial).padStart(3, '0')}`

  return {
    ...row,
    flight_id: nextFlightId,
    route_code: `${row.destination_airport_code}-${row.origin_airport_code}`,
    flight_number: flightNumber,
    origin_city: row.destination_city,
    origin_airport_code: row.destination_airport_code,
    origin_airport_name: row.destination_airport_name,
    destination_city: row.origin_city,
    destination_airport_code: row.origin_airport_code,
    destination_airport_name: row.origin_airport_name,
    flight_date: formatDate(departureDateTime),
    departure_time: formatTime(departureDateTime),
    arrival_time: formatTime(arrivalDateTime),
    departure_datetime: formatDateTime(departureDateTime),
    arrival_datetime: formatDateTime(arrivalDateTime),
    price_twd: priceTwd,
    source_type: 'fake_seed_return',
    updated_at: row.updated_at || row.created_at,
  }
}

const { headers, rows } = readCsvRows(csvPath)
const hasReturnRows = rows.some((row) => row.source_type === 'fake_seed_return')

if (hasReturnRows) {
  console.log(JSON.stringify({ skipped: true, reason: 'return rows already exist', rows: rows.length }, null, 2))
  process.exit(0)
}

const outboundRows = rows.filter(
  (row) =>
    taiwanAirports.has(row.origin_airport_code) &&
    !taiwanAirports.has(row.destination_airport_code),
)

let nextFlightId = Math.max(...rows.map((row) => Number(row.flight_id))) + 1
const returnRows = outboundRows.map((row) => buildReturnFlight(row, nextFlightId++))
const combinedRows = [...rows, ...returnRows].map((row, index) => ({
  ...row,
  flight_id: index + 1,
}))

const lines = [
  headers.join(','),
  ...combinedRows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
]

fs.writeFileSync(csvPath, `${lines.join('\n')}\n`, 'utf8')

console.log(JSON.stringify({
  skipped: false,
  originalRows: rows.length,
  returnRows: returnRows.length,
  totalRows: combinedRows.length,
  csvPath,
}, null, 2))
