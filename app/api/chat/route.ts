import { NextResponse } from 'next/server';
import { SCHEDULE } from '@/lib/workshop';

export const runtime = 'nodejs';
const MODEL = 'gpt-4o-mini';
type Message = { role: 'user' | 'assistant'; content: string };
const tools = [{ type: 'function', function: { name: 'get_workshop_schedule', description: 'Get the illustrative workshop agenda when asked about schedule, agenda or session order.', parameters: { type: 'object', properties: {}, additionalProperties: false } } }];

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Add OPENAI_API_KEY to .env.local to start chatting.' }, { status: 503 });
  let body: unknown;
  try { if (Number(request.headers.get('content-length') || 0) > 64000) throw new Error(); const raw = await request.text(); if (new TextEncoder().encode(raw).length > 64000) throw new Error(); body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Please send a valid request under 64 KB.' }, { status: 400 }); }
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12 || !messages.every((m: unknown) => { const x = m as Message; return x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string' && x.content.trim().length > 0 && x.content.length <= 2000; }) || messages[messages.length - 1].role !== 'user') return NextResponse.json({ error: 'Send up to 12 messages of 2,000 characters or fewer, ending with a user message.' }, { status: 400 });
  const { systemPrompt, knowledge } = body as { systemPrompt?: unknown; knowledge?: unknown };
  if (typeof systemPrompt !== 'string' || !systemPrompt.trim() || systemPrompt.length > 4000 || !Array.isArray(knowledge) || knowledge.length > 12 || !knowledge.every((item: unknown) => { const x = item as { id?: unknown; title?: unknown; text?: unknown }; return x && typeof x.id === 'string' && x.id.length <= 100 && typeof x.title === 'string' && x.title.trim().length > 0 && x.title.length <= 120 && typeof x.text === 'string' && x.text.trim().length > 0 && x.text.length <= 2000; })) return NextResponse.json({ error: 'Provide a prompt of up to 4,000 characters and up to 12 valid knowledge entries.' }, { status: 400 });
  type Note = { id: string; title: string; text: string };
  let selected: Note[] = [];
  let embeddingUsage: unknown = null;
  try {
    if (knowledge.length) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'text-embedding-3-small', input: [messages[messages.length - 1].content, ...(knowledge as Note[]).map(n => `${n.title}\n${n.text}`)] }), signal: AbortSignal.timeout(30000) });
      if (!embeddingResponse.ok) throw new Error();
      const data = await embeddingResponse.json();
      const vectors = (data.data as { index: number; embedding: number[] }[]).sort((a,b) => a.index-b.index).map(x => x.embedding);
      if (vectors.length !== knowledge.length + 1 || !vectors.every(v => Array.isArray(v) && v.length === vectors[0].length && v.every(Number.isFinite))) throw new Error();
      const cosine = (a: number[], b: number[]) => { let dot = 0, aa = 0, bb = 0; for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; aa += a[i]*a[i]; bb += b[i]*b[i]; } return aa && bb ? dot / Math.sqrt(aa*bb) : 0; };
      selected = (knowledge as Note[]).map((item, i) => ({ item, score: cosine(vectors[0], vectors[i+1]) })).sort((a,b) => b.score-a.score).slice(0,2).map(x => x.item);
      embeddingUsage = data.usage ?? null;
    }
  } catch { return NextResponse.json({ error: 'Could not create embeddings. Check your API key, account and network connection.' }, { status: 502 }); }
  const context = selected.length ? selected.map(x => `[${x.title}] ${x.text}`).join('\n\n') : 'No workshop notes are available.';
  const apiMessages: Array<Record<string, unknown>> = [{ role: 'system', content: systemPrompt }, { role: 'system', content: `Workshop notes retrieved for the latest question:\n${context}` }, ...messages];
  const calls: Array<Record<string, unknown>> = [];
  const requests: Array<Record<string, unknown>> = [];
  const responses: Array<Record<string, unknown>> = [];
  const invoke = async () => {
    const payload = { model: MODEL, messages: apiMessages, tools, tool_choice: 'auto', max_completion_tokens: 500 };
    requests.push({ model: MODEL, messages: JSON.parse(JSON.stringify(apiMessages)), tool_choice: 'auto', max_completion_tokens: 500, available_tools: ['get_workshop_schedule'] });
    const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('The model request failed. Check your API key, account and network connection.');
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice?.message) throw new Error('The model returned an unexpected response.');
    responses.push({ finish_reason: choice.finish_reason, message: choice.message, usage: data.usage ?? null });
    return choice.message;
  };
  try {
    let answer = await invoke();
    if (Array.isArray(answer.tool_calls) && answer.tool_calls.length) {
      if (answer.tool_calls.length > 3 || answer.tool_calls.some((call: { function?: { name?: string } }) => call.function?.name !== 'get_workshop_schedule')) throw new Error('The model requested an unsupported tool.');
      apiMessages.push(answer);
      for (const call of answer.tool_calls) {
        calls.push({ name: 'get_workshop_schedule', arguments: {}, result: SCHEDULE });
        apiMessages.push({ role: 'tool', tool_call_id: call.id, content: SCHEDULE });
      }
      answer = await invoke();
    }
    if (typeof answer.content !== 'string' || !answer.content.trim()) throw new Error('The model did not return a text answer. Please try again.');
    return NextResponse.json({ answer: answer.content, trace: { request: requests, response: responses, knowledge: selected, toolCalls: calls, embedding: { model: 'text-embedding-3-small', documents: knowledge.length, usage: embeddingUsage } } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && ['The model request failed. Check your API key, account and network connection.', 'The model returned an unexpected response.', 'The model requested an unsupported tool.', 'The model did not return a text answer. Please try again.'].includes(error.message) ? error.message : 'The model request failed or timed out. Please try again.' }, { status: 502 }); }
}
