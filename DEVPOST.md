# Demo script (under 3 minutes)
1. (0:00) "Students lose track of deadlines. StudyPilot is an MCP server for Alexa+." Show repo/architecture slide.
2. (0:20) Open the simulator. Say/type: **add deadline DBMS assignment due friday** → point at the MCP tool chip.
3. (0:45) **what's due** → Alexa-style short reply.
4. (1:05) **plan 90 minutes of DBMS** → focus blocks.
5. (1:25) **flashcard what is a test oracle answer a mechanism to decide pass or fail**, then **quiz me**, then **my answer is a mechanism to decide pass or fail** → "Correct!".
6. (2:15) Show `npm test` (11 passing) and the public `/mcp` URL. Say clearly that the simulator stands in for Alexa+ unless you have real access.
7. (2:45) Close: self-hosted, Streamable HTTP, voice-first design.

# Devpost description (edit to match what you actually finish)
**Inspiration:** deadlines and revision are scattered across apps; voice is the lowest-friction way to capture them.
**What it does:** StudyPilot exposes five MCP tools (deadlines, study planning, flashcards, voice quizzing) designed for short spoken replies.
**How I built it:** Node.js, the official MCP TypeScript SDK (Streamable HTTP, stateless), zod validation, bearer-token auth, rate limiting, and a simulated Alexa+ web client.
**Challenges:** writing speakable responses; handling multi-turn quiz state; keeping errors human-readable.
**What's next:** real Alexa+ integration, a database, calendar sync.

# Product feedback (TEMPLATE — fill with your real experience before submitting)
- What was easy about building for Alexa+/MCP:
- What was confusing or missing in docs/tools:
- Suggestions:
