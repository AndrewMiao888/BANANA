// src/agents.ts

// ==========================================
// 1. TYPE SCHEMAS & INTERFACES
// ==========================================

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

// ==========================================
// 2. BACKEND EXPECTED SYSTEM PERSONAS
// ==========================================

export const systemPrompts = {
  chatAgent: "You are NANA, an elite operations intelligence core. Provide precise, technical data analysis and execute logical directives efficiently.",
  codeAgent: "You are a specialized syntax compiler engine. Generate high-efficiency production code blocks based on operational parameters.",
  visionAgent: "You are a multi-modal imaging telemetry channel. Analyze file array asset structures and extract semantic context."
};

// ==========================================
// 3. CORE SERVICE EXECUTION LAYER
// ==========================================

/**
 * Dispatches thread array states safely to the centralized application backend router.
 */
export async function runAgent1Core(payload: AgentPayload): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: payload.messages,
        selectedModelId: payload.model || 'llama3-8b-8192', // Map to application routing keys
        summaryContext: payload.existingSummary || ''
      })
    });

    if (!response.ok) {
      throw new Error(`Server endpoint synchronization breakdown with code: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Agent Pipeline Failure:', error);
    return {
      content: `CRITICAL ENGINE ERROR: ${error.message || 'Network route failed.'}`,
      provider: 'error',
      updatedSummary: payload.existingSummary
    };
  }
}