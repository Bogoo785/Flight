import fs from 'node:fs'
import path from 'node:path'

const outputDir = path.resolve('outputs')
const csvPath = path.join(outputDir, 'taiwan_japan_flights_seed_700.csv')
const xlsxPath = path.join(outputDir, 'taiwan_japan_flights_seed_700.xlsx')

const startDate = new Date('2026-06-24T00:00:00')
const endDate = new Date('2026-09-24T00:00:00')

const origins = [
  {
    city: '桃園',
    airportCode: 'TPE',
    airportName: '桃園國際機場',
    priceOffset: 0,
  },
  {
    city: '高雄',
    airportCode: 'KHH',
    airportName: '高雄國際機場',
    priceOffset: 650,
  },
]

const destinations = [
  { city: '東京', airportCode: 'NRT', airportName: '成田國際機場', basePrice: 7980, duration: 195 },
  { city: '東京', airportCode: 'HND', airportName: '羽田機場', basePrice: 8480, duration: 200 },
  { city: '大阪', airportCode: 'KIX', airportName: '關西國際機場', basePrice: 7380, duration: 170 },
  { city: '沖繩', airportCode: 'OKA', airportName: '那霸機場', basePrice: 5680, duration: 100 },
  { city: '福岡', airportCode: 'FUK', airportName: '福岡機場', basePrice: 6880, duration: 140 },
  { city: '札幌', airportCode: 'CTS', airportName: '新千歲機場', basePrice: 10800, duration: 245 },
  { city: '名古屋', airportCode: 'NGO', airportName: '中部國際機場', basePrice: 7680, duration: 180 },
  { city: '熊本', airportCode: 'KMJ', airportName: '熊本機場', basePrice: 7180, duration: 145 },
  { city: '仙台', airportCode: 'SDJ', airportName: '仙台機場', basePrice: 9280, duration: 220 },
  { city: '函館', airportCode: 'HKD', airportName: '函館機場', basePrice: 11200, duration: 255 },
  { city: '神戶', airportCode: 'UKB', airportName: '神戶機場', basePrice: 7880, duration: 175 },
  { city: '高松', airportCode: 'TAK', airportName: '高松機場', basePrice: 6980, duration: 155 },
  { city: '宮崎', airportCode: 'KMI', airportName: '宮崎機場', basePrice: 7480, duration: 165 },
  { city: '岡山', airportCode: 'OKJ', airportName: '岡山機場', basePrice: 7280, duration: 165 },
  { city: '小松', airportCode: 'KMQ', airportName: '小松機場', basePrice: 8580, duration: 195 },
  { city: '新潟', airportCode: 'KIJ', airportName: '新潟機場', basePrice: 9180, duration: 215 },
  { city: '大分', airportCode: 'OIT', airportName: '大分機場', basePrice: 7080, duration: 150 },
  { city: '佐賀', airportCode: 'HSG', airportName: '佐賀機場', basePrice: 6680, duration: 140 },
  { city: '石垣', airportCode: 'ISG', airportName: '新石垣機場', basePrice: 6380, duration: 115 },
  { city: '旭川', airportCode: 'AKJ', airportName: '旭川機場', basePrice: 11680, duration: 260 },
]

const airlines = [
  {
    code: 'CI',
    name: '華航',
    baseFlight: 100,
    priceOffset: 700,
    baggageKg: 23,
    destinations: ['NRT', 'HND', 'KIX', 'OKA', 'FUK', 'CTS', 'NGO', 'KMJ', 'SDJ', 'TAK'],
  },
  {
    code: 'BR',
    name: '長榮',
    baseFlight: 180,
    priceOffset: 500,
    baggageKg: 23,
    destinations: ['NRT', 'HND', 'KIX', 'OKA', 'FUK', 'CTS', 'NGO', 'SDJ'],
  },
  {
    code: 'IT',
    name: '虎航',
    baseFlight: 220,
    priceOffset: -900,
    baggageKg: 20,
    destinations: [
      'NRT',
      'HND',
      'KIX',
      'OKA',
      'FUK',
      'CTS',
      'NGO',
      'KMJ',
      'SDJ',
      'HKD',
      'TAK',
      'KMI',
      'OKJ',
      'KMQ',
      'KIJ',
      'OIT',
      'HSG',
      'ISG',
      'AKJ',
    ],
  },
  {
    code: 'MM',
    name: '樂桃',
    baseFlight: 620,
    priceOffset: -650,
    baggageKg: 20,
    destinations: ['NRT', 'HND', 'KIX', 'OKA', 'FUK', 'CTS'],
  },
  {
    code: 'JX',
    name: '星宇',
    baseFlight: 800,
    priceOffset: 1100,
    baggageKg: 23,
    destinations: ['NRT', 'HND', 'KIX', 'OKA', 'FUK', 'CTS', 'NGO', 'KMJ', 'SDJ', 'HKD', 'UKB', 'TAK'],
  },
]

