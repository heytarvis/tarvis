# Run for local development

1. In `development/express-backend`, add an `.env` with API keys for [Groq](https://console.groq.com/home) (free), and/or OpenAI (credits needed).
   You can also comment one line in and out in index.ts of the server package, for using mock results instead of real API calls.

2. pnpm -r i
3. Start backend
   - `cd development/backend`
   - `pnpm run dev`
4. Start vite frontend from project root `pnpm run dev`

Visit http://localhost:5173 to see the frontend.
