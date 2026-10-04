import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { user, save } from './store.js';

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const day0 = d => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
// Accepts YYYY-MM-DD, today, tomorrow, "in N days", or a weekday name (next occurrence).
export function parseDate(s, now = new Date()) {
  s = s.trim().toLowerCase(); const t = day0(now); let m;
  if (s === 'today') return t;
  if (s === 'tomorrow') return t + 864e5;
  if ((m = s.match(/^in (\d{1,3}) days?$/))) return t + m[1] * 864e5;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { const v = Date.UTC(+m[1], m[2] - 1, +m[3]); return isNaN(v) ? null : v; }
  const i = DAYS.indexOf(s.replace(/^(next|this) /, ''));
  if (i >= 0) { let diff = (i - now.getUTCDay() + 7) % 7 || 7; return t + diff * 864e5; }
  return null;
}
const say = d => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const rel = (d, now = new Date()) => { const n = Math.round((d - day0(now)) / 864e5);
  return n < 0 ? `overdue by ${-n} day${n < -1 ? 's' : ''}` : n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days, on ${say(d)}`; };
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const ok = text => ({ content: [{ type: 'text', text }] });
const fail = text => ({ content: [{ type: 'text', text }], isError: true });

export function buildServer(userId = 'demo') {
  const server = new McpServer({ name: 'studypilot', version: '1.0.0' });
  const u = user(userId);

  server.registerTool('add_deadline', {
    description: 'Save an assignment, exam or task deadline for the student. "due" can be a date like 2026-10-12, "today", "tomorrow", "in 3 days" or a weekday name like "friday".',
    inputSchema: { title: z.string().min(1).max(80), due: z.string().min(1).max(40), subject: z.string().max(40).optional() },
  }, async ({ title, due, subject }) => {
    const d = parseDate(due);
    if (d == null) return fail(`I couldn't understand the date "${due}". Try a weekday, "tomorrow", or a date like 2026-10-12.`);
    u.deadlines.push({ title, due: d, subject }); save();
    return ok(`Got it. ${title} is due ${rel(d)}.`);
  });

  server.registerTool('whats_due', {
    description: 'Read out the student\'s upcoming and overdue deadlines, soonest first. Speaks at most 3; offers more.',
    inputSchema: { limit: z.number().int().min(1).max(3).optional() },
  }, async ({ limit = 3 }) => {
    if (!u.deadlines.length) return ok('You have no deadlines saved. Say "add deadline" to create one.');
    const all = [...u.deadlines].sort((a, b) => a.due - b.due), top = all.slice(0, limit);
    const parts = top.map(x => `${x.title}, ${rel(x.due)}`);
    const more = all.length > top.length ? ` You have ${all.length - top.length} more. Want to hear them?` : '';
    return ok(`You have ${all.length} deadline${all.length > 1 ? 's' : ''}. ${parts.join('. Then ')}.${more}`);
  });

  server.registerTool('plan_study_session', {
    description: 'Split a study time window into 25-minute focus blocks with 5-minute breaks. Optionally names the subject; otherwise suggests the nearest saved deadline.',
    inputSchema: { minutes: z.number().int().min(10).max(240), subject: z.string().max(60).optional() },
  }, async ({ minutes, subject }) => {
    const cycles = Math.floor(minutes / 30), rem = minutes - cycles * 30;
    const blocks = cycles + (rem >= 10 ? 1 : 0);
    const next = [...u.deadlines].sort((a, b) => a.due - b.due)[0];
    const focus = subject || (next ? `${next.title}, your nearest deadline` : 'your top priority');
    const brk = Math.max(blocks - 1, 0);
    return ok(`For ${minutes} minutes: ${blocks} focus block${blocks > 1 ? 's' : ''}${rem >= 10 && cycles ? ', the last one ' + rem + ' minutes' : ' of 25 minutes'}, with ${brk} five-minute break${brk === 1 ? '' : 's'}. Focus on ${focus}. Say start when you're ready.`);
  });

  server.registerTool('add_flashcard', {
    description: 'Save a flashcard (question and answer) for later quizzing.',
    inputSchema: { question: z.string().min(3).max(200), answer: z.string().min(1).max(200), deck: z.string().max(30).optional() },
  }, async ({ question, answer, deck = 'general' }) => {
    u.cards.push({ question, answer, deck }); save();
    return ok(`Saved. You now have ${u.cards.length} flashcard${u.cards.length > 1 ? 's' : ''}.`);
  });

  server.registerTool('quiz_me', {
    description: 'Without "answer": ask the student one random flashcard question. With "answer": check their spoken answer to the pending question and reveal the correct one.',
    inputSchema: { deck: z.string().max(30).optional(), answer: z.string().max(200).optional() },
  }, async ({ deck, answer }) => {
    if (answer !== undefined) {
      if (!u.pending) return fail('There is no open question. Say "quiz me" first.');
      const a = norm(answer), c = norm(u.pending.answer);
      const right = a.length > 0 && (a === c || c.includes(a) || a.includes(c));
      const r = right ? 'Correct!' : `Not quite. The answer is ${u.pending.answer}.`;
      u.pending = null; save(); return ok(`${r} Say "quiz me" for another.`);
    }
    const pool = u.cards.filter(c => !deck || c.deck === deck);
    if (!pool.length) return ok('You have no flashcards yet. Say "flashcard" with a question and answer to add one.');
    let c = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && c === u.last) c = pool.find(x => x !== u.last);
    u.pending = c; u.last = c; save();
    return ok(`Question: ${c.question}`);
  });
  return server;
}
