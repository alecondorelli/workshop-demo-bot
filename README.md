# Workshop Demo Bot

An educational Next.js application using TypeScript, Tailwind CSS and the OpenAI Chat Completions API.

## Local setup

1. Install Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env.local` and replace the example with your OpenAI API key.
3. Run `npm run dev` and open http://localhost:3000.

The key stays on the server. API usage is billed to your OpenAI account. A working key and network access are required.

## Architecture

The browser sends the conversation and editable system prompt to `/api/chat`. The server searches an OpenAI-hosted vector store, adds relevant chunks to the model context, and calls `gpt-6-luna`. The model may request the fixed illustrative schedule tool. Uploads are sent to OpenAI, indexed and shared across all users; supported formats are PDF, DOCX, TXT and Markdown up to 4 MB. Indexing is asynchronous, so files may take a short time to become searchable. The prompt is saved in the current browser and is not shared.

Set both `OPENAI_API_KEY` and `OPENAI_VECTOR_STORE_ID` on the server. The vector store must belong to the OpenAI project associated with the key. The app is a public demonstration: any visitor can upload files, change shared answers, and incur API or storage charges. Do not upload confidential information. The app has basic input bounds but no authentication or distributed rate limiting.

## Vercel deployment

Import the project into Vercel, select the Next.js framework preset, and add `OPENAI_API_KEY` and `OPENAI_VECTOR_STORE_ID` as server-side environment variables in project settings. Use the default build command. Do not commit `.env.local` or put the key in a `NEXT_PUBLIC_` variable.
