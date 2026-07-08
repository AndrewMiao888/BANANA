export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: 'ollama' | 'groq' | 'error';
}

export async function runAgent1Core(messages: ChatMessage[]): Promise<ChatResponse> {
  const formattedMessages = messages.map((msg: ChatMessage) => ({
    role: msg.role,
    content: msg.content
  }));

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: formattedMessages })
  });

  return await response.json();
}