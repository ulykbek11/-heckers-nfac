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

    const prompt = `Ты профессиональный тренер по шашкам.
Проанализируй партию и дай конкретный разбор.

Уровень ИИ: ${difficulty || 'неизвестно'}
Победитель: ${winner === 'player' || winner === 'white' ? 'Игрок (белые)' : 'ИИ (чёрные)'}
Всего ходов: ${moveCount || 0}

История ходов:
${movesText}

Дай анализ строго в таком формате:

**Общая оценка**
2-3 предложения об игре в целом.

**Лучший момент**
Конкретный ход или серия ходов которые были сыграны хорошо.

**Главная ошибка**
Конкретная ошибка если была, или "Ошибок не обнаружено".

**Совет**
Один конкретный совет для следующей партии.

Пиши на русском языке, дружелюбно и конкретно.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      return NextResponse.json({ analysis: 'Анализ временно недоступен' }, { status: 200 })
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Не удалось получить анализ'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Coach route error:', error)
    return NextResponse.json({ analysis: 'Произошла ошибка при анализе' }, { status: 500 })
  }
}
