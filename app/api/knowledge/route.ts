import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  const store = process.env.OPENAI_VECTOR_STORE_ID;
  if (!key || !store) return NextResponse.json({ error: 'The knowledge base has not been configured yet.' }, { status: 503 });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_FILE_SIZE + 65536) return NextResponse.json({ error: 'File must be 4 MB or smaller.' }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 }); }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE || !ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) return NextResponse.json({ error: 'Choose a PDF, DOCX, TXT or Markdown file up to 4 MB.' }, { status: 400 });
  try {
    const data = new FormData(); data.append('purpose', 'assistants'); data.append('file', file, file.name);
    const uploaded = await fetch('https://api.openai.com/v1/files', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: data, signal: AbortSignal.timeout(30000) });
    if (!uploaded.ok) throw new Error();
    const uploadedFile = await uploaded.json();
    const attached = await fetch(`https://api.openai.com/v1/vector_stores/${encodeURIComponent(store)}/files`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: uploadedFile.id }), signal: AbortSignal.timeout(30000) });
    if (!attached.ok) throw new Error();
    let result = await attached.json();
    for (let i = 0; i < 10 && result.status === 'in_progress'; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const status = await fetch(`https://api.openai.com/v1/vector_stores/${encodeURIComponent(store)}/files/${encodeURIComponent(uploadedFile.id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
      if (!status.ok) throw new Error();
      result = await status.json();
    }
    if (result.status === 'failed' || result.status === 'cancelled') return NextResponse.json({ error: 'The file was uploaded, but indexing failed. Check its content and try another file.' }, { status: 422 });
    return NextResponse.json({ message: result.status === 'completed' ? 'File uploaded and ready to use.' : 'File uploaded. OpenAI is still indexing it; it may take a little longer to appear in answers.' });
  } catch { return NextResponse.json({ error: 'Upload or indexing failed. Please try again.' }, { status: 502 }); }
}