const cabinClasses = [
  { value: 'economy', multiplier: 1, seatsRatio: 0.72 },
  { value: 'premium_economy', multiplier: 1.55, seatsRatio: 0.18 },
  { value: 'business', multiplier: 2.8, seatsRatio: 0.1 },
]

const departureTimes = ['01:35', '06:50', '08:10', '10:20', '12:35', '13:40', '15:10', '17:25', '20:05', '22:15']
const statuses = ['scheduled', 'scheduled', 'scheduled', 'scheduled', 'limited']

let seed = 20260624
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

function pick(items) {
  return items[Math.floor(random() * items.length)]
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addMinutesToDate(date, time, minutes) {
  const [hours, mins] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, mins + minutes, 0, 0)
  return next
}

function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:00`
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function daysBetween(start, end) {
  return Math.round((end - start) / 86400000)
}

function buildFlightNumber(airline, destination, origin, rowIndex) {
  const destinationPart = destinations.findIndex((item) => item.airportCode === destination.airportCode) + 1
  const originPart = origin.airportCode === 'KHH' ? 7 : 1
  const serial = (airline.baseFlight + destinationPart * 3 + originPart + rowIndex) % 900
  return `${airline.code}${String(serial).padStart(3, '0')}`
}

function makeRows(count) {
  const rows = []
  const totalDays = daysBetween(startDate, endDate)
  let routeCursor = 0

  while (rows.length < count) {
    const origin = origins[routeCursor % origins.length]
    const airline = airlines[Math.floor(routeCursor / origins.length) % airlines.length]
    const availableDestinations = destinations.filter((destination) =>
      airline.destinations.includes(destination.airportCode),
    )
    const destination = availableDestinations[Math.floor(routeCursor / (origins.length * airlines.length)) % availableDestinations.length]
    const cabin = pick(cabinClasses)
    const flightDate = addDays(startDate, Math.floor(random() * (totalDays + 1)))
    const departureTime = pick(departureTimes)
    const delayBuffer = Math.floor(random() * 21) - 5
    const durationMinutes = destination.duration + (origin.airportCode === 'KHH' ? 8 : 0) + delayBuffer
    const departureDateTime = addMinutesToDate(flightDate, departureTime, 0)
    const arrivalDateTime = addMinutesToDate(flightDate, departureTime, durationMinutes)
    const dayOfWeek = departureDateTime.getDay()
    const weekendOffset = dayOfWeek === 0 || dayOfWeek === 6 ? 700 : 0
    const demandOffset = Math.floor(random() * 1800)
    const priceTwd = Math.round(
      ((destination.basePrice + origin.priceOffset + airline.priceOffset + weekendOffset + demandOffset) *
        cabin.multiplier) /
        10,
    ) * 10
    const seatsTotal = cabin.value === 'business' ? 20 : cabin.value === 'premium_economy' ? 36 : 180
    const seatsAvailable = Math.max(0, Math.floor(seatsTotal * cabin.seatsRatio * random()))
    const status = pick(statuses)
    const flightNumber = buildFlightNumber(airline, destination, origin, rows.length)

    rows.push({
      flight_id: rows.length + 1,
      route_code: `${origin.airportCode}-${destination.airportCode}`,
      airline_code: airline.code,
      airline_name: airline.name,
      flight_number: flightNumber,
      origin_city: origin.city,
      origin_airport_code: origin.airportCode,
      origin_airport_name: origin.airportName,
      destination_city: destination.city,
      destination_airport_code: destination.airportCode,
      destination_airport_name: destination.airportName,
      flight_date: formatDate(flightDate),
      departure_time: formatTime(departureDateTime),
      arrival_time: formatTime(arrivalDateTime),
      departure_datetime: formatDateTime(departureDateTime),
      arrival_datetime: formatDateTime(arrivalDateTime),
      duration_minutes: durationMinutes,
      stops: 0,
      cabin_class: cabin.value,
      price_twd: priceTwd,
      currency: 'TWD',
      seats_total: seatsTotal,
      seats_available: seatsAvailable,
      baggage_kg: airline.baggageKg,
      status,
      source_type: 'fake_seed',
      created_at: '2026-06-24 00:00:00',
      updated_at: '2026-06-24 00:00:00',
    })

    routeCursor += 1
  }

  return rows
    .sort((a, b) =>
    `${a.flight_date} ${a.departure_time} ${a.flight_number}`.localeCompare(
      `${b.flight_date} ${b.departure_time} ${b.flight_number}`,
    ),
  )
    .map((row, index) => ({ ...row, flight_id: index + 1 }))
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function writeCsv(rows) {
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','))
  }
  fs.writeFileSync(csvPath, `${lines.join('\n')}\n`, 'utf8')
}

function columnName(index) {
  let name = ''
  let current = index
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sheetXml(name, rows) {
  const headers = Object.keys(rows[0])
  const widths = headers
    .map((header, index) => `<col min="${index + 1}" max="${index + 1}" width="${Math.min(Math.max(header.length + 4, 12), 28)}" customWidth="1"/>`)
    .join('')
  const headerRow = `<row r="1">${headers
    .map((header, index) => {
      const cell = `${columnName(index + 1)}1`
      return `<c r="${cell}" s="1" t="inlineStr"><is><t>${xmlEscape(header)}</t></is></c>`
    })
    .join('')}</row>`
  const dataRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 2
      const cells = headers
        .map((header, columnIndex) => {
          const cell = `${columnName(columnIndex + 1)}${rowNumber}`
          const value = row[header]
          if (typeof value === 'number') {
            return `<c r="${cell}"><v>${value}</v></c>`
          }
          return `<c r="${cell}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${rowNumber}">${cells}</row>`
    })
    .join('')
  const lastCell = `${columnName(headers.length)}${rows.length + 1}`

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths}</cols>
  <sheetData>${headerRow}${dataRows}</sheetData>
  <autoFilter ref="A1:${lastCell}"/>
</worksheet>`
}

