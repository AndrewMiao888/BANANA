interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Executes the core logic for Agent 1 by proxying through the secure local server endpoint.
 * @param messages An array of chat messages representing the ongoing conversation history.
 */
export async function runAgent1Core(messages: ChatMessage[]): Promise<string> {
  try {
    // 1. Validation check to make sure history isn't completely empty
    if (!messages || messages.length === 0) {
      throw new Error("No conversation history or prompt provided.");
    }

    // 2. Route the request to your internal Nuxt server endpoint instead of Groq directly
    const response = await fetch('/api/generate', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    // 3. Handle HTTP relay errors safely
    if (!response.ok) {
      throw new Error(`Internal server relay responded with status ${response.status}`);
    }

    // 4. Parse and return the text response from the server handler
    const data = await response.json();
    if (data?.content) {
      return data.content;
    }

    throw new Error("Unexpected API response structure from server route.");

  } catch (error: any) {
    console.error("Failed to execute runAgent1Core:", error.message || error);
    return "System Error: The node platform is experiencing connection stability issues. Please attempt your transmission again shortly.";
  }
}