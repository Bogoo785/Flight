const geminiModels = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
].filter(Boolean)

function buildPrompt({ cabin, question, routeSummary, travelers, tripType, visibleTrips, autoCheapestDates = [] }) {
  const compactTrips = visibleTrips.slice(0, 6).map((trip, index) => ({
    option: index + 1,
    outbound: trip.outbound,
    returning: trip.returning ?? null,
    totalPriceTwd: trip.totalPriceTwd,
  }))

  const flightContext = compactTrips.length > 0
    ? `
目前使用者已搜尋以下航班方案，可作為參考：
- 路線：${routeSummary}，${tripType}，${travelers}，${cabin}
${JSON.stringify(compactTrips, null, 2)}
`
    : ''

  const cheapestDatesContext = autoCheapestDates.length > 0
    ? `
系統已自動查詢 ${routeSummary} 這段期間的票價，以下是最便宜的幾個出發日（已按總價由低到高排序）：
${autoCheapestDates.map((d, i) => `${i + 1}. ${d.label}，來回總價 NT$ ${d.totalPriceTwd.toLocaleString()}`).join('\n')}
`
    : ''

  return `你是一個萬能 AI 助理，請用繁體中文回答使用者的任何問題。${flightContext}${cheapestDatesContext}

使用者問題：
${question || '請介紹你自己能幫什麼忙。'}

請直接回答使用者的問題。如果上面有票價資料，請優先根據那些資料回答；如果是其他任何問題，直接正常回答。不要編造不存在的航班細節。`
}

export async function getGeminiRecommendation(payload) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('Missing GEMINI_API_KEY')
    error.statusCode = 500
    throw error
  }

  const prompt = buildPrompt(payload)
  let lastError

  for (const model of geminiModels) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      lastError = new Error(`Gemini request failed with ${model}: ${response.status} ${errorText}`)
      lastError.statusCode = response.status

      if (response.status === 429 || response.status === 503) {
        continue
      }

      throw lastError
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim()

    if (text) {
      return text
    }

    lastError = new Error(`Gemini returned an empty response with ${model}`)
    lastError.statusCode = 502
  }

  throw lastError ?? new Error('Gemini request failed')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const recommendation = await getGeminiRecommendation(req.body ?? {})
    res.status(200).json({ recommendation })
  } catch (error) {
    console.error(error)
    res.status(error.statusCode ?? 500).json({ error: 'Failed to get Gemini recommendation' })
  }
}