function notesXml() {
  const rows = [
    ['item', 'value'],
    ['date_range', '2026-06-24 to 2026-09-24'],
    ['row_count', '700'],
    ['usage', 'Fake seed data for Neon/PostgreSQL import. Use the CSV for easiest import.'],
    ['suggested_table', 'flights'],
    ['source_note', 'Routes are mock data inspired by Taiwan-Japan route patterns; not live fares or schedules.'],
  ].map(([item, value]) => ({ item, value }))
  return sheetXml('import_notes', rows)
}

function crc32(buffer) {
  let crc = ~0
  for (const byte of buffer) {
    crc ^= byte
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function dosDateTime(date = new Date()) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  const day =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate()
  return { time, day }
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value)
  return buffer
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value)
  return buffer
}

function makeZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0
  const { time, day } = dosDateTime(new Date('2026-06-24T00:00:00'))

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8')
    const contentBuffer = Buffer.from(file.content, 'utf8')
    const checksum = crc32(contentBuffer)

    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(time),
      writeUInt16(day),
      writeUInt32(checksum),
      writeUInt32(contentBuffer.length),
      writeUInt32(contentBuffer.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      nameBuffer,
    ])

    localParts.push(localHeader, contentBuffer)

    const centralHeader = Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(time),
      writeUInt16(day),
      writeUInt32(checksum),
      writeUInt32(contentBuffer.length),
      writeUInt32(contentBuffer.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      nameBuffer,
    ])
    centralParts.push(centralHeader)
    offset += localHeader.length + contentBuffer.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(files.length),
    writeUInt16(files.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(offset),
    writeUInt16(0),
  ])

  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

function writeXlsx(rows) {
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>`,
    },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Taiwan Japan Flights Seed Data</dc:title>
  <dc:creator>Codex</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-24T00:00:00Z</dcterms:created>
</cp:coreProperties>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="flights" sheetId="1" r:id="rId1"/>
    <sheet name="import_notes" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml('flights', rows) },
    { name: 'xl/worksheets/sheet2.xml', content: notesXml() },
  ]

  fs.writeFileSync(xlsxPath, makeZip(files))
}

fs.mkdirSync(outputDir, { recursive: true })
const rows = makeRows(700)
writeCsv(rows)
writeXlsx(rows)

console.log(JSON.stringify({ rows: rows.length, csvPath, xlsxPath }, null, 2))
