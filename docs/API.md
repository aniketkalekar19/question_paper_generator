# Question Paper API

Base path: `/api/v1`. Requests and responses use JSON. Include `Content-Type: application/json` on POST requests.

## Authentication

Send the server-configured `APP_API_KEY` in `x-api-key`. The key is checked with a constant-time comparison and must be kept private. Never put it in browser code or commit it to Git.

```http
x-api-key: your-api-key
```

## Generate a paper

`POST /api/v1/papers` (201 Created)

```json
{
  "subject": "Computer Networks",
  "courseCode": "CS301",
  "title": "Unit 1 Assessment",
  "sourceText": "Study material text, up to 30,000 characters",
  "difficulty": "medium",
  "questionTypes": ["mcq", "short_answer"],
  "questionCount": 5,
  "totalMarks": 20,
  "durationMinutes": 45
}
```

Supply either `sourceText` or `pdfBase64` (PDF encoded as standard Base64, maximum 7.5 MB; note that serverless hosts such as Vercel may impose a smaller total request-body limit such as 4.5 MB). `difficulty` is `easy`, `medium`, or `hard`. Question types are `mcq`, `short_answer`, and `long_answer`. Question count is 1–40; total marks 1–500 and must be at least the number of questions; duration is 1–360 minutes.

Optional `referencePdfBase64` accepts a PDF up to 7.5 MB and `requirementsPrompt` accepts up to 4,000 characters. The reference guides presentation and style only; generated questions must be new and grounded in study material. When requirements define sections, include section question counts, answer-any choices, and marks per question. The server calculates the maximum marks students must answer and rejects totals or section counts that contradict the prompt. The generated response includes a `blueprint`, `sectionName`, `sectionQuestionNumber`, and `markingCriteria`. The UI offers an on-screen preview switcher and separate print views for a student paper and its scheme of evaluation.

Success response:

```json
{
  "data": {
    "id": "paper-uuid",
    "title": "Unit 1 Assessment",
    "subject": "Computer Networks",
    "difficulty": "medium",
    "totalMarks": 20,
    "durationMinutes": 45,
    "blueprint": {
      "sections": [
        {
          "name": "Questions",
          "questionCount": 5,
          "answerCount": 5,
          "marksPerQuestion": 4,
          "totalMarks": 20
        }
      ],
      "questionCount": 5,
      "totalMarks": 20
    },
    "questions": [
      {
        "questionText": "...",
        "questionType": "mcq",
        "difficulty": "medium",
        "marks": 4,
        "sectionName": "Questions",
        "sectionQuestionNumber": 1,
        "options": [
          { "id": "A", "text": "...", "isCorrect": false },
          { "id": "B", "text": "...", "isCorrect": true }
        ],
        "correctAnswer": "...",
        "explanation": "...",
        "sourceReference": "...",
        "markingCriteria": ["..."]
      }
    ],
    "createdAt": "2026-11-19T00:00:00.000Z",
    "persisted": true
  }
}
```

`persisted` is false if Supabase service role configuration is absent or the database write fails. Generated content is still returned.

## List and retrieve saved papers

- `GET /api/v1/papers` returns up to 100 most recent saved papers.
- `GET /api/v1/papers/{id}` returns a saved paper with its questions.

Both require `x-api-key` and Supabase service role configuration.

## Errors

Error responses have this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": ["subject must be between 2 and 120 characters."]
  }
}
```

HTTP status codes: `400` invalid JSON or ID, `401` missing/invalid API key, `404` saved paper not found, `415` unsupported content type, `422` invalid fields, `429` Gemini rate limit, `500` database error, `502` AI generation failure, and `503` missing service configuration.

## Webhook

If `WEBHOOK_URL` and `WEBHOOK_SECRET` are configured, every successful generation sends a POST to the configured HTTPS URL:

```json
{
  "event": "paper.generated",
  "timestamp": "2026-11-19T00:00:00.000Z",
  "data": { "id": "paper-uuid", "subject": "Computer Networks" }
}
```

The receiver gets `Content-Type: application/json` and `X-Webhook-Signature: sha256=<hex>`. Verify the signature as HMAC-SHA256 of the exact raw request body with `WEBHOOK_SECRET`, using a constant-time comparison. Webhook delivery has a five-second timeout; delivery failures are logged server-side and do not undo paper generation.

## Web UI endpoint

The first-party UI uses `POST /api/generate` with the same JSON body. This route does not require the external API key so the key never enters the browser; protect its usage with platform rate limits when deploying publicly.
