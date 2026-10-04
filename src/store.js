// Tiny per-user store (in memory, mirrored to data/store.json). Swap for a DB in production.
import fs from 'fs';
const FILE = new URL('../data/store.json', import.meta.url);
let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
export const user = id => (db[id] ??= { deadlines: [], cards: [], pending: null, last: null });
export const save = () => { try { fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch {} };
