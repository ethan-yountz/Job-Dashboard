# AI Job Market Intelligence Dashboard

A publicly deployable full-stack dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Recharts. It fetches live job postings from Adzuna, aggregates market signals for early-career candidates, and optionally uses the OpenAI API to generate a short market summary.

## Features

- Live job search through the Adzuna API using secure server-side route handlers
- Filters for role keyword, location, and remote-friendly vs non-remote roles
- Aggregated metrics for total postings, average salary, top companies, top locations, and top extracted skills
- Recharts visualizations for skills, salary by title, jobs by location, and company demand
- Recent job postings table with salary ranges and outbound links
- Optional server-side AI summary panel powered by OpenAI
- Seeded fallback data if Adzuna credentials are missing or the API is unavailable
- Local snapshot storage in the browser for quick trend comparison between searches
- Responsive UI tuned for desktop and mobile

## Architecture

- `src/app/page.tsx`: thin entry point that renders the dashboard shell
- `src/components/dashboard-shell.tsx`: client-side UI, filters, charts, loading states, and local snapshot storage
- `src/app/api/jobs/route.ts`: server route that fetches Adzuna data, normalizes it, and falls back to mock data when needed
- `src/app/api/ai-summary/route.ts`: server route that generates the optional OpenAI summary
- `src/lib/adzuna.ts`: Adzuna fetch logic and short-lived in-memory caching
- `src/lib/job-utils.ts`: normalization, remote detection, skill extraction, and aggregate analytics
- `src/lib/mock-data.ts`: seeded mock job postings for fallback mode
- `src/lib/openai.ts`: server-side OpenAI client and summary generation

## Required Accounts

- Adzuna developer account for `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`
- OpenAI API account for `OPENAI_API_KEY` if you want the AI summary panel enabled
- Vercel account for deployment

## Environment Variables

Create a local `.env.local` file from `.env.local.example` and fill in your real values:

```bash
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_COUNTRY=us
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.2
```

Notes:

- `ADZUNA_COUNTRY` defaults to `us`
- `OPENAI_API_KEY` is optional
- No secret is exposed client-side because all third-party API calls happen in server routes

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.local.example` and add your credentials.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Local Run Commands

```bash
npm run dev
npm run lint
npm run build
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. In the Vercel project settings, add:
   - `ADZUNA_APP_ID`
   - `ADZUNA_APP_KEY`
   - `ADZUNA_COUNTRY`
   - `OPENAI_API_KEY` if using AI summaries
   - `OPENAI_MODEL` if you want a model override
4. Deploy the project.

Vercel will build the Next.js App Router app and keep the environment variables server-side.

## Notes

- The dashboard uses heuristic remote detection because Adzuna does not consistently provide a dedicated remote flag in every listing.
- Salary metrics are computed only from postings that include salary data.
- The mock fallback keeps the UI usable if the live API is temporarily unavailable or rate-limited.
