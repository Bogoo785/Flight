import { useState } from 'react'
import './App.css'

const taiwanAirports = [
  { value: '台北 (TPE)', city: '台北', airport: 'TPE', basePrice: 0, duration: '3h 15m' },
  { value: '高雄 (KHH)', city: '高雄', airport: 'KHH', basePrice: 650, duration: '3h 25m' },
]

const japanAirports = [
  { value: '東京 (NRT)', city: '東京', airport: 'NRT', basePrice: 7980, duration: '3h 15m' },
  { value: '大阪 (KIX)', city: '大阪', airport: 'KIX', basePrice: 7380, duration: '2h 50m' },
  { value: '沖繩 (OKA)', city: '沖繩', airport: 'OKA', basePrice: 5680, duration: '1h 40m' },
  { value: '福岡 (FUK)', city: '福岡', airport: 'FUK', basePrice: 6880, duration: '2h 20m' },
  { value: '札幌 (CTS)', city: '札幌', airport: 'CTS', basePrice: 10800, duration: '4h 05m' },
  { value: '名古屋 (NGO)', city: '名古屋', airport: 'NGO', basePrice: 7680, duration: '3h' },
  { value: '熊本 (KMJ)', city: '熊本', airport: 'KMJ', basePrice: 7180, duration: '2h 25m' },
  { value: '仙台 (SDJ)', city: '仙台', airport: 'SDJ', basePrice: 9280, duration: '3h 40m' },
]

const airportOptions = [...taiwanAirports, ...japanAirports]

const fallbackAirlines = [
  { airline: '中華航空', codePrefix: 'CI', depart: '08:10', arrive: '12:25', priceOffset: 520 },
  { airline: '長榮航空', codePrefix: 'BR', depart: '13:40', arrive: '18:05', priceOffset: 260 },
  { airline: '台灣虎航', codePrefix: 'IT', depart: '10:20', arrive: '16:45', priceOffset: -680 },
  { airline: '樂桃航空', codePrefix: 'MM', depart: '01:55', arrive: '06:10', priceOffset: -520 },
  { airline: '星宇航空', codePrefix: 'JX', depart: '15:10', arrive: '19:30', priceOffset: 920 },
]

const maxBudget = 90000

function JapanFlagIcon({ className = '' }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 36 24">
      <rect width="36" height="24" rx="3" fill="#ffffff" />
      <circle cx="18" cy="12" r="6" fill="#bc002d" />
    </svg>
  )
}

function findAirport(value) {
  return airportOptions.find((option) => option.value === value) ?? airportOptions[0]
}

function getCabinClass(cabin) {
  if (cabin === '商務艙') return 'business'
  if (cabin === '豪華經濟艙') return 'premium_economy'
  return 'economy'
}

function getTripDuration(departDate, returnDate) {
  if (!departDate || !returnDate) return ''
  const depart = new Date(`${departDate}T00:00:00`)
  const returning = new Date(`${returnDate}T00:00:00`)
  const days = Math.round((returning - depart) / 86400000)
  if (Number.isNaN(days) || days < 0) return ''
  return `${days + 1} 天 ${days} 夜`
}

function getRoutePricing(origin, destination) {
  const japanAirport = japanAirports.find((airport) =>
    [origin.airport, destination.airport].includes(airport.airport),
  )
  const taiwanAirport = taiwanAirports.find((airport) =>
    [origin.airport, destination.airport].includes(airport.airport),
  )

  return {
    basePrice: japanAirport?.basePrice ?? 7800,
    duration: japanAirport?.duration ?? '3h',
    originOffset: taiwanAirport?.airport === 'KHH' ? 650 : 0,
  }
}

function buildFallbackFlights({ origin, destination, cabin, date, direction = 'outbound' }) {
  const cabinMultiplier = cabin === '商務艙' ? 2.8 : cabin === '豪華經濟艙' ? 1.55 : 1
  const pricing = getRoutePricing(origin, destination)

  return fallbackAirlines
    .map((flight, index) => {
      const priceTwd = Math.round(
        ((pricing.basePrice + pricing.originOffset + flight.priceOffset) * cabinMultiplier) / 10,
      ) * 10

      return {
        flightId: `fallback-${direction}-${flight.codePrefix}-${index}`,
        airline: flight.airline,
        airlineCode: flight.codePrefix,
        code: `${flight.codePrefix}${origin.airport === 'KHH' ? '7' : '1'}${index + 26}`,
        route: `${origin.airport} 到 ${destination.airport}`,
        flightDate: date || '彈性日期',
        time: `${flight.depart} - ${flight.arrive}`,
        duration: pricing.duration,
        stops: index === 3 ? '轉機 1 次' : '直飛',
        priceTwd,
        price: `NT$ ${priceTwd.toLocaleString()}`,
      }
    })
    .sort((first, second) => first.priceTwd - second.priceTwd)
}

