// 1. Core Structural Blueprints
export interface SpecialistAgent {
  id: number;
  name: string;
  focusKeywords: string[];
  process: (input: string) => string;
}

// 2. The 10 Focused Specialist Profiles (Agents 2 to 11)
export const specialists: SpecialistAgent[] = [
  {
    id: 2,
    name: "Task Automator",
    focusKeywords: ["automate", "repetitive", "schedule", "entry", "sorting", "routine"],
    process: (data) => `🤖 [Agent 2] Processing automation macro sequences for: "${data}"`
  },
  {
    id: 3,
    name: "Creative Generator",
    focusKeywords: ["write", "generate", "creative", "essay", "code", "poem", "story", "novel"],
    process: (data) => `🎨 [Agent 3] Generating semantic text/code structures for: "${data}"`
  },
  {
    id: 4,
    name: "Data Analyst",
    focusKeywords: ["analyze", "data", "massive", "patterns", "trends", "sift", "metrics"],
    process: (data) => `📊 [Agent 4] Running algorithmic data parsing matrices on: "${data}"`
  },
  {
    id: 5,
    name: "Personalization Engine",
    focusKeywords: ["personalize", "recommend", "spotify", "netflix", "tiktok", "preference"],
    process: (data) => `🎛️ [Agent 5] Re-weighting user recommendation profiles for: "${data}"`
  },
  {
    id: 6,
    name: "NLP Translator",
    focusKeywords: ["translate", "language", "voice", "assistant", "chatbot", "speech"],
    process: (data) => `🗣️ [Agent 6] Mapping token strings across language barriers for: "${data}"`
  },
  {
    id: 7,
    name: "Fraud Prevention Shield",
    focusKeywords: ["fraud", "anomaly", "bank", "hack", "transaction", "secure", "scam"],
    process: (data) => `🛡️ [Agent 7] Reviewing real-time risk compliance data for: "${data}"`
  },
  {
    id: 8,
    name: "Navigation Optimizer",
    focusKeywords: ["traffic", "route", "maps", "navigation", "waze", "gps", "drive"],
    process: (data) => `📍 [Agent 8] Resolving optimized spatial node paths for: "${data}"`
  },
  {
    id: 9,
    name: "Medical Diagnostician",
    focusKeywords: ["medical", "diagnostic", "xray", "mri", "health", "disease", "scan"],
    process: (data) => `🩺 [Agent 9] Scanning high-density pixel variations for: "${data}"`
  },
  {
    id: 10,
    name: "Computer Vision Tracker",
    focusKeywords: ["vision", "camera", "face", "defect", "see", "visual", "photo"],
    process: (data) => `👁️ [Agent 10] Executing spatial vector edge-detection loops for: "${data}"`
  },
  {
    id: 11,
    name: "Predictive Maintenance",
    focusKeywords: ["maintenance", "predictive", "engine", "sensor", "breakdown", "wear"],
    process: (data) => `⚙️ [Agent 11] Calculating component stress degradation for: "${data}"`
  }
];

// 3. The Generalist Backups Array (Agents 12 & 13)
export const generalistBackups = {
  agent12: {
    id: 12,
    name: "Generalist Alpha Backup",
    execute: (input: string) => `🌟 [Agent 12 - Generalist Alpha] Ambiguity detected. Deploying comprehensive baseline model to resolve complex reasoning: "${input}"`
  },
  agent13: {
    id: 13,
    name: "Generalist Omega Capability Presenter",
    execute: () => `📚 [Agent 13 - Generalist Omega] System Capability Overview:\nI am currently optimized to route tasks across 10 specialized frameworks: Automation, Creation, Deep Analytics, User Personalization, Translation, Security, Geolocation, Medical Scan Analysis, Machine Vision, and Predictive Maintenance.`
  }
};

// 4. 🚀 AGENT 1: THE MASTER SORTER, CONTROLLER, & OUTPUT PIPELINE
export function runAgent1Core(userInput: string): string {
  // --- INTAKE & BREAK UP PHASE ---
  const cleanedText = userInput.toLowerCase().trim();
  const tokens = cleanedText.split(/\s+/);
  
  let targetedSpecialist: SpecialistAgent | null = null;
  let dominantScore = 0;

  // --- SORTING PHASE ---
  // Agent 1 evaluates the input against specialist domains without any internal trigger words
  specialists.forEach(agent => {
    let intersectionScore = 0;
    tokens.forEach(token => {
      if (agent.focusKeywords.some(keyword => token.includes(keyword))) {
        intersectionScore++;
      }
    });

    if (intersectionScore > dominantScore) {
      dominantScore = intersectionScore;
      targetedSpecialist = agent;
    }
  });

// --- OUTPUT & MODIFICATION TRAY PHASE ---
  if (targetedSpecialist && dominantScore > 0) {
    const specialistPayload = (targetedSpecialist as any).process(userInput);
    return `⚡ [Agent 1 - Sorter Core Node Directing to Agent ${(targetedSpecialist as any).id}]\n${specialistPayload}`;
  }
  // --- FALLBACK BRAID PHASE (AGENTS 12 & 13) ---
  // If Agent 1 scores a complete blank, it intelligently checks the length of user text
  if (tokens.length > 2 && tokens[0] !== "") {
    // Treat as complex, multi-layered text -> Route to Agent 12
    return `⚡ [Agent 1 - Sorter Redirection Error] No specialist matches structural vectors.\n${generalistBackups.agent12.execute(userInput)}`;
  } else {
    // Short input or completely unresolvable -> Route to Agent 13 for a global system capability fallback layout
    return `⚡ [Agent 1 - Sorter Core Deflection]\n${generalistBackups.agent13.execute()}`;
  }
}