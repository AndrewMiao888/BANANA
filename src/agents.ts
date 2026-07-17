export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: 'ollama' | 'groq' | 'error';
  updatedSummary?: string;
}

export interface AgentPayload {
  messages: ChatMessage[];
  model?: string;
  existingSummary?: string;
}

/**
 * Dispatches current conversation histories to the backend endpoint router.
 */
export async function runAgent1Core(payload: AgentPayload): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ 
      messages: payload.messages,
      model: payload.model || 'Instant-Nana',
      existingSummary: payload.existingSummary || ''
    })
  });

  if (!response.ok) {
    throw new Error(`Server connection failure with status: ${response.status}`);
  }

  return await response.json();
}