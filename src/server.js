import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { buildServer } from './tools.js';
import { route } from './simulate.js';

export function createApp() {
  const app = express(); app.use(express.json({ limit: '50kb' }));
  const hits = new Map();   // naive per-IP limiter: 60 requests / minute
  app.use((req, res, next) => { const k = req.ip, n = Date.now(), h = (hits.get(k) || []).filter(t => n - t < 6e4);
    if (h.length >= 60) return res.status(429).json({ error: 'Too many requests.' }); h.push(n); hits.set(k, h); next(); });
  const token = process.env.MCP_TOKEN;
  const auth = (req, res, next) => (!token || req.get('authorization') === `Bearer ${token}`) ? next()
    : res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });
  const uid = req => String(req.get('x-user-id') || 'demo').slice(0, 40).replace(/[^\w-]/g, '');

  // MCP endpoint — Streamable HTTP, stateless (fresh server+transport per request).
  app.post('/mcp', auth, async (req, res) => {
    const server = buildServer(uid(req)); const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch { if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null }); }
  });
  app.all('/mcp', (req, res) => res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null }));

  // Simulated Alexa+ client: routes text to a tool and calls it over real MCP HTTP.
  app.post('/simulate', async (req, res) => {
    const text = String(req.body?.text || '').slice(0, 300), r = route(text);
    if (!r) return res.json({ reply: "Sorry, I can add deadlines, tell you what's due, plan study sessions, and quiz you from flashcards." });
    const client = new Client({ name: 'simulated-alexa', version: '1.0.0' });
    try {
      const url = new URL(`http://127.0.0.1:${req.socket.localPort}/mcp`);
      await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { ...(token && { Authorization: `Bearer ${token}` }), 'x-user-id': uid(req) } } }));
      const out = await client.callTool({ name: r[0], arguments: r[1] });
      res.json({ tool: r[0], args: r[1], isError: !!out.isError, reply: out.content?.[0]?.text ?? '' });
    } catch { res.status(502).json({ reply: 'The study service is unavailable right now.' }); }
    finally { client.close().catch(() => {}); }
  });
  app.get('/health', (_, res) => res.json({ ok: true }));
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
  return app;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.MCP_TOKEN) console.warn('WARNING: MCP_TOKEN not set — /mcp is unauthenticated.');
  createApp().listen(process.env.PORT || 3000, () => console.log(`StudyPilot MCP on :${process.env.PORT || 3000}/mcp`));
}
