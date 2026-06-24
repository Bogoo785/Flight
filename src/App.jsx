import { useState } from 'react'
import './App.css'

const origins = [
  { value: '桃園 TPE', city: '桃園', airport: 'TPE' },
  { value: '高雄 KHH', city: '高雄', airport: 'KHH' },
]

const destinations = [
  { value: '東京 NRT / HND', city: '東京', airport: 'NRT / HND', basePrice: 7980, duration: '3h 15m' },
  { value: '大阪 KIX', city: '大阪', airport: 'KIX', basePrice: 7380, duration: '2h 50m' },
  { value: '沖繩 OKA', city: '沖繩', airport: 'OKA', basePrice: 5680, duration: '1h 40m' },
  { value: '福岡 FUK', city: '福岡', airport: 'FUK', basePrice: 6880, duration: '2h 20m' },
  { value: '札幌 CTS', city: '札幌', airport: 'CTS', basePrice: 10800, duration: '4h 05m' },
  { value: '名古屋 NGO', city: '名古屋', airport: 'NGO', basePrice: 7680, duration: '3h 00m' },
  { value: '熊本 KMJ', city: '熊本', airport: 'KMJ', basePrice: 7180, duration: '2h 25m' },
  { value: '仙台 SDJ', city: '仙台', airport: 'SDJ', basePrice: 9280, duration: '3h 40m' },
  { value: '函館 HKD', city: '函館', airport: 'HKD', basePrice: 11200, duration: '4h 15m' },
  { value: '神戶 UKB', city: '神戶', airport: 'UKB', basePrice: 7880, duration: '2h 55m' },
  { value: '高松 TAK', city: '高松', airport: 'TAK', basePrice: 6980, duration: '2h 35m' },
  { value: '宮崎 KMI', city: '宮崎', airport: 'KMI', basePrice: 7480, duration: '2h 45m' },
]

const fallbackAirlines = [
  { airline: '華航', codePrefix: 'CI', depart: '08:10', arrive: '12:25', priceOffset: 520 },
  { airline: '長榮', codePrefix: 'BR', depart: '13:40', arrive: '18:05', priceOffset: 260 },
  { airline: '虎航', codePrefix: 'IT', depart: '10:20', arrive: '16:45', priceOffset: -680 },
  { airline: '樂桃', codePrefix: 'MM', depart: '01:55', arrive: '06:10', priceOffset: -520 },
  { airline: '星宇', codePrefix: 'JX', depart: '15:10', arrive: '19:30', priceOffset: 920 },
]

function findOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0]
}

function getPrimaryAirportCode(airport) {
  return airport.split(' ')[0]
}

function getCabinClass(cabin) {
  if (cabin === '豪華經濟艙') {
    return 'premium_economy'
  }

  if (cabin === '商務艙') {
    return 'business'
  }

  return 'economy'
}

function buildFallbackFlights({ origin, destination, cabin, budget }) {
  const cabinMultiplier = cabin === '商務艙' ? 2.8 : cabin === '豪華經濟艙' ? 1.55 : 1
  const originPriceOffset = origin.airport === 'KHH' ? 650 : 0
  const destinationIndex = destinations.findIndex((item) => item.value === destination.value)

  return fallbackAirlines
    .map((flight, index) => {
      const priceTwd = Math.round(
        ((destination.basePrice + originPriceOffset + flight.priceOffset) * cabinMultiplier) / 10,
      ) * 10

      return {
        flightId: `fallback-${flight.codePrefix}-${index}`,
        airline: flight.airline,
        code: `${flight.codePrefix}${destinationIndex + 2}${origin.airport === 'KHH' ? '7' : '1'}${index + 6}`,
        route: `${origin.airport} → ${getPrimaryAirportCode(destination.airport)}`,
        flightDate: '範例資料',
        time: `${flight.depart} - ${flight.arrive}`,
        duration: destination.duration,
        stops: '直飛',
        priceTwd,
        price: `NT$ ${priceTwd.toLocaleString()}`,
      }
    })
    .filter((flight) => flight.priceTwd <= budget)
    .sort((first, second) => first.priceTwd - second.priceTwd)
}

