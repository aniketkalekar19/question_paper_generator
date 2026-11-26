# AI Question Paper Generator

Next.js application for generating exam papers from pasted course material or uploaded PDFs. Gemini is called directly from the server using its REST `generateContent` API. Provider credentials are never sent to the browser.

## Run locally

1. Install Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in `GEMINI_API_KEY` from Google AI Studio. Keep all keys private.
3. For external API access, set `APP_API_KEY` to a long random secret. Optional database persistence also requires `SUPABASE_SERVICE_ROLE_KEY` and applying `supabase/schema.sql` to the configured Supabase project.
4. Run `npm run dev` and open `http://localhost:3000`.

The generator works without database persistence; generated output is returned immediately. The dashboard and external list/retrieve API need Supabase persistence configuration.

## Deployment

Deploy this Next.js project to Vercel and add the same server-only environment variables in the Vercel project settings. Apply the Supabase schema before enabling persistence. Redeploy after changing environment variables. Keep `.env.local`, Gemini keys, the API key, webhook secret, and Supabase service role out of Git.

## API

See [API documentation](docs/API.md) for endpoints, authentication, request/response formats, error codes, and webhook signature verification.
