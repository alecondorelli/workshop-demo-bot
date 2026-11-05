export const SYSTEM_PROMPT = `You are Workshop Demo Bot, a friendly teaching assistant for a London Business School AI Fundamentals workshop. Explain concepts clearly to beginners, using concise examples. Use the supplied workshop notes when relevant and be honest when they do not contain an answer. The schedule tool returns an illustrative agenda, not confirmed event details. Never claim to have performed actions you did not perform.`;

export const KNOWLEDGE = [
  { id: 'workshop', title: 'About the workshop', text: 'AI Fundamentals is a London Business School workshop exploring how AI applications are assembled. This demo shows a chat interface, a server, a model API, a small local knowledge base, and a schedule tool.' },
  { id: 'rag', title: 'Retrieval augmented generation', text: 'RAG supplies relevant information to a model alongside a question. This demo compares embeddings of local notes and the question using cosine similarity, without a hosted vector database. Retrieved text is context, not a change to the model’s training.' },
  { id: 'agents', title: 'Workflows and agents', text: 'A workflow follows a defined sequence of steps. An agent can choose a tool to help with a task. This demo lets the model choose a schedule tool, while the server controls which tools can run.' },
  { id: 'safety', title: 'Responsible use', text: 'AI responses can be inaccurate. Check important claims and avoid sharing confidential or sensitive information in a workshop demo.' },
];
export const SCHEDULE = 'Illustrative agenda: introduction to AI applications; prompts and models; retrieval and knowledge; tools and agents; discussion and questions. Times and final session details have not been provided.';
