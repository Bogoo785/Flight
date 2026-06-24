import { useState } from 'react'
import './App.css'

const origins = [
  { value: '台北 (TPE)', city: '台北', airport: 'TPE' },
  { value: '高雄 (KHH)', city: '高雄', airport: 'KHH' },
]

const destinations = [
  { value: '東京 (NRT/HND)', city: '東京', airport: 'NRT', basePrice: 7980, duration: '3 小時 15 分' },
  { value: '大阪 (KIX)', city: '大阪', airport: 'KIX', basePrice: 7380, duration: '2 小時 50 分' },
  { value: '沖繩 (OKA)', city: '沖繩', airport: 'OKA', basePrice: 5680, duration: '1 小時 40 分' },
  { value: '福岡 (FUK)', city: '福岡', airport: 'FUK', basePrice: 6880, duration: '2 小時 20 分' },
  { value: '札幌 (CTS)', city: '札幌', airport: 'CTS', basePrice: 10800, duration: '4 小時 05 分' },
  { value: '名古屋 (NGO)', city: '名古屋', airport: 'NGO', basePrice: 7680, duration: '3 小時' },
  { value: '熊本 (KMJ)', city: '熊本', airport: 'KMJ', basePrice: 7180, duration: '2 小時 25 分' },
  { value: '仙台 (SDJ)', city: '仙台', airport: 'SDJ', basePrice: 9280, duration: '3 小時 40 分' },
]

const fallbackAirlines = [
  { airline: '中華航空', codePrefix: 'CI', depart: '08:10', arrive: '12:25', priceOffset: 520 },
  { airline: '長榮航空', codePrefix: 'BR', depart: '13:40', arrive: '18:05', priceOffset: 260 },
  { airline: '台灣虎航', codePrefix: 'IT', depart: '10:20', arrive: '16:45', priceOffset: -680 },
  { airline: '樂桃航空', codePrefix: 'MM', depart: '01:55', arrive: '06:10', priceOffset: -520 },
  { airline: '星宇航空', codePrefix: 'JX', depart: '15:10', arrive: '19:30', priceOffset: 920 },
]

function PlaneIcon({ className = '' }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M21.5 3.7c.7.7.5 1.9-.4 2.4l-5.6 3.4 2 8.2c.1.5-.1 1-.6 1.2l-1.2.6c-.5.2-1 .1-1.3-.4l-3.7-6.5-4.1 2.5-.4 2.8c-.1.4-.3.7-.6.9l-.9.5c-.5.3-1.1 0-1.2-.6l-.8-4.3-3.2-3c-.4-.4-.3-1.1.2-1.4l.9-.5c.3-.2.7-.2 1 0l2.6 1.1 4.1-2.5-3.9-6.4c-.3-.5-.2-1 .3-1.3L5.8.1c.5-.2 1-.1 1.3.3l5.9 6 5.7-3.3c.9-.5 2-.3 2.8.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function findOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0]
}

function getCabinClass(cabin) {
  if (cabin === '商務艙') return 'business'
  if (cabin === '豪華經濟艙') return 'premium_economy'
  return 'economy'
}

function buildFallbackFlights({ origin, destination, cabin, budget, nonstopOnly }) {
  const cabinMultiplier = cabin === '商務艙' ? 2.8 : cabin === '豪華經濟艙' ? 1.55 : 1
  const originPriceOffset = origin.airport === 'KHH' ? 650 : 0
  const destinationIndex = destinations.findIndex((item) => item.value === destination.value)

  return fallbackAirlines
    .map((flight, index) => {
      const priceTwd = Math.round(
        ((destination.basePrice + originPriceOffset + flight.priceOffset) * cabinMultiplier) / 10,
      ) * 10
      const isNonstop = index !== 3

      return {
        flightId: `fallback-${flight.codePrefix}-${index}`,
        airline: flight.airline,
        code: `${flight.codePrefix}${destinationIndex + 2}${origin.airport === 'KHH' ? '7' : '1'}${index + 6}`,
        route: `${origin.airport} 到 ${destination.airport}`,
        flightDate: '預估航班',
        time: `${flight.depart} - ${flight.arrive}`,
        duration: destination.duration,
        stops: isNonstop ? '直飛' : '轉機 1 次',
        priceTwd,
        price: `NT$ ${priceTwd.toLocaleString()}`,
      }
    })
    .filter((flight) => flight.priceTwd <= budget)
    .filter((flight) => !nonstopOnly || flight.stops === '直飛')
    .sort((first, second) => first.priceTwd - second.priceTwd)
}

