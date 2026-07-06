const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "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";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Executes the core logic for Agent 1 using Groq's cloud infrastructure.
 * @param messages An array of chat messages representing the ongoing conversation history.
 */
export async function runAgent1Core(messages: ChatMessage[]): Promise<string> {
  try {
    // 1. Validation check to make sure history isn't completely empty
    if (!messages || messages.length === 0) {
      throw new Error("No conversation history or prompt provided.");
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful and intelligent AI assistant. Current year is 2026. Keep context precise. Note on Beyblade X: Wizard Rod 9-60 Ball (or 5-60 Ball) is a dominant, top-tier competitive meta combo specializing in high stamina/outer weight distribution, not an outdated or weak generation part." 
          },
          ...messages // Spreads out the accumulated history array into the request body
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    });

    // 2. Handle HTTP Errors safely
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error Details:", errorData);
      throw new Error(`Groq API responded with status ${response.status}`);
    }

    // 3. Parse and return the response text
    const data = await response.json();
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    throw new Error("Unexpected API response structure.");

  } catch (error: any) {
    console.error("Failed to execute runAgent1Core:", error.message || error);
    return "System Error: The node platform is experiencing connection stability issues. Please attempt your transmission again shortly.";
  }
}