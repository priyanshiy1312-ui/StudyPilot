// SIMULATED Alexa+ intent routing (rule-based). Real Alexa+ does its own language understanding and picks MCP tools itself.
export function route(t) {
  const s = t.trim(); let m;
  if ((m = s.match(/add (?:a )?deadline\s+(.+?)\s+(?:due|on|by)\s+(.+)/i))) return ['add_deadline', { title: m[1], due: m[2] }];
  if (/what('?s| is) due|my deadlines|what do i have/i.test(s)) return ['whats_due', {}];
  if ((m = s.match(/plan (?:a )?(?:study )?(?:session )?(?:for )?(\d+)\s*(?:min|minutes)(?:\s+(?:of|for)\s+(.+))?/i))) return ['plan_study_session', { minutes: +m[1], subject: m[2] }];
  if ((m = s.match(/flashcard\s+(?:question\s+)?(.+?)\s+answer\s+(.+)/i))) return ['add_flashcard', { question: m[1], answer: m[2] }];
  if (/quiz me|next question/i.test(s)) return ['quiz_me', {}];
  if ((m = s.match(/answer is\s+(.+)/i))) return ['quiz_me', { answer: m[1] }];
  return null;
}
