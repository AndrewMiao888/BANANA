export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: 'ollama' | 'groq' | 'error';
  updatedSummary?: string;
  wasSearched?: boolean;
}

export interface AgentOptions {
  messages: ChatMessage[];
  model?: string;
  existingSummary?: string;
}

export async function runAgent1Core({ 
  messages, 
  model = 'Instant-Nana', 
  existingSummary = '' 
}: AgentOptions): Promise<ChatResponse> {
  
  const formattedMessages = messages.map((msg: ChatMessage) => ({
    role: msg.role,
    content: msg.content
  }));

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      messages: formattedMessages,
      model,
      existingSummary
    })
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return await response.json();
}