function App() {
  const [tripType, setTripType] = useState('來回')
  const [cabin, setCabin] = useState('經濟艙')
  const [budget, setBudget] = useState(36000)
  const [nonstopOnly, setNonstopOnly] = useState(true)
  const [nearbyOrigin, setNearbyOrigin] = useState(false)
  const [nearbyDestination, setNearbyDestination] = useState(false)
  const [bundleHotel, setBundleHotel] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [flightResults, setFlightResults] = useState([])
  const [showAllResults, setShowAllResults] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const [searchForm, setSearchForm] = useState({
    from: '高雄 (KHH)',
    to: '東京 (NRT/HND)',
    departDate: '',
    returnDate: '',
    travelers: '1 位成人',
  })

  function updateSearchForm(field, value) {
    setSearchError('')
    setSearchNotice('')
    setSearchForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSearch(event) {
    event.preventDefault()

    if (tripType === '來回' && searchForm.departDate && searchForm.returnDate) {
      if (searchForm.departDate > searchForm.returnDate) {
        setFlightResults([])
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

    const origin = findOption(origins, searchForm.from)
    const destination = findOption(destinations, searchForm.to)

    try {
      const params = new URLSearchParams({
        from: origin.airport,
        to: destination.airport,
        departDate: searchForm.departDate || '2026-08-12',
        cabinClass: getCabinClass(cabin),
        nonstopOnly: String(nonstopOnly),
        budget: String(budget),
      })
      const response = await fetch(`/api/flights?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Flight API failed')
      }

      const data = await response.json()
      setFlightResults(data.flights ?? [])
      setHasSearched(true)
    } catch {
      setFlightResults(buildFallbackFlights({ origin, destination, cabin, budget, nonstopOnly }))
      setHasSearched(true)
      setSearchNotice('目前使用預估票價示範結果；啟動後端 API 後會改用資料庫航班。')
    } finally {
      setIsSearching(false)
    }
  }

  const visibleFlightResults = showAllResults ? flightResults : flightResults.slice(0, 5)
  const hiddenFlightCount = Math.max(0, flightResults.length - visibleFlightResults.length)

  return (
    <div className="app-shell">
      <header className="topbar" aria-label="AirScan">
        <a className="brand" href="#search" aria-label="AirScan 首頁">
          <span className="brand-mark">
            <PlaneIcon />
          </span>
          <span>AirScan</span>
        </a>
        <nav className="top-actions" aria-label="主要導覽">
          <a href="#about">說明頁面</a>
          <button aria-label="語言與地區" type="button">🌐</button>
          <button aria-label="收藏航班" type="button">♥</button>
        </nav>
      </header>

      <main>
        <section className="hero" id="search">
          <div className="product-tabs" role="tablist" aria-label="搜尋類型">
            <button className="product-tab active" type="button">
              <PlaneIcon />
              航班
            </button>
            <button className="product-tab" type="button">▰ 住宿</button>
            <button className="product-tab" type="button">▱ 租車</button>
          </div>

          <h1>一鍵搜尋，數百萬個便宜航班輕鬆網羅。</h1>

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
                  {origins.map((origin) => (
                    <option key={origin.value} value={origin.value}>
                      {origin.value}
                    </option>
                  ))}
                </select>
              </label>

              <button className="swap-button" type="button" aria-label="交換出發地與目的地">
                ⇄
              </button>

              <label className="search-card">
                <span>目的地</span>
                <select
                  onChange={(event) => updateSearchForm('to', event.target.value)}
                  value={searchForm.to}
                >
                  {destinations.map((destination) => (
                    <option key={destination.value} value={destination.value}>
                      {destination.value}
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

            <div className="option-row">
              <label>
                <input
                  checked={nearbyOrigin}
                  onChange={(event) => setNearbyOrigin(event.target.checked)}
                  type="checkbox"
                />
                新增鄰近機場
              </label>
              <label>
                <input
                  checked={nearbyDestination}
                  onChange={(event) => setNearbyDestination(event.target.checked)}
                  type="checkbox"
                />
                新增鄰近機場
              </label>
              <label>
                <input
                  checked={nonstopOnly}
                  onChange={(event) => setNonstopOnly(event.target.checked)}
                  type="checkbox"
                />
                直飛航班
              </label>
              <label>
                <input
                  checked={bundleHotel}
                  onChange={(event) => setBundleHotel(event.target.checked)}
                  type="checkbox"
                />
                一併搜尋住宿
              </label>
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
              <label className="budget-filter">
                預算 NT$ {budget.toLocaleString()}
                <input
                  max="90000"
                  min="12000"
                  onChange={(event) => setBudget(Number(event.target.value))}
                  step="2000"
                  type="range"
                  value={budget}
                />
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
                {searchForm.departDate || '彈性日期'}
                {tripType === '來回' && searchForm.returnDate ? ` - ${searchForm.returnDate}` : ''}，
                {searchForm.travelers}，{cabin}
              </span>
            </div>

            {flightResults.length === 0 ? (
              <div className="empty-results">目前沒有符合條件的航班，試著提高預算或關閉直飛篩選。</div>
            ) : (
              <div className="results-list">
                {visibleFlightResults.map((flight) => (
                  <article className="flight-result-card" key={flight.flightId}>
                    <div>
                      <h3>
                        {flight.airline} {flight.code}
                      </h3>
                      <p>
                        {flight.flightDate} · {flight.route} · {flight.time} · {flight.duration} ·{' '}
                        {flight.stops}
                      </p>
                    </div>
                    <strong>{flight.price}</strong>
                  </article>
                ))}
                {flightResults.length > 5 && (
                  <button
                    className="results-toggle"
                    onClick={() => setShowAllResults((current) => !current)}
                    type="button"
                  >
                    {showAllResults ? '收合結果' : `顯示另外 ${hiddenFlightCount} 筆航班`}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        <section className="info-band" id="about">
          <div>
            <p>AirScan</p>
            <h2>快速比較台灣飛日本航班</h2>
          </div>
          <p>
            以價格、直飛與艙等條件快速掃描航班清單，讓查票頁面先把重要資訊排整齊。
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
