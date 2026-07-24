import { ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const AVAILABLE_MODELS = [
  // --- SINGLE EXCLUSIVE CLOUD MODEL (GROQ) ---
  { id: "llama3-8b-8192", name: "Instant-NANA (Cloud)", provider: "groq", tier: "Instant", description: "Ultra-fast cloud processing core" },
  // --- LOCAL COMPUTER MODELS (Active only when machine is ON) ---
  // Core Compute Tiers
  { id: "llama3:8b", name: "Standard-NANA", provider: "local", tier: "High Demand", description: "Local foundational network" },
  { id: "llama3:70b", name: "Pro-NANA", provider: "local", tier: "High Demand", description: "Heavy local reasoning engine" },
  { id: "llama3.1:8b", name: "Advanced-NANA", provider: "local", tier: "High Demand", description: "Upgraded tools layout execution" },
  { id: "llama3.2:1b", name: "Micro-NANA", provider: "local", tier: "Instant", description: "Minimalist system pipeline footprint" },
  { id: "llama3.2:3b", name: "Lite-NANA", provider: "local", tier: "Instant", description: "Balanced lightweight text handling" },
  // Engineering & Logic Tiers
  { id: "codestral:latest", name: "Dev-NANA", provider: "local", tier: "High Demand", description: "Specialized code completion pipeline" },
  { id: "codequery:latest", name: "Architect-NANA", provider: "local", tier: "High Demand", description: "Heavy codebase synthesis structural layout" },
  { id: "qwen2.5-coder:7b", name: "Syntax-NANA", provider: "local", tier: "High Demand", description: "Optimized parsing engine" },
  { id: "deepseek-coder:6.7b", name: "Logic-NANA", provider: "local", tier: "High Demand", description: "High precision software engineering" },
  { id: "deepseek-coder:33b", name: "Deep-NANA", provider: "local", tier: "High Demand", description: "Complex algorithmic computation array" },
  // Reasoning Tiers
  { id: "mistral:7b", name: "Swift-NANA", provider: "local", tier: "High Demand", description: "High utility processing balance" },
  { id: "phi3:3.8b", name: "Mini-NANA", provider: "local", tier: "Instant", description: "Compact contextual logic matrix" },
  { id: "phi3:medium", name: "Core-NANA", provider: "local", tier: "High Demand", description: "Mid-tier local operational workspace" },
  { id: "qwen2:7b", name: "Global-NANA", provider: "local", tier: "High Demand", description: "Multi-lingual processing pipeline" },
  { id: "qwen2:72b", name: "Apex-NANA", provider: "local", tier: "High Demand", description: "Extreme computational capacity" },
  { id: "command-r:latest", name: "Search-NANA", provider: "local", tier: "High Demand", description: "Advanced search context routing" },
  { id: "command-r-plus:latest", name: "Enterprise-NANA", provider: "local", tier: "High Demand", description: "Massive agent task processing network" },
  { id: "gemma2:27b", name: "Quantum-NANA", provider: "local", tier: "High Demand", description: "Heavy open-weight logic framework" },
  { id: "codegemma:7b", name: "Script-NANA", provider: "local", tier: "High Demand", description: "Fast code helper implementation" },
  // Specialized & Multimodal Vision Tiers
  { id: "llava:latest", name: "Vision-NANA", provider: "local", tier: "Unlimited", description: "Multimodal visual structural processing" },
  { id: "bakllava:latest", name: "Sight-NANA", provider: "local", tier: "Unlimited", description: "Fast local graphic asset analysis" },
  { id: "starcoder2:15b", name: "Matrix-NANA", provider: "local", tier: "High Demand", description: "Raw multi-language token layout" },
  { id: "neural-chat:latest", name: "Synapse-NANA", provider: "local", tier: "Instant", description: "Fine-tuned conversational execution" },
  { id: "solar:10.7b", name: "Ray-NANA", provider: "local", tier: "High Demand", description: "Compact execution architecture" },
  { id: "vicuna:13b", name: "Classic-NANA", provider: "local", tier: "High Demand", description: "Standard traditional dialogue set" },
  { id: "wizardlm2:7b", name: "Spell-NANA", provider: "local", tier: "High Demand", description: "High velocity prompt optimization" },
  { id: "wizardlm2:8x22b", name: "Titan-NANA", provider: "local", tier: "High Demand", description: "Heavy mixture-of-experts logic array" },
  { id: "orca-mini:latest", name: "Pod-NANA", provider: "local", tier: "Instant", description: "Sub-dataset optimization processing" },
  { id: "tinyllama:latest", name: "Nano-NANA", provider: "local", tier: "Instant", description: "Minimal computational framework requirement" }
];
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const mdProcessor = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    }).use(markdownItKatex, {
      throwOnError: false,
      errorColor: "#ef4444",
      displayMode: true
      // Enforces clean, centered block equations
    });
    mdProcessor.renderer.rules.fence = (tokens, idx) => {
      const token = tokens[idx];
      const rawCode = token.content;
      const lang = token.info.trim() || "PlainText";
      const formattedLang = lang.toUpperCase();
      const base64Code = btoa(unescape(encodeURIComponent(rawCode)));
      const escapedCode = rawCode.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `
    <div class="my-4 rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden text-xs font-mono shadow-md">
      <div class="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800/80 text-zinc-400 select-none">
        <span class="font-bold text-yellow-400/90 text-[11px] tracking-wider">${formattedLang}</span>
        <button 
          onclick="window.copyCodeToClipboard(event, '${base64Code}')"
          class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-sans font-medium transition-all active:scale-95 cursor-pointer border border-zinc-700/50"
        >
          COPY
        </button>
      </div>
      <pre class="p-4 overflow-x-auto text-zinc-200 leading-relaxed custom-scrollbar"><code class="language-${lang}">${escapedCode}</code></pre>
    </div>
  `;
    };
    function renderMarkdownMarkup(rawText) {
      if (!rawText) return "";
      let text = String(rawText);
      const codeBlocks = [];
      text = text.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
        codeBlocks.push(match);
        return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
      });
      text = text.replace(/^(\s*)\*\*(.+?):\*\*\s*$/gm, "$1### $2");
      text = text.replace(new RegExp("(?<!\\$\\$)\\s*\\\\begin\\{(align\\*?|equation\\*?|gather\\*?|matrix|bmatrix|pmatrix|vmatrix|cases|array)\\}([\\s\\S]*?)\\\\end\\{\\1\\}\\s*(?!\\$\\$)", "g"), "\n$$\n\\begin{$1}$2\\end{$1}\n$$\n");
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, eq) => `
$$
${eq.trim()}
$$
`);
      text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, eq) => `$${eq.trim()}$`);
      text = text.replace(/%@FRAC\|/g, "\\frac");
      text = text.replace(/___CODE_BLOCK_(\d+)___/g, (_, index2) => codeBlocks[Number(index2)]);
      return mdProcessor.render(text);
    }
    const isSidebarVisible = ref(true);
    const chatHistoryList = ref([]);
    const activeSessionId = ref("");
    const messages = ref([]);
    const inputFieldPrompt = ref("");
    const selectedModelId = ref(AVAILABLE_MODELS[0]?.id || "");
    const isProcessingPipeline = ref(false);
    const activeRoutingSource = ref("");
    ref(null);
    ref(null);
    ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200 relative" }, _attrs))} data-v-c90081d4>`);
      if (isSidebarVisible.value) {
        _push(`<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity" data-v-c90081d4></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<aside class="${ssrRenderClass([
        "bg-zinc-900/95 border-r border-zinc-800/80 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-40 fixed md:relative",
        isSidebarVisible.value ? "w-64 translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full md:translate-x-0 md:w-0 opacity-0 border-r-0 pointer-events-none"
      ])}" data-v-c90081d4><div class="p-3.5 flex items-center gap-2 border-b border-zinc-800/40 shrink-0" data-v-c90081d4><button class="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-lg font-mono text-xs font-medium border border-zinc-700/60 transition-all duration-150 flex items-center justify-start gap-3 shadow-sm active:scale-[0.99]" data-v-c90081d4><span class="text-base text-yellow-400 font-bold" data-v-c90081d4>+</span><span data-v-c90081d4>New chat</span></button><button class="p-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-mono transition-all" title="Collapse Sidebar" data-v-c90081d4> ◀ </button></div><div class="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar py-2" data-v-c90081d4><div class="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest" data-v-c90081d4> Recents </div>`);
      if (chatHistoryList.value.length === 0) {
        _push(`<div class="px-3 py-4 text-xs text-zinc-600 italic font-mono" data-v-c90081d4> No chat sessions found. </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(chatHistoryList.value, (session) => {
        _push(`<div class="${ssrRenderClass([
          "group relative px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 flex items-center justify-between",
          activeSessionId.value === session.id ? "bg-zinc-800 text-yellow-400 font-semibold" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
        ])}" data-v-c90081d4><div class="flex items-center gap-2.5 truncate pr-5" data-v-c90081d4><span class="text-zinc-500 group-hover:text-yellow-400/80 transition-colors" data-v-c90081d4>💬</span><span class="truncate" data-v-c90081d4>${ssrInterpolate(session.title)}</span></div><div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100" data-v-c90081d4><button class="text-zinc-500 hover:text-yellow-400 p-1 text-[11px] transition-colors" title="Rename chat" data-v-c90081d4> ✏️ </button><button class="text-zinc-600 hover:text-red-400 p-1 text-[11px] transition-colors" title="Delete chat" data-v-c90081d4> ✕ </button></div></div>`);
      });
      _push(`<!--]--></div><div class="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between shrink-0" data-v-c90081d4><div class="flex items-center gap-2.5 truncate" data-v-c90081d4><div class="w-7 h-7 rounded-full bg-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center shadow-inner shrink-0" data-v-c90081d4> 🍌 </div><span class="text-xs font-mono font-semibold text-zinc-300 truncate" data-v-c90081d4>Andrew / BANANA</span></div><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" data-v-c90081d4></span></div></aside><main class="flex-1 flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden min-w-0" data-v-c90081d4><header class="h-14 border-b border-zinc-800/60 px-4 md:px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20 shrink-0" data-v-c90081d4><div class="flex items-center gap-3 font-mono text-[11px] truncate" data-v-c90081d4>`);
      if (!isSidebarVisible.value) {
        _push(`<button class="mr-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-yellow-400 rounded transition-all font-bold text-xs cursor-pointer" title="Expand Sidebar" data-v-c90081d4> ▶ </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="text-zinc-600 hidden sm:inline" data-v-c90081d4>PIPELINE:</span><span class="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-yellow-400 font-semibold rounded truncate max-w-[150px] sm:max-w-none" data-v-c90081d4>${ssrInterpolate(activeRoutingSource.value || "Idle Waiting State")}</span></div><div class="flex items-center gap-2 font-mono text-[11px] shrink-0" data-v-c90081d4><span class="text-zinc-500 hidden sm:inline" data-v-c90081d4>ENGINE:</span><div class="relative flex items-center" data-v-c90081d4><select class="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-yellow-500/40 cursor-pointer text-[11px] shadow-sm" data-v-c90081d4><!--[-->`);
      ssrRenderList(unref(AVAILABLE_MODELS), (model) => {
        _push(`<option${ssrRenderAttr("value", model.id)} class="bg-zinc-900 text-zinc-200" data-v-c90081d4${ssrIncludeBooleanAttr(Array.isArray(selectedModelId.value) ? ssrLooseContain(selectedModelId.value, model.id) : ssrLooseEqual(selectedModelId.value, model.id)) ? " selected" : ""}>${ssrInterpolate(model.name)}</option>`);
      });
      _push(`<!--]--></select><span class="pointer-events-none absolute right-2 text-[9px] text-zinc-500" data-v-c90081d4>▼</span></div></div></header><div class="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar bg-zinc-950 min-h-0" data-v-c90081d4>`);
      if (messages.value.length === 0) {
        _push(`<div class="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-3 pb-12" data-v-c90081d4><div class="text-4xl animate-bounce duration-1000" data-v-c90081d4>🍌</div><h1 class="text-xl font-mono font-bold tracking-tight text-yellow-400" data-v-c90081d4>BANANA Core Orchestrator</h1><p class="text-xs text-zinc-500 font-mono leading-relaxed px-4" data-v-c90081d4> Ready to receive system operational parameters. Prepend requests with <span class="text-yellow-500/80" data-v-c90081d4>/search</span> to directly trigger automated real-time web telemetry routines. </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(messages.value, (msg, index2) => {
        _push(`<div class="${ssrRenderClass([
          "max-w-3xl mx-auto flex gap-3.5 p-1 transition-all duration-150",
          msg.role === "user" ? "justify-end" : "justify-start"
        ])}" data-v-c90081d4>`);
        if (msg.role === "assistant") {
          _push(`<div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-center justify-center shrink-0 mt-0.5" data-v-c90081d4> 🍌 </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[82%] min-w-0" data-v-c90081d4><div class="font-mono text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-2" data-v-c90081d4><span data-v-c90081d4>${ssrInterpolate(msg.role === "user" ? "Client Directive" : "BANANA Intelligence response")}</span>`);
        if (msg.source) {
          _push(`<span class="text-[9px] px-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 lowercase" data-v-c90081d4> (${ssrInterpolate(msg.source)}) </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="${ssrRenderClass([
          "text-sm leading-relaxed max-w-none w-full overflow-hidden break-words",
          msg.role === "user" ? "bg-zinc-900 text-zinc-200 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tr-none whitespace-pre-wrap [word-break:break-word]" : "text-zinc-300 pt-0.5 prose prose-invert prose-zinc prose-sm max-w-none [word-break:break-word]                      prose-h1:text-xl prose-h1:font-bold prose-h1:text-yellow-400 prose-h1:font-mono prose-h1:mt-5 prose-h1:mb-3                      prose-h2:text-lg prose-h2:font-bold prose-h2:text-yellow-400/90 prose-h2:font-mono prose-h2:mt-4 prose-h2:mb-2                      prose-h3:text-base prose-h3:font-semibold prose-h3:text-zinc-100 prose-h3:font-mono prose-h3:mt-3 prose-h3:mb-1.5                      prose-table:border prose-table:border-zinc-800 prose-th:bg-zinc-900 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-zinc-800                      prose-code:text-yellow-500 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded                      prose-blockquote:border-l-2 prose-blockquote:border-yellow-500 prose-blockquote:pl-4 prose-blockquote:italic"
        ])}" data-v-c90081d4>`);
        if (msg.role === "user") {
          _push(`<div data-v-c90081d4>${ssrInterpolate(msg.content)}</div>`);
        } else {
          _push(`<div data-v-c90081d4>${renderMarkdownMarkup(msg.content) ?? ""}</div>`);
        }
        _push(`</div>`);
        if (msg.role === "assistant") {
          _push(`<div class="flex items-center gap-3 pt-0.5 px-1 font-mono text-[10px] text-zinc-500 select-none" data-v-c90081d4><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Copy response content" data-v-c90081d4><span data-v-c90081d4>📋</span> Copy </button><span class="text-zinc-800" data-v-c90081d4>•</span><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Regenerate message" data-v-c90081d4><span data-v-c90081d4>🔄</span> Regenerate </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]-->`);
      if (isProcessingPipeline.value) {
        _push(`<div class="max-w-3xl mx-auto flex gap-3.5 p-1" data-v-c90081d4><div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-dashed border-yellow-500/40 flex items-center justify-center shrink-0 animate-spin text-[10px]" data-v-c90081d4> ⏳ </div><div class="text-xs text-zinc-500 font-mono italic flex items-center gap-2 animate-pulse pt-0.5" data-v-c90081d4> Analysing... </div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div> <footer class="p-3 md:p-4 border-t border-zinc-900/80 bg-zinc-950 shrink-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]" data-v-c90081d4><form class="max-w-3xl mx-auto relative flex flex-col bg-zinc-900 border border-zinc-800 focus-within:border-yellow-500/40 rounded-2xl p-1.5 transition-all shadow-lg" data-v-c90081d4><div class="flex items-center justify-between px-3 pt-1 text-[10px] font-mono text-zinc-500 select-none" data-v-c90081d4><span class="flex items-center gap-1.5" data-v-c90081d4><span class="${ssrRenderClass([isProcessingPipeline.value ? "bg-yellow-400 animate-ping" : "bg-emerald-500", "w-1.5 h-1.5 rounded-full"])}" data-v-c90081d4></span><span data-v-c90081d4>Model Routing: <strong class="text-zinc-400" data-v-c90081d4>${ssrInterpolate(selectedModelId.value || "Default Core")}</strong></span></span>`);
      if (activeRoutingSource.value) {
        _push(`<span class="hidden sm:inline text-zinc-600 truncate max-w-[200px]" data-v-c90081d4>${ssrInterpolate(activeRoutingSource.value)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-end mt-1" data-v-c90081d4><textarea rows="1" placeholder="Ask BANANA AI anything... (Shift + Enter for new line)" class="w-full bg-transparent text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none resize-none px-3 py-2 custom-scrollbar max-h-48 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap [word-break:break-word]" data-v-c90081d4>${ssrInterpolate(inputFieldPrompt.value)}</textarea>`);
      if (isProcessingPipeline.value) {
        _push(`<button type="button" class="ml-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white font-mono font-bold rounded-xl text-xs tracking-wider transition-all shrink-0 mb-0.5 animate-pulse cursor-pointer" data-v-c90081d4> STOP </button>`);
      } else {
        _push(`<button type="submit"${ssrIncludeBooleanAttr(!inputFieldPrompt.value.trim()) ? " disabled" : ""} class="ml-2 px-4 py-2 bg-yellow-500 text-zinc-950 font-mono font-bold rounded-xl text-xs tracking-wider hover:bg-yellow-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5 cursor-pointer" data-v-c90081d4> Send </button>`);
      }
      _push(`</div></form></footer></main></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c90081d4"]]);

export { index as default };
//# sourceMappingURL=index-Dp9wdkFS.mjs.map
