# AI Question Paper Generator

Next.js application for generating exam papers from pasted course material or uploaded PDFs. Gemini is called directly from the server using its REST `generateContent` API. Provider credentials are never sent to the browser.

## Paper requirements and reference papers

Study material remains required and can be pasted or uploaded as a PDF (up to 7.5 MB). Paper Requirements are optional natural-language instructions (up to 4,000 characters) that describe section names, questions offered, how many to answer, and marks per question. For example: “Section A: answer any 5 of 7 questions, 3 marks each. Section B: answer any 3 of 5 questions, 5 marks each. Total: 30 marks.” Before generation, the form displays a live Blueprint Summary with each section's offered/answer counts, marks per question, section marks, and total maximum marks students must answer; contradictory totals are rejected on both client and server before calling Gemini.

An optional Reference Paper PDF (up to 7.5 MB) guides formatting, section structure, question style, and difficulty only. New questions are based on the study material. The generation instructions prohibit copying questions or answers and prohibit reproducing names or other identifying details from the reference. Without a reference paper, generation uses the study material, the prompt, and the selected settings alone. The generated result provides an on-screen preview toggle and separate print-ready Student Question Paper and Scheme of Evaluation outputs; the student paper contains no answers or explanations.

Client and server validate PDF signatures/types, the 7.5 MB per-file limit, and prompt length. Gemini credentials remain in the server environment. Vercel Functions default to a 4.5 MB request-body limit, so the app's maximum PDF sizes can exceed the hosted request limit (base64 encoding also increases payload size). For a reliable first deployment, use pasted study material or compact PDFs. Vercel documents an opt-in 20 MiB request-body public beta using `VERCEL_SUPPORT_LARGE_REQUEST_BODY=1` and 4 GB Performance memory; this still may not fit two near-maximum PDFs in one request. Check the current Vercel limits before relying on large uploads.

## Run locally

1. Install Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in `GEMINI_API_KEY` from Google AI Studio. Keep all keys private.
3. For external API access, set `APP_API_KEY` to a long random secret. Optional database persistence also requires `SUPABASE_SERVICE_ROLE_KEY` and applying `supabase/schema.sql` to the configured Supabase project.
4. Run `npm run dev` and open `http://localhost:3000`.

The generator works without database persistence; generated output is returned immediately. The dashboard and external list/retrieve API need Supabase persistence configuration.

## Deployment

Deploy this Next.js project to Vercel by importing the repository; Vercel detects the Next.js framework automatically, so no `vercel.json` is required. Add environment variables in **Project Settings → Environment Variables**, then redeploy after changing them.

For basic question generation, configure this required server-only variable:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Gemini API credential used only by server routes. Never add a `NEXT_PUBLIC_` prefix. |
| `GEMINI_MODEL` | No | Optional model override. The server defaults to `gemini-3.8-flash`; choose a model available to the configured API key. |

For external API authentication, configure `APP_API_KEY` with a long random secret. For signed webhook delivery, configure both `WEBHOOK_URL` (a public HTTPS receiver) and `WEBHOOK_SECRET`. These features are optional for the first-party generator.

For the dashboard's Supabase connection, add:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** from Project Settings → API. Use `https://<project-ref>.supabase.co` (do not append `/rest/v1`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The project's publishable key (or legacy anon key) from Project Settings → API. |

To persist papers and enable the external list/retrieve endpoints, add `SUPABASE_SERVICE_ROLE_KEY` as a server-only variable and apply `supabase/schema.sql` to the configured project. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the dashboard's browser client. These Supabase variables are not required for generation itself. Select Production (and Preview too if you use preview deployments), save, and redeploy; Vercel does not receive local `.env.local` values automatically. Never set a service role key with a `NEXT_PUBLIC_` prefix. Keep `.env.local`, Gemini keys, the API key, webhook secret, and Supabase service role out of Git.

## API

See [API documentation](docs/API.md) for endpoints, authentication, request/response formats, error codes, and webhook signature verification.

Run `npm run typecheck` for the TypeScript check and `npm run build` for the production build.
