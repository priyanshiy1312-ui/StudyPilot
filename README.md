# StudyPilot — a voice-first study assistant MCP server (Alexa+ track)

**Problem:** students juggle deadlines, revision and focus time across apps. **Solution:** a self-hosted MCP server (Streamable HTTP) exposing 5 voice-friendly tools — add/read deadlines, plan a Pomodoro-style study session, save flashcards, and get quizzed by voice — plus a simulated Alexa+ web client for demos.

## MCP tools
| Tool | Purpose |
|---|---|
| `add_deadline(title, due, subject?)` | Save a deadline (`friday`, `tomorrow`, `in 3 days`, `2026-10-12`) |
| `whats_due(limit?)` | Speaks up to 3 soonest/overdue deadlines, offers more |
| `plan_study_session(minutes, subject?)` | 25-min focus blocks + 5-min breaks |
| `add_flashcard(question, answer, deck?)` | Save a flashcard |
| `quiz_me(deck?, answer?)` | Ask a random card, or check the spoken answer |

All replies are short and speakable; invalid input and missing state return clear messages (`isError`), never invented data.

## Run
```
npm install
cp .env.example .env     # set MCP_TOKEN to a long random value
npm start                # MCP endpoint: http://localhost:3000/mcp, simulator: http://localhost:3000/
npm test                 # 11 automated tests
```
Docker: `docker build -t studypilot . && docker run -p 3000:3000 -e MCP_TOKEN=... studypilot`.
Deploy to any host that gives public HTTPS (Render, Railway, Fly.io, AWS) and expose `/mcp`.

## Architecture
Alexa+ (or the simulator) → HTTPS `POST /mcp` (Bearer token, `x-user-id` header) → stateless MCP server (`@modelcontextprotocol/sdk`) → tools → per-user store (`data/store.json`; replace with a DB for production).
Security: bearer token, per-IP rate limit (60/min), zod input validation, body size limit, no secrets in code.

## Status / limitations (honest)
- **Tested:** the MCP server over real Streamable HTTP with the official SDK client (tools list, success, error and validation paths, auth, 405, simulator end-to-end).
- **Not tested:** connecting to real Alexa+ (needs preview access — follow the hackathon Resources page and verify its auth/registration requirements; this repo does not claim compatibility beyond the MCP spec). Not tested against MCP Inspector or in a browser with a microphone.
- The simulator uses regex routing, not an LLM. Real Alexa+ chooses tools itself from the tool descriptions.
- Store is single-process and file-based; not for multi-instance deployment.
- Not medical, legal or financial advice; the app gives no such advice.

## AI tool disclosure
Built with Claude (Anthropic) for code generation and review; the author reviewed and ran it.
