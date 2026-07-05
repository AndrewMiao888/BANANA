/**
 * ⚡ SynQuara Local Sovereign Core
 * 0% External Public APIs | 100% On-Premise Local Machine Hardware
 */
export async function runAgent1Core(userInput: string): Promise<string> {
  const cleanInput = userInput.trim();
  if (!cleanInput) return "⚠️ Invalid input frame.";

  try {
    const LOCAL_OLLAMA_URL = "https://young-hats-exist.loca.lt/api/generate";

    const response = await fetch(LOCAL_OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2:2b",
        // Keeps the text clean without unwanted formatting stars/dashes
        prompt: `Provide the response as plain text only. Do not use bold tags, stars (**), dashes (---), or bullet points. Also, you will be called BANANA AI and if they greet you, them your new name. Query: ${cleanInput}`,
        stream: false,
        options: {
          temperature: 0.3
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama service responded with status: ${response.status}`);
    }

    const data = await response.json();
    const aiOutput = data.response;

    return `🧠 [SynQuara Elite Core -> Sovereign Hardware Inference]
${aiOutput}

*(Status: 100% Local On-Premise Core Array | Engine: Open-Source Ollama)*`;

  } catch (error: any) {
    return `❌ Local Engine Error: Could not establish a handshake with Ollama. Make sure Ollama is running on your machine and ngrok is active. Details: ${error.message}`;
  }
}