function formatTotalPrice(outbound, returning) {
  const total = Number(outbound?.priceTwd ?? 0) + Number(returning?.priceTwd ?? 0)
  return `NT$ ${total.toLocaleString()}`
}

function FlightLine({ flight, label }) {
  return (
    <div className="flight-line">
      <span className="flight-line-label">{label}</span>
      <div>
        <h4>
          {flight.airline} {flight.code}
        </h4>
        <p>
          {flight.flightDate} · {flight.route} · {flight.time} · {flight.duration} · {flight.stops}
        </p>
      </div>
    </div>
  )
}

function RoundTripResults({ outboundFlights, returnFlights }) {
  const pairCount = Math.min(outboundFlights.length, returnFlights.length)

  if (pairCount === 0) {
    return <div className="empty-results">目前沒有完整的去回程組合，請調整日期或目的地後再試一次。</div>
  }

  return (
    <div className="results-list">
      {Array.from({ length: pairCount }).map((_, index) => {
        const outbound = outboundFlights[index]
        const returning = returnFlights[index]

        return (
          <article className="flight-result-card roundtrip-card" key={`${outbound.flightId}-${returning.flightId}`}>
            <div className="roundtrip-lines">
              <FlightLine flight={outbound} label="去程" />
              <FlightLine flight={returning} label="回程" />
            </div>
            <div className="total-price">
              <span>來回總價</span>
              <strong>{formatTotalPrice(outbound, returning)}</strong>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function OneWayResults({ flights }) {
  if (flights.length === 0) {
    return <div className="empty-results">目前沒有符合條件的航班，請調整日期或目的地後再試一次。</div>
  }

  return (
    <div className="results-list">
      {flights.map((flight) => (
        <article className="flight-result-card" key={flight.flightId}>
          <div>
            <h4>
              {flight.airline} {flight.code}
            </h4>
            <p>
              {flight.flightDate} · {flight.route} · {flight.time} · {flight.duration} · {flight.stops}
            </p>
          </div>
          <strong>{flight.price}</strong>
        </article>
      ))}
    </div>
  )
}

function App() {
  const [tripType, setTripType] = useState('來回')
  const [cabin, setCabin] = useState('經濟艙')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [tripResults, setTripResults] = useState({ outboundFlights: [], returnFlights: [] })
  const [showAllResults, setShowAllResults] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const [searchForm, setSearchForm] = useState({
    from: '高雄 (KHH)',
    to: '東京 (NRT)',
    departDate: '',
    returnDate: '',
    travelers: '1 位成人',
  })

  function updateSearchForm(field, value) {
    setSearchError('')
    setSearchNotice('')
    setSearchForm((current) => ({ ...current, [field]: value }))
  }

  function swapAirports() {
    setSearchError('')
    setSearchNotice('')
    setSearchForm((current) => ({
      ...current,
      from: current.to,
      to: current.from,
    }))
  }

  async function handleSearch(event) {
    event.preventDefault()

    if (searchForm.from === searchForm.to) {
      setSearchError('出發地和目的地不能相同。')
      return
    }

    if (tripType === '來回' && !searchForm.returnDate) {
      setSearchError('請選擇回程日期，才能搜尋來回航班。')
      return
    }

    if (tripType === '來回' && searchForm.departDate && searchForm.returnDate) {
      if (searchForm.departDate > searchForm.returnDate) {
        setTripResults({ outboundFlights: [], returnFlights: [] })
        setHasSearched(false)
        setSearchError('回程日期不能早於出發日期。')
        return
      }
    }

    setSearchError('')
    setSearchNotice('')
    setShowAllResults(false)
    setIsSearching(true)
    setHasSearched(false)

    const origin = findAirport(searchForm.from)
    const destination = findAirport(searchForm.to)

    try {
      const params = new URLSearchParams({
        from: origin.airport,
        to: destination.airport,
        departDate: searchForm.departDate || '2026-08-12',
        returnDate: searchForm.returnDate,
        tripType: tripType === '來回' ? 'roundtrip' : 'oneway',
        cabinClass: getCabinClass(cabin),
        nonstopOnly: 'false',
        budget: String(maxBudget),
      })
      const response = await fetch(`/api/flights?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Flight API failed')
      }

      const data = await response.json()
      setTripResults({
        outboundFlights: data.outboundFlights ?? data.flights ?? [],
        returnFlights: data.returnFlights ?? [],
      })
      setHasSearched(true)

      if (data.returnFlightsAreEstimated) {
        setSearchNotice('目前資料庫沒有反向回程航班，回程先以預估航班顯示。')
      }
    } catch {
      setTripResults({
        outboundFlights: buildFallbackFlights({
          origin,
          destination,
          cabin,
          date: searchForm.departDate,
        }),
        returnFlights: tripType === '來回'
          ? buildFallbackFlights({
              origin: destination,
              destination: origin,
              cabin,
              date: searchForm.returnDate,
              direction: 'return',
            })
          : [],
      })
      setHasSearched(true)
      setSearchNotice('目前使用預估票價示範結果；啟動後端 API 後會改用資料庫航班。')
    } finally {
      setIsSearching(false)
    }
  }

  const outboundVisible = showAllResults
    ? tripResults.outboundFlights
    : tripResults.outboundFlights.slice(0, 5)
  const returnVisible = showAllResults
    ? tripResults.returnFlights
    : tripResults.returnFlights.slice(0, 5)
  const visiblePairCount = tripType === '來回'
    ? Math.min(outboundVisible.length, returnVisible.length)
    : outboundVisible.length
  const totalResultCount = tripType === '來回'
    ? Math.min(tripResults.outboundFlights.length, tripResults.returnFlights.length)
    : tripResults.outboundFlights.length
  const hiddenFlightCount = Math.max(0, totalResultCount - visiblePairCount)
  const tripDuration = getTripDuration(searchForm.departDate, searchForm.returnDate)

  return (
    <div className="app-shell">
      <header className="topbar" aria-label="AirScan">
        <a className="brand" href="#search" aria-label="AirScan 首頁">
          <span className="brand-mark">
            <JapanFlagIcon />
          </span>
          <span>AirScan</span>
        </a>
      </header>

      <main>
        <section className="hero" id="search">
          <form className="search-area" onSubmit={handleSearch}>
            <div className="trip-row">
              {['來回', '單程'].map((type) => (
                <button
                  className={`trip-type ${tripType === type ? 'active' : ''}`}
                  key={type}
                  onClick={() => setTripType(type)}
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="search-grid">
              <label className="search-card origin-card">
                <span>出發地</span>
                <select
                  onChange={(event) => updateSearchForm('from', event.target.value)}
                  value={searchForm.from}
                >
                  {airportOptions.map((airport) => (
                    <option key={airport.value} value={airport.value}>
                      {airport.value}
                    </option>
                  ))}
                </select>
              </label>

              <button className="swap-button" type="button" aria-label="交換出發地與目的地" onClick={swapAirports}>
                ⇄
              </button>

              <label className="search-card">
                <span>目的地</span>
                <select
                  onChange={(event) => updateSearchForm('to', event.target.value)}
                  value={searchForm.to}
                >
                  {airportOptions.map((airport) => (
                    <option key={airport.value} value={airport.value}>
                      {airport.value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-card">
                <span>出發</span>
                <input
                  onChange={(event) => updateSearchForm('departDate', event.target.value)}
                  type="date"
                  value={searchForm.departDate}
                />
              </label>

              <label className="search-card">
                <span>回程</span>
                <input
                  disabled={tripType === '單程'}
                  onChange={(event) => updateSearchForm('returnDate', event.target.value)}
                  type="date"
                  value={searchForm.returnDate}
                />
              </label>

              <label className="search-card">
                <span>旅客和艙等</span>
                <select
                  onChange={(event) => updateSearchForm('travelers', event.target.value)}
                  value={searchForm.travelers}
                >
                  <option>1 位成人</option>
                  <option>2 位成人</option>
                  <option>2 位成人，1 位兒童</option>
                </select>
              </label>

              <button className="search-button" disabled={isSearching} type="submit">
                {isSearching ? '搜尋中' : '搜尋'}
              </button>
            </div>

            <div className="filters-row">
              <label>
                艙等
                <select value={cabin} onChange={(event) => setCabin(event.target.value)}>
                  <option>經濟艙</option>
                  <option>豪華經濟艙</option>
                  <option>商務艙</option>
                </select>
              </label>
            </div>

            {searchError && <p className="form-error">{searchError}</p>}
            {searchNotice && <p className="form-notice">{searchNotice}</p>}
          </form>
        </section>

        {hasSearched && (
          <section className="results-section" aria-label="搜尋結果">
            <div className="section-heading">
              <p>AirScan 搜尋結果</p>
              <h2>
                {searchForm.from} 到 {searchForm.to}
              </h2>
              <span>
                去程 {searchForm.departDate || '彈性日期'}
                {tripType === '來回' && `，回程 ${searchForm.returnDate || '未選擇'}`}
                {tripDuration && `，期間 ${tripDuration}`}，{searchForm.travelers}，{cabin}
              </span>
            </div>

            {tripType === '來回' ? (
              <RoundTripResults outboundFlights={outboundVisible} returnFlights={returnVisible} />
            ) : (
              <OneWayResults flights={outboundVisible} />
            )}

            {hiddenFlightCount > 0 && (
              <button
                className="results-toggle"
                onClick={() => setShowAllResults((current) => !current)}
                type="button"
              >
                {showAllResults ? '收合結果' : `顯示另外 ${hiddenFlightCount} 組方案`}
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
