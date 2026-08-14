import { ref, withAsyncContext, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrGetDirectiveProps, ssrGetDynamicModelProps, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const AVAILABLE_MODELS = [
  // --- LOCAL COMPUTER MODELS (Free, Unlimited) ---
  {
    id: "qwen-super",
    name: "Qwen Super Engine",
    provider: "local",
    tier: "High Demand",
    description: "Primary custom local logic and coding engine."
  },
  {
    id: "llava:latest",
    name: "Vision-NANA",
    provider: "local",
    tier: "Unlimited",
    description: "Local multimodal visual structural processing."
  },
  // --- CLOUD FALLBACK MODEL (Groq API) ---
  {
    id: "llama-3.1-8b-instant",
    name: "Instant-NANA (Cloud)",
    provider: "groq",
    tier: "Instant",
    description: "Ultra-fast cloud processing core (used if local is offline)."
  }
];
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const isSourcePanelOpen = ref(false);
    const activeSource = ref(null);
    ref(false);
    const isRecording = ref(false);
    ref(null);
    const mdProcessor = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    }).use(markdownItKatex, {
      throwOnError: false,
      errorColor: "#ef4444",
      displayMode: true,
      macros: {
        // Quantum Bra-Ket Notation
        "\\ket": "\\left|#1\\right\\rangle",
        "\\bra": "\\left\\langle#1\\right|",
        "\\braket": "\\left\\langle#1\\middle|#2\\right\\rangle",
        "\\ketbra": "\\left|#1\\right\\rangle\\!\\left\\langle#2\\right|",
        // Set & Field Shortcuts
        "\\R": "\\mathbb{R}",
        "\\C": "\\mathbb{C}",
        "\\N": "\\mathbb{N}",
        "\\Z": "\\mathbb{Z}"
      }
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
      if (rawText === null || rawText === void 0) {
        return "";
      }
      let text = String(rawText);
      if (!text.trim()) {
        return "";
      }
      text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const codeBlocks = [];
      function stashCodeBlock(match) {
        const placeholder = `___BANANA_CODE_BLOCK_STASH_${codeBlocks.length}___`;
        codeBlocks.push(match);
        return placeholder;
      }
      text = text.replace(/```[\s\S]*?```/g, stashCodeBlock);
      text = text.replace(/~~~[\s\S]*?~~~/g, stashCodeBlock);
      text = text.replace(/`[^`\n]+`/g, stashCodeBlock);
      text = text.replace(/%@FRAC\|/g, "\\frac");
      text = text.replace(/%@FRAC/g, "\\frac");
      text = text.replace(/\$(\d+(?:\.\d{1,2})?)\b/g, "\\$$1");
      text = text.replace(/\\\\(begin|end|frac|sqrt|ket|bra|vert|rangle|langle|pmatrix|bmatrix|vmatrix|cases|array|align|equation|text|mathrm|mathbf|sum|prod|int|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|rho|sigma|tau|phi|psi|omega)/g, "\\$1");
      text = text.replace(/\\ket\s*\{([^}]+)\}/g, "| $1 \\rangle");
      text = text.replace(/\\bra\s*\{([^}]+)\}/g, "\\langle $1 |");
      text = text.replace(/\|00\\rangle/g, "\\vert 00 \\rangle");
      text = text.replace(/\|01\\rangle/g, "\\vert 01 \\rangle");
      text = text.replace(/\|10\\rangle/g, "\\vert 10 \\rangle");
      text = text.replace(/\|11\\rangle/g, "\\vert 11 \\rangle");
      text = text.replace(/^(\s*)\*\*(Part\s+\d+[^:\n]*):\*\*\s*$/gm, "$1### $2");
      text = text.replace(/^(\s*)\*\*(Section\s+\d+[^:\n]*):\*\*\s*$/gm, "$1### $2");
      text = text.replace(/^(\s*)\*\*(Step\s+\d+[^:\n]*):\*\*\s*$/gm, "$1### $2");
      text = text.replace(/^(\s*)\*\*([A-Z0-9\s_\-]{3,40}):\*\*\s*$/gm, "$1### $2");
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, eq) => `
$$
${eq.trim()}
$$
`);
      text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, eq) => `$${eq.trim()}$`);
      text = text.replace(
        /(\\[A-Za-z]+(?:\\[A-Za-z]+)*\s*=\s*[^$\n]+?)\s*\$\s*(\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|cases)\}[\s\S]*?\\end\{(?:pmatrix|bmatrix|vmatrix|matrix|cases)\})/g,
        "\n$$\n$1 $2\n$$\n"
      );
      const supportedEnvs = [
        "matrix",
        "pmatrix",
        "bmatrix",
        "vmatrix",
        "Vmatrix",
        "cases",
        "align",
        "align\\*",
        "equation",
        "equation\\*",
        "gather",
        "gather\\*",
        "array",
        "split",
        "subarray"
      ].join("|");
      const envRegex = new RegExp(`(?<!\\$\\$)\\s*\\\\begin\\{(${supportedEnvs})\\}([\\s\\S]*?)\\\\end\\{\\1\\}\\s*(?!\\$\\$)`, "g");
      text = text.replace(envRegex, (_m, envType, envBody) => `
$$
\\begin{${envType}}
${envBody.trim()}
\\end{${envType}}
$$
`);
      const nakedVectorRegex = new RegExp("(?<!\\$)\\b(\\\\(?:Psi|phi|psi|theta|chi|omega)\\s*(?:\\\\rangle|\\|)?\\s*=\\s*(?:\\\\frac\\{[^{}]+\\}\\{[^{}]+\\}|\\d+)?\\s*\\\\begin\\{(?:pmatrix|bmatrix|vmatrix|matrix)\\}[\\s\\S]*?\\\\end\\{(?:pmatrix|bmatrix|vmatrix|matrix)\\})(?!\\$)", "g");
      text = text.replace(nakedVectorRegex, (_m, vExpr) => `
$$
${vExpr.trim()}
$$
`);
      text = text.replace(new RegExp("(?<!\\$)\\\\frac\\{([^{}]+)\\}\\{([^{}]+)\\}(?!\\$)", "g"), "$\\frac{$1}{$2}$");
      text = text.replace(
        new RegExp("(?<!\\$)\\((?:\\\\vert|\\\\rangle|\\\\langle|\\|)\\s*[\\d\\w]+\\s*(?:\\\\rangle|\\|)\\s*[\\+\\-]\\s*(?:\\\\vert|\\\\rangle|\\\\langle|\\|)\\s*[\\d\\w]+\\s*(?:\\\\rangle|\\|)\\)(?!\\$)", "g"),
        "$$&$$"
      );
      function sanitizeMarkdownTables(content) {
        const lines = content.split("\n");
        const processedLines = [];
        let inTable = false;
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          const isPipeLine = /^\s*\|.*\|\s*$/.test(line);
          const isHeaderSeparator = /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line);
          if (isPipeLine || isHeaderSeparator) {
            if (!inTable) {
              inTable = true;
              if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== "") {
                processedLines.push("");
              }
            }
            processedLines.push(line.trim());
          } else {
            if (inTable) {
              inTable = false;
              if (line.trim() !== "") {
                processedLines.push("");
              }
            }
            processedLines.push(line);
          }
        }
        return processedLines.join("\n");
      }
      text = sanitizeMarkdownTables(text);
      text = text.replace(/\${3,}/g, "$$");
      text = text.replace(/\$\$\s*\n+/g, "$$\n");
      text = text.replace(/\n+\s*\$\$/g, "\n$$");
      text = text.replace(/([^\n])\$\$/g, "$1\n$$");
      text = text.replace(/\$\$([^\n])/g, "$$\n$1");
      text = text.replace(/___BANANA_CODE_BLOCK_STASH_(\d+)___/g, (_match, index2) => {
        const blockIndex = Number(index2);
        return codeBlocks[blockIndex] !== void 0 ? codeBlocks[blockIndex] : "";
      });
      try {
        return mdProcessor.render(text);
      } catch (renderError) {
        console.error("KaTeX/Markdown Rendering Error:", renderError);
        const safeEscapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<div class="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-200 font-mono text-xs whitespace-pre-wrap">${safeEscapedText}</div>`;
      }
    }
    const isSidebarVisible = ref(true);
    const chatHistoryList = ref([]);
    const activeSessionId = ref("");
    const messages = ref([]);
    [__temp, __restore] = withAsyncContext(() => $fetch("/api/chat", {
      method: "POST",
      body: {
        messages: messages.value,
        currentTimestamp: (/* @__PURE__ */ new Date()).toLocaleString()
      }
    })), __temp = await __temp, __restore();
    const inputFieldPrompt = ref("");
    const selectedModelId = ref(((_a = AVAILABLE_MODELS[0]) == null ? void 0 : _a.id) || "");
    const isProcessingPipeline = ref(false);
    const activeRoutingSource = ref("");
    ref(null);
    ref(null);
    ref(false);
    ref(null);
    ref(null);
    const isEditingTitle = ref(false);
    const editableTitleText = ref("");
    const vFocus = {
      mounted: (el) => el.focus()
    };
    const currentSessionTitle = computed(() => {
      if (!activeSessionId.value) return null;
      const activeSession = chatHistoryList.value.find((s) => s.id === activeSessionId.value);
      return activeSession ? activeSession.title : null;
    });
    const selectedFiles = ref([]);
    return (_ctx, _push, _parent, _attrs) => {
      let _temp0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200 relative" }, _attrs))} data-v-bb692f54>`);
      if (isSourcePanelOpen.value) {
        _push(`<div class="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 p-4 flex flex-col transition-all duration-300" data-v-bb692f54><div class="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4" data-v-bb692f54><div class="flex items-center gap-2" data-v-bb692f54><i class="i-lucide-book-open text-yellow-400" data-v-bb692f54></i><h3 class="font-bold text-zinc-100 text-sm" data-v-bb692f54>Reference Source Context</h3></div><button class="text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer" data-v-bb692f54>\u2715</button></div>`);
        if (activeSource.value) {
          _push(`<div class="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1" data-v-bb692f54><div data-v-bb692f54><span class="text-xs text-yellow-500 font-mono font-semibold" data-v-bb692f54>SOURCE [${ssrInterpolate(activeSource.value.id)}]</span><h4 class="text-base font-semibold text-zinc-100 mt-1" data-v-bb692f54>${ssrInterpolate(activeSource.value.title)}</h4><a${ssrRenderAttr("href", activeSource.value.url)} target="_blank" class="text-xs text-yellow-400 hover:underline flex items-center gap-1 mt-1 break-all" data-v-bb692f54><i class="i-lucide-external-link text-xs" data-v-bb692f54></i> ${ssrInterpolate(activeSource.value.url)}</a></div><div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80" data-v-bb692f54><span class="text-[10px] text-zinc-500 uppercase tracking-wider font-mono" data-v-bb692f54>Extracted Ground-Truth Context</span><p class="text-xs text-zinc-300 mt-2 leading-relaxed font-sans whitespace-pre-wrap" data-v-bb692f54> &quot;${ssrInterpolate(activeSource.value.snippet)}&quot; </p></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (isSidebarVisible.value) {
        _push(`<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity" data-v-bb692f54></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<aside class="${ssrRenderClass([
        "bg-zinc-900/95 border-r border-zinc-800/80 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-40 fixed md:relative",
        isSidebarVisible.value ? "w-64 translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full md:translate-x-0 md:w-0 opacity-0 border-r-0 pointer-events-none"
      ])}" data-v-bb692f54><div class="p-3.5 flex items-center gap-2 border-b border-zinc-800/40 shrink-0" data-v-bb692f54><button class="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-lg font-mono text-xs font-medium border border-zinc-700/60 transition-all duration-150 flex items-center justify-start gap-3 shadow-sm active:scale-[0.99]" data-v-bb692f54><span class="text-base text-yellow-400 font-bold" data-v-bb692f54>+</span><span data-v-bb692f54>New chat</span></button><button class="p-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-mono transition-all" title="Collapse Sidebar" data-v-bb692f54> \u25C0 </button></div><div class="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar py-2" data-v-bb692f54><div class="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest" data-v-bb692f54> Recents </div>`);
      if (chatHistoryList.value.length === 0) {
        _push(`<div class="px-3 py-4 text-xs text-zinc-600 italic font-mono" data-v-bb692f54> No chat sessions found. </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(chatHistoryList.value, (session) => {
        _push(`<div class="${ssrRenderClass([
          "group relative px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 flex items-center justify-between",
          activeSessionId.value === session.id ? "bg-zinc-800 text-yellow-400 font-semibold" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
        ])}" data-v-bb692f54><div class="flex items-center gap-2.5 truncate pr-2 min-w-0" data-v-bb692f54><i class="i-lucide-message-square text-xs shrink-0 text-zinc-500 group-hover:text-yellow-400/80 transition-colors" data-v-bb692f54></i><span class="truncate" data-v-bb692f54>${ssrInterpolate(session.title || "Untitled Chat")}</span></div><div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0" data-v-bb692f54><button class="text-zinc-400 hover:text-yellow-400 p-1.5 transition-colors flex items-center rounded hover:bg-zinc-700/50" title="Rename chat" data-v-bb692f54> \u270F\uFE0F <i class="i-lucide-pencil text-[12px]" data-v-bb692f54></i></button><button class="text-zinc-400 hover:text-red-400 p-1.5 transition-colors flex items-center rounded hover:bg-zinc-700/50" title="Delete chat" data-v-bb692f54> \u{1F5D1}\uFE0F <i class="i-lucide-trash-2 text-[12px]" data-v-bb692f54></i></button></div></div>`);
      });
      _push(`<!--]--></div><div class="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between shrink-0" data-v-bb692f54><div class="flex items-center gap-2.5 truncate" data-v-bb692f54><div class="w-7 h-7 rounded-full bg-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center shadow-inner shrink-0" data-v-bb692f54> \u{1F34C} </div><span class="text-xs font-mono font-semibold text-zinc-300 truncate" data-v-bb692f54>Andrew / BANANA</span></div><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" data-v-bb692f54></span></div></aside><main class="flex-1 flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden min-w-0" data-v-bb692f54><header class="h-14 border-b border-zinc-800/60 px-4 md:px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20 shrink-0 relative" data-v-bb692f54><div class="flex items-center gap-3 font-mono text-[11px] shrink-0 z-10" data-v-bb692f54>`);
      if (!isSidebarVisible.value) {
        _push(`<button class="mr-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-yellow-400 rounded transition-all font-bold text-xs cursor-pointer" title="Expand Sidebar" data-v-bb692f54> \u25B6 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/90 rounded-full px-2.5 py-1 shadow-inner shrink-0" data-v-bb692f54><span class="relative flex h-2 w-2" data-v-bb692f54>`);
      if (isProcessingPipeline.value) {
        _push(`<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" data-v-bb692f54></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="${ssrRenderClass([
        "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
        isProcessingPipeline.value ? "bg-yellow-400" : "bg-emerald-500"
      ])}" data-v-bb692f54></span></span><span class="text-zinc-300 font-medium text-[11px] truncate hidden sm:inline" data-v-bb692f54>${ssrInterpolate(isProcessingPipeline.value ? "Thinking..." : activeRoutingSource.value || "Ready")}</span></div></div><div class="flex-1 flex justify-center items-center px-2 min-w-0 z-10" data-v-bb692f54>`);
      if (isEditingTitle.value) {
        _push(`<input${ssrRenderAttrs((_temp0 = mergeProps({
          value: editableTitleText.value,
          type: "text",
          class: "bg-zinc-900 border border-yellow-500/50 text-yellow-400 font-mono text-xs font-semibold px-2 py-0.5 rounded text-center focus:outline-none focus:ring-1 focus:ring-yellow-400 w-full max-w-[180px] sm:max-w-[320px] shadow-inner"
        }, ssrGetDirectiveProps(_ctx, vFocus)), mergeProps(_temp0, ssrGetDynamicModelProps(_temp0, editableTitleText.value))))} data-v-bb692f54>`);
      } else {
        _push(`<div class="flex items-center gap-1.5 cursor-pointer group" title="Click or tap to rename" data-v-bb692f54><h1 class="text-xs font-bold font-mono text-yellow-400 text-center truncate whitespace-nowrap max-w-[180px] sm:max-w-[320px] group-hover:text-yellow-300 transition-colors select-none" data-v-bb692f54>${ssrInterpolate(currentSessionTitle.value || "BANANA AI")}</h1>`);
        if (activeSessionId.value) {
          _push(`<i class="i-lucide-pencil text-[10px] text-zinc-500 group-hover:text-yellow-400" data-v-bb692f54></i>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div><div class="flex items-center gap-2 font-mono text-[11px] shrink-0 z-10" data-v-bb692f54><span class="text-zinc-500 hidden sm:inline" data-v-bb692f54>Model:</span><div class="relative flex items-center" data-v-bb692f54><select class="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-yellow-500/40 cursor-pointer text-[11px] shadow-sm" data-v-bb692f54><!--[-->`);
      ssrRenderList(unref(AVAILABLE_MODELS), (model) => {
        _push(`<option${ssrRenderAttr("value", model.id)} class="bg-zinc-900 text-zinc-200" data-v-bb692f54${ssrIncludeBooleanAttr(Array.isArray(selectedModelId.value) ? ssrLooseContain(selectedModelId.value, model.id) : ssrLooseEqual(selectedModelId.value, model.id)) ? " selected" : ""}>${ssrInterpolate(model.name)}</option>`);
      });
      _push(`<!--]--></select><span class="pointer-events-none absolute right-2 text-[9px] text-zinc-500" data-v-bb692f54>\u25BC</span></div></div></header><div class="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar bg-zinc-950 min-h-0" data-v-bb692f54>`);
      if (messages.value.length === 0) {
        _push(`<div class="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-3 pb-12" data-v-bb692f54><div class="text-4xl animate-bounce duration-1000" data-v-bb692f54>\u{1F34C}</div><h1 class="text-xl font-mono font-bold tracking-tight text-yellow-400" data-v-bb692f54>Ready when you are!</h1></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(messages.value, (msg, index2) => {
        var _a2;
        _push(`<div class="${ssrRenderClass([
          "group max-w-3xl mx-auto flex gap-3.5 p-1 transition-all duration-150",
          msg.role === "user" ? "justify-end" : "justify-start"
        ])}" data-v-bb692f54>`);
        if (msg.role === "assistant") {
          _push(`<div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-center justify-center shrink-0 mt-0.5 text-yellow-400" data-v-bb692f54><i class="i-lucide-bot text-xs" data-v-bb692f54></i></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[82%] min-w-0" data-v-bb692f54><div class="${ssrRenderClass(["font-mono text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-2", msg.role === "user" ? "justify-end" : "justify-start"])}" data-v-bb692f54><span data-v-bb692f54>${ssrInterpolate(msg.role === "user" ? "Client Directive" : "Banana")}</span>`);
        if (msg.source) {
          _push(`<span class="text-[9px] px-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 lowercase" data-v-bb692f54> (${ssrInterpolate(msg.source)}) </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="${ssrRenderClass([
          "text-sm leading-relaxed max-w-none w-full overflow-hidden break-words",
          msg.role === "user" ? "bg-zinc-900 text-zinc-200 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tr-none whitespace-pre-wrap [word-break:break-word]" : "text-zinc-300 pt-0.5 prose prose-invert prose-zinc prose-sm max-w-none [word-break:break-word]                      prose-h1:text-xl prose-h1:font-bold prose-h1:text-yellow-400 prose-h1:font-mono prose-h1:mt-5 prose-h1:mb-3                      prose-h2:text-lg prose-h2:font-bold prose-h2:text-yellow-400/90 prose-h2:font-mono prose-h2:mt-4 prose-h2:mb-2                      prose-h3:text-base prose-h3:font-semibold prose-h3:text-zinc-100 prose-h3:font-mono prose-h3:mt-3 prose-h3:mb-1.5                      prose-table:border prose-table:border-zinc-800 prose-th:bg-zinc-900 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-zinc-800                      prose-code:text-yellow-500 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded                      prose-blockquote:border-l-2 prose-blockquote:border-yellow-500 prose-blockquote:pl-4 prose-blockquote:italic"
        ])}" data-v-bb692f54>`);
        if (msg.role === "user") {
          _push(`<div data-v-bb692f54>${ssrInterpolate(msg.content)}</div>`);
        } else {
          _push(`<div data-v-bb692f54>${(_a2 = renderMarkdownMarkup(msg.content)) != null ? _a2 : ""}</div>`);
        }
        _push(`</div>`);
        if (msg.content && (!isProcessingPipeline.value || index2 !== messages.value.length - 1)) {
          _push(`<div class="${ssrRenderClass([
            "flex items-center gap-3 pt-0.5 px-1 font-mono text-[10px] text-zinc-500 select-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200",
            msg.role === "user" ? "justify-end" : "justify-start"
          ])}" data-v-bb692f54><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Copy text" data-v-bb692f54><i class="i-lucide-copy text-xs" data-v-bb692f54></i><span data-v-bb692f54>Copy</span></button>`);
          if (msg.role === "user" && index2 >= messages.value.length - 2) {
            _push(`<!--[--><span class="text-zinc-800" data-v-bb692f54>\u2022</span><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Edit prompt" data-v-bb692f54><i class="i-lucide-pencil text-xs" data-v-bb692f54></i><span data-v-bb692f54>Edit</span></button><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (msg.role === "assistant" && index2 === messages.value.length - 1) {
            _push(`<!--[--><span class="text-zinc-800" data-v-bb692f54>\u2022</span><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Regenerate response" data-v-bb692f54><i class="i-lucide-rotate-cw text-xs" data-v-bb692f54></i><span data-v-bb692f54>Regenerate</span></button><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (msg.role === "assistant") {
            _push(`<!--[--><span class="text-zinc-800" data-v-bb692f54>\u2022</span><button class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer" title="Read aloud" data-v-bb692f54><i class="i-lucide-volume-2 text-xs" data-v-bb692f54></i><span data-v-bb692f54>Speak</span></button><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (msg.sources && msg.sources.length > 0) {
          _push(`<div class="mt-4 pt-3 border-t border-zinc-800/80" data-v-bb692f54><div class="text-[11px] font-medium text-zinc-400 tracking-wider uppercase mb-2 flex items-center gap-1.5" data-v-bb692f54><svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-bb692f54><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" data-v-bb692f54></path></svg> Sources &amp; References </div><div class="flex flex-wrap gap-2" data-v-bb692f54><!--[-->`);
          ssrRenderList(msg.sources, (source, sIndex) => {
            _push(`<a${ssrRenderAttr("href", source.url)} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2.5 px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-amber-500/40 rounded-xl text-xs text-zinc-300 transition-all duration-200 max-w-[280px] group shadow-md hover:shadow-amber-500/5 relative overflow-hidden" data-v-bb692f54><div class="w-5 h-5 rounded-lg bg-zinc-800/90 group-hover:bg-amber-500/10 flex items-center justify-center shrink-0 border border-zinc-700/60 group-hover:border-amber-500/30 text-[10px] text-amber-400 font-mono transition-colors" data-v-bb692f54>${ssrInterpolate(sIndex + 1)}</div><div class="flex flex-col min-w-0 flex-1" data-v-bb692f54><span class="truncate font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors" data-v-bb692f54>${ssrInterpolate(source.title || "Source Reference")}</span><span class="text-[10px] text-zinc-500 group-hover:text-zinc-400 truncate font-mono" data-v-bb692f54>${ssrInterpolate(source.url ? source.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "external link")}</span></div><svg class="w-3 h-3 text-zinc-600 group-hover:text-amber-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-bb692f54><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-bb692f54></path></svg></a>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]-->`);
      if (isProcessingPipeline.value) {
        _push(`<div class="max-w-3xl mx-auto flex gap-3.5 p-1" data-v-bb692f54><div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-dashed border-yellow-500/40 flex items-center justify-center shrink-0 animate-spin text-[10px]" data-v-bb692f54> \u{1F34C} </div><div class="text-xs text-zinc-500 font-mono italic flex items-center gap-2 animate-pulse pt-0.5" data-v-bb692f54> Analysing... </div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><footer class="p-3 md:p-4 border-t border-zinc-900/80 bg-zinc-950 shrink-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]" data-v-bb692f54><form class="max-w-3xl mx-auto relative flex items-end bg-zinc-900 border border-zinc-800 focus-within:border-yellow-500/40 rounded-2xl p-2 transition-all shadow-lg" data-v-bb692f54><input type="file" class="hidden" accept="image/*,.pdf,.txt,.js,.ts,.vue,.json,.exe,.py,.java,.c,.cpp,.md,.csv,.docx,.xlsx,.pptx,.zip,.rar,.7z,.tar,.gz,.mp3,.wav,.mp4,.avi,.mkv,.mov,.flv,.wmv,.webm,.ogg,.flac,.aac,.m4a,.opus,.epub,.azw3,.fb2,.djvu,.odt,.rtf,.tex,.psd,.ai,.eps,.svg, .ttf,.otf,.woff,.woff2,.csv,.tsv,.ics,.vcf,.sql,.db,.bak,.log,.ini,.conf,.cfg,.yml,.yaml,.toml,.mdx,.rst,.ipynb,.r,.sas,.stata,.spss,.dta,.sav,.m,.mlx,.jl,.nim,.cr,.vhd,.verilog,.hdl,.asm,.s,.bas,.lisp,.clj,.cljs,.edn,.scm, .rkt, .ml, .mli, .fs, .fsi" data-v-bb692f54><button type="button" class="p-2.5 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center justify-center" title="Attach file or image" data-v-bb692f54> \u{1F517} <i class="i-lucide-paperclip text-base" data-v-bb692f54></i></button><button type="button" class="${ssrRenderClass([
        "p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center cursor-pointer",
        isRecording.value ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400"
      ])}"${ssrRenderAttr("title", isRecording.value ? "Listening... Click to stop" : "Click to speak")} data-v-bb692f54> \u{1F399}\uFE0F <i class="i-lucide-mic text-base" data-v-bb692f54></i></button><!--[-->`);
      ssrRenderList(selectedFiles.value, (file, fIndex) => {
        _push(`<div class="flex items-center gap-1.5 text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1.5 rounded-lg border border-yellow-500/20 mb-1 shrink-0 mr-2 font-mono" data-v-bb692f54><i class="i-lucide-file-text text-xs shrink-0" data-v-bb692f54></i><span class="truncate max-w-[120px]" data-v-bb692f54>${ssrInterpolate(file.name)}</span><button type="button" class="hover:text-red-400 ml-1 font-bold cursor-pointer" data-v-bb692f54>\u2715</button></div>`);
      });
      _push(`<!--]--><textarea rows="1" placeholder="Ask Banana AI anything..." class="w-full bg-transparent text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none resize-none px-3 py-2.5 custom-scrollbar max-h-48 overflow-y-auto font-sans leading-relaxed" data-v-bb692f54>${ssrInterpolate(inputFieldPrompt.value)}</textarea>`);
      if (isProcessingPipeline.value) {
        _push(`<button type="button" class="ml-2 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white font-mono font-bold rounded-xl text-xs tracking-wider transition-all shrink-0 mb-0.5 animate-pulse cursor-pointer flex items-center justify-center" data-v-bb692f54> STOP </button>`);
      } else {
        _push(`<button type="submit"${ssrIncludeBooleanAttr(!inputFieldPrompt.value.trim() && selectedFiles.value.length === 0) ? " disabled" : ""} class="ml-2 px-4 py-2.5 bg-yellow-500 text-zinc-950 font-mono font-bold rounded-xl text-xs tracking-wider hover:bg-yellow-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5 cursor-pointer flex items-center justify-center shadow-md" data-v-bb692f54> Send </button>`);
      }
      _push(`</form></footer></main></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bb692f54"]]);

export { index as default };
//# sourceMappingURL=index-qgEo_LpG.mjs.map
