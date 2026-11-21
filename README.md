# Послесвечение

Дневник, который помнит не то, как выглядел день, а то, как он ощущался.
Genesis Hackathon, кейс ArtTech «Make the Invisible Visible».

- Концепция: `Poslesvechenie_koncepciya.pdf`
- План разработки: [docs/PLAN.md](docs/PLAN.md)
- Дизайн-система «Свет звезды»: [docs/DESIGN.md](docs/DESIGN.md)

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000 — лучше в мобильной ширине (DevTools → режим устройства).

## Анализ текста через Claude

Текст записи разбирает Claude (`src/app/api/analyze/route.ts`): эмоции, детали, люди, время суток, название дня и дословная подпись — строгим JSON.

- Локально: скопируйте `.env.example` в `.env.local` и вставьте ключ с console.anthropic.com.
- На Vercel: Settings → Environment Variables → `ANTHROPIC_API_KEY`.

Без ключа приложение работает: текст разбирается запасным словарём (`src/lib/text-mood.ts`).
Текст уходит в Claude только для анализа и нигде не сохраняется; записи хранятся в браузере пользователя.

Опубликованная версия: https://genesis-seven-indol.vercel.app
