import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { moves, winner, difficulty, moveCount } = await req.json()

    // Текущий формат moveHistory: массив строк типа ["C3 - D4", "B6 x D4"]
    const movesText = Array.isArray(moves) && moves.length > 0
      ? typeof moves[0] === 'string'
        ? moves.map((m: string, i: number) => `Ход ${i + 1}: ${m}`).join('\n')
        : moves.map((m: any, i: number) =>
            `Ход ${i + 1}: ${m.player === 'white' ? 'Игрок' : 'ИИ'} — (${m.from.row},${m.from.col}) → (${m.to.row},${m.to.col})${m.captures?.length ? ' [взятие]' : ''}`
          ).join('\n')
      : 'История ходов недоступна'

    const prompt = `Ты тренер по шашкам. Дай очень краткий анализ партии (максимум 3-4 предложения).
Обязательно упомяни конкретные сильные ходы или ошибки из истории ходов (например: "твой ход C3-D4 был хорош").
Пиши только чистым обычным текстом. Не используй спецсимволы, звездочки (*), жирный шрифт или списки.

Победитель: ${winner === 'player' || winner === 'white' ? 'Игрок (белые)' : 'ИИ (чёрные)'}
Уровень ИИ: ${difficulty || 'неизвестно'}
Всего ходов: ${moveCount || 0}

История ходов:
${movesText}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ analysis: `Ошибка API: ${error}` }, { status: 200 })
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Не удалось получить анализ'

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('Coach route error:', error)
    return NextResponse.json({ analysis: `Внутренняя ошибка: ${error.message}` }, { status: 500 })
  }
}
