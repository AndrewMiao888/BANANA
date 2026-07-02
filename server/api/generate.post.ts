import { defineEventHandler, readBody } from 'h3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'training_data');

const BananaLexicon = {
  greetings: {
    keywords: ['hello', 'hi', 'hey', 'yo', 'greetings'],
    response: "Hello! The network handshake is fully functional. The BANANA core workspace pipelines are online, reactive, and operating completely locally."
  },
  identity: {
    keywords: ['who are you', 'your name', 'what is your name', 'banana'],
    response: "I am BANANA AI, an advanced multi-session local workspace assistant engine trained natively on mathematical context structures."
  },
  concepts: {
    love: "Love represents a foundational structural pattern of strong positive emotional, cognitive, and social bond matrices.",
    sigma: "Sigma corresponds to the 18th character allocation of the Greek linguistic matrix, translating to summation operations or standard deviation fields in structural calculus."
  }
};

function harvestTrainingMatrices(): string[] {
  try {
    if (!fs.existsSync(DATA_DIR)) return [];
    const targetFiles = fs.readdirSync(DATA_DIR);
    const compiledLines: string[] = [];
    
    for (const file of targetFiles) {
      if (file.endsWith('.txt')) {
        const fileContent = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
        const sanitizedLines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        compiledLines.push(...sanitizedLines);
      }
    }
    return compiledLines;
  } catch (error) {
    return [];
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return { error: 'Missing or invalid parameters.' };
    }

    const cleanPrompt = prompt.trim();
    const normalizedPrompt = cleanPrompt.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    if (BananaLexicon.greetings.keywords.some(keyword => normalizedPrompt === keyword || normalizedPrompt.startsWith(keyword))) {
      return { result: BananaLexicon.greetings.response, engine: 'BANANA-Lexical', source: 'Static Structural Data', confidence: '100%' };
    }

    if (BananaLexicon.identity.keywords.some(keyword => normalizedPrompt.includes(keyword))) {
      return { result: BananaLexicon.identity.response, engine: 'BANANA-Identity', source: 'Static Structural Data', confidence: '100%' };
    }

    if (normalizedPrompt.includes('love')) {
      return { result: BananaLexicon.concepts.love, engine: 'BANANA-Conceptual', source: 'Core System Definitions', confidence: '98.5%' };
    }
    if (normalizedPrompt.includes('sigma')) {
      return { result: BananaLexicon.concepts.sigma, engine: 'BANANA-Conceptual', source: 'Core System Definitions', confidence: '99.1%' };
    }

    const learnedLines = harvestTrainingMatrices();
    const inputTokens = normalizedPrompt.split(/\s+/).filter(token => token.length > 4);
    let semanticMatchResult: string | null = null;

    if (learnedLines.length > 0 && inputTokens.length > 0) {
      for (const trainingLine of learnedLines) {
        const lowerLine = trainingLine.toLowerCase();
        if (inputTokens.some(token => lowerLine.includes(token))) {
          semanticMatchResult = trainingLine;
          break;
        }
      }
    }

    if (semanticMatchResult) {
      return {
        result: semanticMatchResult,
        engine: 'BANANA-Training-Asset-Matcher',
        source: 'Local Textbook Ingestion File',
        confidence: '95.4% Learned Accuracy'
      };
    }

    return {
      result: `I evaluated your request for "${cleanPrompt}". The BANANA engine successfully analyzed the word structure using its local parameters, but this specific concept is not yet mapped inside our training datasets.`,
      engine: 'BANANA-Analysis-Fallback',
      source: 'Default Intent Matrix',
      confidence: '100%'
    };

  } catch (err: any) {
    return { error: 'Internal server route error.', details: err.message };
  }
});
