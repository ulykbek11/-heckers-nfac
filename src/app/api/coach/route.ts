import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { moves, winner, difficulty, moveCount } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    const movesText = Array.isArray(moves) ? moves.join(', ') : 'Нет данных о ходах';
    const winnerText = winner === 'player' ? 'Игрок' : winner === 'opponent' ? 'ИИ' : 'Ничья';

    const prompt = `
      Ты профессиональный тренер по русским шашкам. Проанализируй завершенную партию.
      Уровень сложности ИИ: ${difficulty}.
      Победитель: ${winnerText}.
      Количество ходов: ${moveCount}.
      История ходов (в формате нотации): ${movesText}.

      Пожалуйста, предоставь разбор партии на русском языке. 
      Ответ должен быть дружелюбным, мотивирующим и структурированным.
      Обязательно включи:
      1. Общая оценка игры (коротко).
      2. Лучший момент или сильный ход.
      3. Главная ошибка (если есть) или что можно улучшить.
      4. Один практичный совет на будущее.

      Не используй сложную разметку (только текст и абзацы). Будь лаконичен (не более 150-200 слов).
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
       console.error('Gemini API Error:', data);
       throw new Error(data.error?.message || 'Failed to generate analysis');
    }

    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
       throw new Error('No analysis text found in response');
    }

    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error('Coach API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
