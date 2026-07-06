import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      throw new Error("No conversation history or prompt provided.")
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful and intelligent AI assistant named BANANA AI created by SynQuara Digital. Make sure that you think carefully and provide accurate information and if you aren't sure, scrape Google. Current year is 2026. Keep context precise. Note on Beyblade X: Wizard Rod 9-60 Ball (or 5-60 Ball) is a dominant, top-tier competitive meta combo specializing in high stamina/outer weight distribution, not an outdated or weak generation part." 
          },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      throw new Error(`Groq server responded with code ${response.status}`)
    }

    const data = await response.json()
    return { content: data?.choices?.[0]?.message?.content || "Unexpected response string." }

  } catch (error: any) {
    console.error("Server API route breakdown:", error.message || error)
    return { content: "System Error: The node platform is experiencing connection stability issues. Please attempt your transmission again shortly." }
  }
})