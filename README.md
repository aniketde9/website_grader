# Website Grader

CRO-focused pipeline: Playwright scrape →49 automated/heuristic checks → optional PageSpeed Insights → batched Claude (caveman) grading → CSV output with **category-weighted** score.

## Setup

```bash
npm install
npm run install:browsers
cp .env.example .env
```

Fill `ANTHROPIC_API_KEY` and `PAGESPEED_API_KEY` in `.env`.

**LLM default:** `CLAUDE_MODEL=claude-sonnet-4-6` (Claude Sonnet 4.6). Tier 3 still uses the **caveman** contract: one user message, reply with exactly eight comma-separated integers (1–5), no prose—so output tokens stay tiny. Override `CLAUDE_MODEL` if your account uses a different alias.

## Usage

```bash
node src/index.js grade --input ads.csv --output results.csv
node src/index.js grade --input ads.csv --skip-psi --skip-llm
node src/index.js grade --input ads.csv --no-resume
node src/index.js grade --input ads.csv --only-domain example.com
node src/index.js grade --input ads.csv --limit 3
node src/index.js grade --input ads.csv --vision-hero
node src/index.js grade --input ads.csv --weights config/weights.leadgen.example.json
```

### Input CSV columns

`profession,location,pincode,website_name,url,domain,...` (see project spec). `url` is required.

### Scoring

- **`total_weighted_score`**: weighted by category (see `src/scoring/weights.js` and `config/parameters.js`). Weights renormalize if a category has no scored parameters (e.g. all LLM cells empty).
- **`total_raw_score`**: unweighted mean over all parameters that have values.
- **`grade`**: A–F from weighted score (≥80 A, ≥65 B, …).

### p03 (CTA verb copy)

Discrete scale: `1` (strong verbs only), `0.6` (strong + weak), `0.4` (any verb), `0` (none).

## Tests

```bash
npm test
```

## Docker

```bash
docker build -t website-grader .
docker run --env-file .env -v %cd%:/app website-grader
```

Mount your `ads.csv` and output path as needed.

## Legal

Only analyze sites you are permitted to access. Respect robots.txt and applicable law.
