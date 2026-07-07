interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}



/**
 * Executes the core logic for Agent 1 by proxying through the secure local server endpoint.
 * @param messages An array of chat messages representing the ongoing conversation history.
 */
export async function runAgent1Core(messages: ChatMessage[]): Promise<string> {
  // Format the conversations into standard AI message arrays with strict types
  const formattedMessages = messages.map((msg: ChatMessage) => ({
    role: msg.role,
    content: msg.content
  }));

  // 1. ATTEMPT LOCAL CONNECTION FIRST (Triggered when your computer is open/running)
  try {
    const localResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1', 
        messages: formattedMessages,
        stream: false,
        // 💡 UNLIMITED MEMORY LAYER: No limit tokens when processing locally
        options: {
          num_ctx: 16384 // Massive context window size for long memories
        }
      }),
      signal: AbortSignal.timeout(2000) // If your local PC server doesn't respond within 2 seconds, stop waiting
    });

    if (localResponse.ok) {
      const localData = await localResponse.json();
      console.log("⚡ BANANA Core Status: Running Local Mode (Infinite Tokens Enabled)");
      return localData.message.content;
    }
  } catch (error) {
    // If it fails or times out, your computer is closed or offline. Quietly fall back to Groq Cloud.
    console.log("☁️ BANANA Core Status: Computer offline/closed. Routing through Groq Cloud...");
  }

  // 2. FALLBACK TO GROQ CLOUD (Keeps your mobile/Vercel link alive when away from computer)
 try {
  // Pull the key safely using Nuxt's runtime configuration engine
  const config = useRuntimeConfig();
  const apiKey = config.groqApiKey || config.public?.groqApiKey || process.env.GROQ_API_KEY || '';

  const groqResponse = await fetch('https://api.groq.com/openapi/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: formattedMessages,
        max_tokens: 1025 // Standard safe cap applied on remote server transactions to avoid usage spikes
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API returned status code ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    return groqData.choices[0].message.content;
  } catch (groqError) {
    console.error("Critical: Both BANANA Core and GROQ pipelines failed.", groqError);
    return "Connection Error: BANANA Core systems are unreachable. Please check if your computer server is online or your account is valid.";
  }
}