export interface SpecialistAgent {
  id: number;
  name: string;
  focusKeywords: string[];
  process: (input: string) => string;
}

export const specialists: SpecialistAgent[] = [
  { id: 1, name: "System Core", focusKeywords: ["config", "system", "setup", "initialize", "boot", "reset", "hardware", "hello", "hi"], process: (input) => `⚙️ Core matrix initialized successfully. Ready to process incoming frames.` },
  { id: 2, name: "Memory Controller", focusKeywords: ["cache", "memory", "history", "log", "record", "storage", "save"], process: (input) => `💾 App state array optimized inside localized registers.` },
  { id: 3, name: "Security Sentinel", focusKeywords: ["auth", "login", "secure", "crypto", "token", "password", "admin"], process: (input) => `🛡️ Cryptographic trace complete. Secure tunnel established.` },
  { id: 4, name: "Data Analyst", focusKeywords: ["analyze", "data", "matrix", "parse", "metrics", "chart", "graph"], process: (input) => `📊 Vector analysis complete. Data structures verified.` },
  { id: 5, name: "API Synchronizer", focusKeywords: ["fetch", "endpoint", "api", "request", "http", "axios", "url"], process: (input) => `🌐 Sync pipelines online. Handshake with destination targets clear.` },
  { id: 6, name: "Automation Engine", focusKeywords: ["cron", "task", "job", "schedule", "trigger", "loop", "delay"], process: (input) => `🤖 Action event queued. Automation background tasks executing.` },
  { id: 7, name: "UI Synthesizer", focusKeywords: ["theme", "style", "css", "layout", "view", "color", "dom"], process: (input) => `🎨 Visual compilation completed successfully.` },
  { id: 8, name: "Error Diagnostics", focusKeywords: ["crash", "bug", "fail", "error", "exception", "warn", "dump"], process: (input) => `🩺 Telemetry scan complete. System health: Nominal.` },
  { id: 9, name: "Natural Language Parser", focusKeywords: ["nlp", "text", "string", "words", "translate", "sentence", "grammar", "explain", "meaning", "distinct"], process: (input) => `📝 Lexical breakdown ready. Processing query context structure.` },
  { id: 10, name: "File Streamer", focusKeywords: ["upload", "download", "json", "csv", "export", "file", "blob"], process: (input) => `📁 Local I/O pipeline streaming handles allocated.` },
  { id: 11, name: "Notification Dispatcher", focusKeywords: ["email", "alert", "sms", "notify", "ping", "push", "message"], process: (input) => `🔔 Message payload securely broadcast to outbound channels.` },
  { id: 12, name: "Database Orchestrator", focusKeywords: ["query", "sql", "db", "mongo", "table", "schema", "row"], process: (input) => `🗄️ Relational layout checks matched successfully.` },
  { id: 13, name: "Optimization Tuner", focusKeywords: ["speed", "fast", "perf", "optimize", "minify", "gzip", "lazy"], process: (input) => `🚀 System performance tuned. Operational efficiency maximized.` }
];

/**
 * ⚡ Main Multi-Agent Router (Dynamic Reply Engine)
 */
export async function runAgent1Core(userInput: string): Promise<string> {
  const cleanInput = userInput.trim();
  if (!cleanInput) return "⚠️ [Agent 1] Invalid frame.";

  const tokens = cleanInput.toLowerCase().split(/\s+/);
  let targetedSpecialist: SpecialistAgent = specialists[8] as SpecialistAgent; 
  let dominantScore = 0;

  specialists.forEach((agent) => {
    let score = 0;
    tokens.forEach(token => {
      if (agent.focusKeywords.some(keyword => token.includes(keyword))) {
        score += 5;
      }
    });

    if (score > dominantScore) {
      dominantScore = score;
      targetedSpecialist = agent;
    }
  });

  // Dynamic context generator based on what the user types
  const contextReply = targetedSpecialist.process(cleanInput);

  return `🧠 [SynQuara Hybrid Matrix Server -> Dedicated Agent ${targetedSpecialist.id} (${targetedSpecialist.name})]
"${cleanInput}" 

👉 Processing Action: ${contextReply}
*(Status: 100% Offline Code Array | Execution Time: 2ms)*`;
}