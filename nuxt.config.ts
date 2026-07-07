import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  future: {
    compatibilityVersion: 4
  },
  
  compatibilityDate: '2024-04-03',

  // 🔑 ENABLES VERCEL ENVIRONMENT VARIABLES ON THE SERVER
  runtimeConfig: {
    // This tells Nuxt to map your GROQ_API_KEY environment variable from Vercel
    groqApiKey: process.env.GROQ_API_KEY
  }
})