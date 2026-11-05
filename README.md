# Workshop Demo Bot

An educational Next.js application using TypeScript, Tailwind CSS and the OpenAI Chat Completions API.

## Local setup

1. Install Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env.local` and replace the example with your OpenAI API key.
3. Run `npm run dev` and open http://localhost:3000.

The key stays on the server. API usage is billed to your OpenAI account. A working key and network access are required.

## Architecture

The browser sends up to 12 recent messages, the editable system prompt, and knowledge notes to `/api/chat`. The server validates the inputs and requests embeddings from `text-embedding-3-small` for the question and notes. It ranks the notes by cosine similarity, then sends the two closest notes with the prompt to `gpt-4o-mini`. Vectors are held in memory for that request and recomputed on every question; this is a small ephemeral vector store, not a hosted vector database. Each question incurs embedding and chat API costs.

In Behind the scenes, edit the prompt and add, change or remove notes. Edits apply to the next message; select Save changes to retain them in that browser across refreshes. They are not shared between users or devices. Do not enter confidential information: the notes and conversation are sent to OpenAI and stored in browser storage when saved. The fixed illustrative schedule tool is separate from the editable notes.

The dashboard shows selected notes, tool calls, relevant request fields, model responses and usage for the latest successful interaction. It excludes the API key and server configuration. The server limits the prompt to 4,000 characters, up to 12 notes of 2,000 characters each, up to 12 conversation messages of 2,000 characters each, and output to 500 tokens per model call. These bounds are not a rate limiter. A public deployment needs appropriate access controls, abuse prevention and spending limits before a key is configured.

## Vercel deployment

Import the project into Vercel, select the Next.js framework preset, and add `OPENAI_API_KEY` as a server-side environment variable in project settings. Use the default build command. Do not commit `.env.local` or put the key in a `NEXT_PUBLIC_` variable.