function App() {
  const [tripType, setTripType] = useState('來回')
  const [cabin, setCabin] = useState('經濟艙')
  const [budget, setBudget] = useState(36000)
  const [nonstopOnly, setNonstopOnly] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [flightResults, setFlightResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const [geminiPrompt, setGeminiPrompt] = useState('')
  const [geminiStatus, setGeminiStatus] = useState('')
  const [searchForm, setSearchForm] = useState({
    from: '桃園 TPE',
    to: '東京 NRT / HND',
    departDate: '2026-08-12',
    returnDate: '2026-08-16',
    travelers: '2 位成人',
  })

  function updateSearchForm(field, value) {
    setSearchError('')
    setSearchNotice('')
    setSearchForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSearch(event) {
    event.preventDefault()

    if (tripType === '來回' && searchForm.departDate > searchForm.returnDate) {
      setFlightResults([])
      setHasSearched(false)
      setSearchError('日期錯誤：出發日期不能晚於回程日期。')
      return
    }

    setSearchError('')
    setSearchNotice('')
    setIsSearching(true)
    setHasSearched(false)

    try {
      const origin = findOption(origins, searchForm.from)
      const destination = findOption(destinations, searchForm.to)
      const params = new URLSearchParams({
        from: origin.airport,
        to: getPrimaryAirportCode(destination.airport),
        departDate: searchForm.departDate,
        cabinClass: getCabinClass(cabin),
        nonstopOnly: String(nonstopOnly),
        budget: String(budget),
      })
      const response = await fetch(`/api/flights?${params.toString()}`)

      if (!response.ok) {
        throw new Error('搜尋航班失敗')
      }

      const data = await response.json()
      setFlightResults(data.flights ?? [])
      setHasSearched(true)
    } catch {
      const origin = findOption(origins, searchForm.from)
      const destination = findOption(destinations, searchForm.to)
      setFlightResults(buildFallbackFlights({ origin, destination, cabin, budget }))
      setHasSearched(true)
      setSearchNotice('航班 API 尚未連線，目前先使用前端範例資料。本地測試完整 API 請執行 npm run dev:full。')
    } finally {
      setIsSearching(false)
    }
  }

  function handleGeminiSubmit(event) {
    event.preventDefault()

    if (!geminiPrompt.trim()) {
      return
    }

    setGeminiStatus('已收到你的條件。之後接上 Gemini 後，推薦結果會顯示在這裡。')
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#1f6feb] text-sm font-semibold text-white">
              FP
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">FlightPlan AI</p>
              <p className="text-xs text-slate-500">機票搜尋與 Gemini 預留</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
        <section id="search" className="panel">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase text-[#1f6feb]">Flight Search</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">搜尋航班</h1>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {['來回', '單程'].map((type) => (
              <button
                key={type}
                className={`rounded-md px-3 py-2 ${
                  tripType === type ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => setTripType(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSearch}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
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
              <label className="field">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>出發</span>
                <input
                  onChange={(event) => updateSearchForm('departDate', event.target.value)}
                  type="date"
                  value={searchForm.departDate}
                />
              </label>
              <label className="field">
                <span>回程</span>
                <input
                  disabled={tripType === '單程'}
                  onChange={(event) => updateSearchForm('returnDate', event.target.value)}
                  type="date"
                  value={searchForm.returnDate}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>旅客</span>
                <select
                  onChange={(event) => updateSearchForm('travelers', event.target.value)}
                  value={searchForm.travelers}
                >
                  <option>1 位成人</option>
                  <option>2 位成人</option>
                  <option>2 位成人 + 1 兒童</option>
                </select>
              </label>
              <label className="field">
                <span>艙等</span>
                <select value={cabin} onChange={(event) => setCabin(event.target.value)}>
                  <option>經濟艙</option>
                  <option>豪華經濟艙</option>
                  <option>商務艙</option>
                </select>
              </label>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700">
              <span>只看直飛</span>
              <input
                checked={nonstopOnly}
                className="size-5 accent-[#1f6feb]"
                onChange={(event) => setNonstopOnly(event.target.checked)}
                type="checkbox"
              />
            </label>

            <label className="block rounded-lg border border-slate-200 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">總預算</span>
                <span className="font-semibold text-slate-950">NT$ {budget.toLocaleString()}</span>
              </div>
              <input
                className="mt-3 w-full accent-[#1f6feb]"
                max="90000"
                min="12000"
                onChange={(event) => setBudget(Number(event.target.value))}
                step="2000"
                type="range"
                value={budget}
              />
            </label>

            <button
              className="w-full rounded-lg bg-[#1f6feb] px-4 py-4 text-lg font-semibold text-white shadow-sm hover:bg-[#185abc] disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSearching}
              type="submit"
            >
              {isSearching ? '搜尋中...' : '搜尋航班'}
            </button>
            {searchError && <p className="form-error">{searchError}</p>}
            {searchNotice && <p className="form-notice">{searchNotice}</p>}
          </form>

          {hasSearched && (
            <div className="flight-results">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase text-[#1f6feb]">Search Results</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {searchForm.from} → {searchForm.to}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {searchForm.departDate}
                  {tripType === '來回' ? ` - ${searchForm.returnDate}` : ''}，{searchForm.travelers}，
                  {cabin}，預算 NT$ {budget.toLocaleString()}
                </p>
              </div>

              {flightResults.length === 0 ? (
                <div className="empty-results">
                  找不到符合條件的航班，請調整日期、預算或取消只看直飛。
                </div>
              ) : (
                <div className="space-y-3">
                  {flightResults.map((flight) => (
                    <button className="flight-result-card" key={flight.flightId} type="button">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {flight.airline} {flight.code}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {flight.flightDate} · {flight.route} · {flight.time} · {flight.duration} ·{' '}
                          {flight.stops}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-950">{flight.price}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel mt-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase text-[#1f6feb]">Gemini Placeholder</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">AI 條件對話框</h2>
            <p className="mt-1 text-sm text-slate-500">
              使用者可以先輸入旅行需求，之後這裡會串接 Gemini 產生推薦結果。
            </p>
          </div>

          <form className="chat-box" onSubmit={handleGeminiSubmit}>
            <textarea
              onChange={(event) => {
                setGeminiPrompt(event.target.value)
                setGeminiStatus('')
              }}
              placeholder="請輸入你的旅行條件，例如：想找台北到東京、預算 3 萬內、直飛、早去晚回、適合親子。"
              rows="5"
              value={geminiPrompt}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Gemini API 預留區</p>
              <button
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={!geminiPrompt.trim()}
                type="submit"
              >
                送出條件
              </button>
            </div>
          </form>

          {geminiStatus && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              {geminiStatus}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
