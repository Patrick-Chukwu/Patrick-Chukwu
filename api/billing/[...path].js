import { createApp } from '../../server/app.js'

// Vercel serverless entry for every /api/billing/* request. The same Express app runs
// locally through `npm run dev` / `npm start`, so behaviour is identical in both places.
// Configuration is read from process.env on each request, never at build time.
let app

export default function handler(req, res) {
  app ??= createApp({ serveStatic: false })
  return app(req, res)
}
