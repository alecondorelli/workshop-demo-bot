'use client';
import { useEffect, useState } from 'react';
import { SYSTEM_PROMPT } from '@/lib/workshop';

type Message = { role: 'user' | 'assistant'; content: string };
export default function Home() {
  const [tab, setTab] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { try { const value = localStorage.getItem('workshop-system-prompt'); if (value) setSystemPrompt(value); else { const old = localStorage.getItem('workshop-demo-settings'); if (old) { const parsed = JSON.parse(old); if (typeof parsed.systemPrompt === 'string') setSystemPrompt(parsed.systemPrompt); } } } catch { /* Defaults remain usable when storage is unavailable. */ } }, []);
  function savePrompt() { if (!systemPrompt.trim()) { setError('Enter a system prompt.'); return; } try { localStorage.setItem('workshop-system-prompt', systemPrompt); setSaved(true); setError(''); } catch { setError('Could not save the prompt in this browser.'); } }
  async function send(text: string) {
    const content = text.trim(); if (!content || loading || content.length > 2000) return;
    const next: Message[] = [...messages, { role: 'user', content }]; setMessages(next); setInput(''); setLoading(true); setError('');
    try { const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.slice(-12), systemPrompt }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Something went wrong.'); setMessages([...next, { role: 'assistant', content: data.answer }]); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); } finally { setLoading(false); }
  }
  async function upload(file: File) {
    setUploading(true); setUploadMessage('Uploading and indexing…');
    try { const form = new FormData(); form.append('file', file); const res = await fetch('/api/knowledge', { method: 'POST', body: form }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Upload failed.'); setUploadMessage(data.message); }
    catch (e) { setUploadMessage(e instanceof Error ? e.message : 'Upload failed.'); } finally { setUploading(false); }
  }
  return <main className="shell"><aside className="app-sidebar"><div className="school-name">London<br/>Business<br/>School</div><div className="sidebar-rule"/><strong className="app-name">Workshop Demo Bot</strong><nav className="tabs" aria-label="Application sections"><button className={tab === 'chat' ? 'active' : ''} onClick={() => {setTab('chat'); setError('');}}><span className="nav-icon">◉</span><span>Chatbot</span></button><button className={tab === 'settings' ? 'active' : ''} onClick={() => {setTab('settings'); setError('');}}><span className="nav-icon">▤</span><span>Behind the scenes</span></button></nav><div className="sidebar-bottom">AI Fundamentals workshop</div></aside><div className="workspace"><header className="workspace-header"><h1>{tab === 'chat' ? 'Chatbot' : 'Behind the scenes'}</h1><p>{tab === 'chat' ? 'Ask a question about AI or the workshop.' : 'Configure the chatbot and its shared knowledge base.'}</p></header>
  {tab === 'chat' ? <section className="chat-layout"><div className="chat-card"><div className="card-title"><h2>Ask the demo bot</h2></div><div className="conversation" aria-live="polite">{messages.length === 0 ? <div className="welcome"><div className="bot-symbol">✳</div><h3>How can I help?</h3><p>Ask a question to get started.</p><div className="suggestions">{['What is RAG?', 'How do AI agents use tools?', 'What is the workshop schedule?'].map(x => <button key={x} onClick={() => send(x)}>{x} &nbsp; ↗</button>)}</div></div> : messages.map((m, i) => <div className="message" key={i}><div className="message-icon">{m.role === 'assistant' ? '✳' : 'YOU'}</div><div><span>{m.role === 'assistant' ? 'DEMO BOT' : 'YOU'}</span><p>{m.content}</p></div></div>)}{loading && <p>Thinking through your question…</p>}{error && <p className="error" role="alert">{error}</p>}</div><form className="composer" onSubmit={e => { e.preventDefault(); send(input); }}><label className="sr-only" htmlFor="message">Your message</label><textarea id="message" value={input} maxLength={2000} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder="Ask a question about AI…" rows={1}/><button disabled={loading || !input.trim()} aria-label="Send message">↑</button></form><p className="disclaimer">AI can make mistakes. Please don’t share sensitive information.</p></div></section> : <section className="dashboard"><div className="card settings"><div className="settings-title"><div><h3>Knowledge base</h3><p>Upload a file to the shared knowledge base. Files are sent to OpenAI and can inform answers for everyone.</p></div></div><label className="upload-button">{uploading ? 'Uploading…' : 'Upload file'}<input type="file" accept=".txt,.md,.pdf,.docx" disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ''; }}/></label><p className="upload-help">PDF, DOCX, TXT or Markdown · up to 4 MB</p><p role="status">{uploadMessage}</p></div><div className="card settings"><label htmlFor="system-prompt"><strong>System prompt</strong></label><p>Changes apply to your next message. Save to keep them in this browser.</p><textarea id="system-prompt" rows={8} maxLength={4000} value={systemPrompt} onChange={e => { setSystemPrompt(e.target.value); setSaved(false); }}/><div className="save-row"><button type="button" className="primary-button" onClick={savePrompt}>Save prompt</button><span role="status">{error || (saved ? 'Saved in this browser.' : '')}</span></div></div></section>}</div></main>;
}
