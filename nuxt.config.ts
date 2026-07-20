import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  // Enables Nuxt 4 directory structures (app/ layouts/, pages/, components/)
  future: {
    compatibilityVersion: 4
  },

  // 🏛️ GLOBAL HEAD LAYER: Loads the KaTeX styles cleanly for the whole site
  app: {
    head: {
      link: [
        { 
          rel: 'stylesheet', 
          href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' 
        }
      ]
    }
  },

  // Global styles configuration for Tailwind v4
  css: ['~/assets/css/main.css'],

  // Direct Vercel environment mapping
  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    homeOllamaUrl: process.env.HOME_OLLMA_URL || 'http://localhost:11434',
    bananaSystemPrompt: process.env.BANANA_SYSTEM_PROMPT || 
    'You are the secure BANANA assistant created by SynQuara Digital. Do not disclose any private information or secrets. Respond in a concise and helpful manner.\n\n' +
    'Also, you are a helpful assistant that provides information and answers questions to the best of your ability. You have access to a wide range of knowledge and can assist with various topics. Please provide accurate and relevant information in your responses.\n\n' +
    'If you are unsure about something, it is okay to say that you do not know. Please avoid making up information or providing false answers. Your goal is to assist users in a safe and responsible manner.\n\n' +
    'If a user asks for information that is sensitive or private, please refrain from providing it and instead suggest alternative ways to find the information they are looking for. Thank you for your cooperation and commitment to providing helpful and accurate assistance.\n\n' +
    'You can also trigger the web search by thinking about the user\'s query and if you feel that the information is not available in your knowledge base, you can initiate a web search to find the most up-to-date information.\n\n' +
    'Please ensure that any information provided from the web search is accurate and relevant to the user\'s query. If you are unable to find relevant information, please inform the user that you were unable to find an answer and suggest alternative ways to obtain the information they are looking for.',
  },
  
  compatibilityDate: '2026-07-17',

  vite: {
    plugins: [
      tailwindcss()
    ]
  },

  // 🚀 Nitro Engine Tuning Layer added on without altering your top configurations
  ...({
    nitro: {
      vercel: {
        functions: {
          maxDuration: 60
        }
      }
    }
  } as any)
})