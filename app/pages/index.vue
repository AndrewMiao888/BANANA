<template>
  <div class="flex h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-yellow-500/30 selection:text-yellow-200 relative">
    <div 
      v-if="isSidebarVisible" 
      @click="isSidebarVisible = false"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
    ></div>

    <aside 
      :class="[
        'bg-zinc-900/95 border-r border-zinc-800/80 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-40 fixed md:relative',
        isSidebarVisible 
          ? 'w-64 translate-x-0 opacity-100 pointer-events-auto' 
          : '-translate-x-full md:translate-x-0 md:w-0 opacity-0 border-r-0 pointer-events-none'
      ]"
    >
      <div class="p-3.5 flex items-center gap-2 border-b border-zinc-800/40 shrink-0">
        <button 
          @click="startNewChatSession"
          class="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-lg font-mono text-xs font-medium border border-zinc-700/60 transition-all duration-150 flex items-center justify-start gap-3 shadow-sm active:scale-[0.99]"
        >
          <span class="text-base text-yellow-400 font-bold">+</span>
          <span>New chat</span>
        </button>
        <button 
          @click="isSidebarVisible = false"
          class="p-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-lg text-xs font-mono transition-all"
          title="Collapse Sidebar"
        >
          ◀
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar py-2">
        <div class="px-3 py-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          Recents
        </div>

        <div v-if="chatHistoryList.length === 0" class="px-3 py-4 text-xs text-zinc-600 italic font-mono">
          No chat sessions found.
        </div>
        
        <div 
          v-for="session in chatHistoryList" 
          :key="session.id"
          @click="switchActiveSession(session.id)"
          :class="[
            'group relative px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 flex items-center justify-between',
            activeSessionId === session.id 
              ? 'bg-zinc-800 text-yellow-400 font-semibold' 
              : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
          ]"
        >
          <div class="flex items-center gap-2.5 truncate pr-2 min-w-0">
            <i class="i-lucide-message-square text-xs shrink-0 text-zinc-500 group-hover:text-yellow-400/80 transition-colors"></i>
            <span class="truncate">{{ session.title || 'Untitled Chat' }}</span>
          </div>

          <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
            <button 
              @click.stop="renameSession(session.id)"
              class="text-zinc-400 hover:text-yellow-400 p-1.5 transition-colors flex items-center rounded hover:bg-zinc-700/50"
              title="Rename chat"
            >
              <i class="i-lucide-pencil text-[12px]"></i>
            </button>
            <button 
              @click.stop="purgeSession(session.id)"
              class="text-zinc-400 hover:text-red-400 p-1.5 transition-colors flex items-center rounded hover:bg-zinc-700/50"
              title="Delete chat"
            >
              <i class="i-lucide-trash-2 text-[12px]"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5 truncate">
          <div class="w-7 h-7 rounded-full bg-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
            🍌
          </div>
          <span class="text-xs font-mono font-semibold text-zinc-300 truncate">Andrew / BANANA</span>
        </div>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden min-w-0">
      
      <header class="h-14 border-b border-zinc-800/60 px-4 md:px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20 shrink-0 relative">
        
        <div class="flex items-center gap-3 font-mono text-[11px] shrink-0 z-10">
          <button 
            v-if="!isSidebarVisible"
            @click.stop="isSidebarVisible = true"
            class="mr-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-yellow-400 rounded transition-all font-bold text-xs cursor-pointer"
            title="Expand Sidebar"
          >
            ▶
          </button>

          <div class="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/90 rounded-full px-2.5 py-1 shadow-inner shrink-0">
            <span class="relative flex h-2 w-2">
              <span 
                v-if="isProcessingPipeline" 
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"
              ></span>
              <span 
                :class="[
                  'relative inline-flex rounded-full h-2 w-2 transition-colors duration-300',
                  isProcessingPipeline ? 'bg-yellow-400' : 'bg-emerald-500'
                ]"
              ></span>
            </span>
            <span class="text-zinc-300 font-medium text-[11px] truncate hidden sm:inline">
              {{ isProcessingPipeline ? 'Thinking...' : (activeRoutingSource || 'Ready') }}
            </span>
          </div>
        </div>

        <div class="flex-1 flex justify-center items-center px-2 min-w-0 z-10">
          <template v-if="isEditingTitle">
            <input 
              v-model="editableTitleText" 
              @blur="saveEditedTitle" 
              @keyup.enter="saveEditedTitle" 
              @keyup.escape="isEditingTitle = false"
              v-focus
              type="text" 
              class="bg-zinc-900 border border-yellow-500/50 text-yellow-400 font-mono text-xs font-semibold px-2 py-0.5 rounded text-center focus:outline-none focus:ring-1 focus:ring-yellow-400 w-full max-w-[180px] sm:max-w-[320px] shadow-inner"
            />
          </template>
          <template v-else>
            <div 
              @click="handleTitleClick"
              @dblclick="handleTitleClick"
              class="flex items-center gap-1.5 cursor-pointer group"
              title="Click or tap to rename"
            >
              <h1 class="text-xs font-bold font-mono text-yellow-400 text-center truncate whitespace-nowrap max-w-[180px] sm:max-w-[320px] group-hover:text-yellow-300 transition-colors select-none">
                {{ currentSessionTitle || 'BANANA AI' }}
              </h1>
              <i v-if="activeSessionId" class="i-lucide-pencil text-[10px] text-zinc-500 group-hover:text-yellow-400"></i>
            </div>
          </template>
        </div>

        <div class="flex items-center gap-2 font-mono text-[11px] shrink-0 z-10">
          <span class="text-zinc-500 hidden sm:inline">Model:</span>
          <div class="relative flex items-center">
            <select 
              v-model="selectedModelId"
              class="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-yellow-500/40 cursor-pointer text-[11px] shadow-sm"
            >
              <option v-for="model in AVAILABLE_MODELS" :key="model.id" :value="model.id" class="bg-zinc-900 text-zinc-200">
                {{ model.name }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-2 text-[9px] text-zinc-500">▼</span>
          </div>
        </div>

      </header>
<div 
        ref="feedScrollContainer"
        @scroll="handleUserScrollDetection"
        @wheel="handleUserScrollDetection"
        @touchmove="handleUserScrollDetection"
        class="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 custom-scrollbar bg-zinc-950 min-h-0"
      >
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-3 pb-12">
          <div class="text-4xl animate-bounce duration-1000">🍌</div>
          <h1 class="text-xl font-mono font-bold tracking-tight text-yellow-400">BANANA Core Orchestrator</h1>
          <p class="text-xs text-zinc-500 font-mono leading-relaxed px-4">
            Ready to receive system operational parameters. Prepend requests with <span class="text-yellow-500/80">/search</span> to directly trigger automated real-time web telemetry routines.
          </p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="[
            'group max-w-3xl mx-auto flex gap-3.5 p-1 transition-all duration-150',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div v-if="msg.role === 'assistant'" class="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs flex items-center justify-center shrink-0 mt-0.5 text-yellow-400">
            <i class="i-lucide-bot text-xs"></i>
          </div>

          <div class="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[82%] min-w-0">
            <div :class="['font-mono text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <span>{{ msg.role === 'user' ? 'Client Directive' : 'Banana' }}</span>
              <span v-if="msg.source" class="text-[9px] px-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 lowercase">
                ({{ msg.source }})
              </span>
            </div>
            
            <div 
              :class="[
                'text-sm leading-relaxed max-w-none w-full overflow-hidden break-words',
                msg.role === 'user' 
                  ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-tr-none whitespace-pre-wrap [word-break:break-word]' 
                  : 'text-zinc-300 pt-0.5 prose prose-invert prose-zinc prose-sm max-w-none [word-break:break-word] \
                     prose-h1:text-xl prose-h1:font-bold prose-h1:text-yellow-400 prose-h1:font-mono prose-h1:mt-5 prose-h1:mb-3 \
                     prose-h2:text-lg prose-h2:font-bold prose-h2:text-yellow-400/90 prose-h2:font-mono prose-h2:mt-4 prose-h2:mb-2 \
                     prose-h3:text-base prose-h3:font-semibold prose-h3:text-zinc-100 prose-h3:font-mono prose-h3:mt-3 prose-h3:mb-1.5 \
                     prose-table:border prose-table:border-zinc-800 prose-th:bg-zinc-900 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-zinc-800 \
                     prose-code:text-yellow-500 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded \
                     prose-blockquote:border-l-2 prose-blockquote:border-yellow-500 prose-blockquote:pl-4 prose-blockquote:italic'
              ]"
            >
              <div v-if="msg.role === 'user'">{{ msg.content }}</div>
              <div v-else v-html="renderMarkdownMarkup(msg.content)"></div>
            </div>

            <div 
  v-if="msg.content && (!isProcessingPipeline || index !== messages.length - 1)" 
  :class="[
    'flex items-center gap-3 pt-0.5 px-1 font-mono text-[10px] text-zinc-500 select-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200',
    msg.role === 'user' ? 'justify-end' : 'justify-start'
  ]"
>
              <button 
                @click.stop="copyMessageContent(msg.content, $event)" 
                class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy text"
              >
                <i class="i-lucide-copy text-xs"></i>
                <span>Copy</span>
              </button>

              <template v-if="msg.role === 'user' && index >= messages.length - 2">
                <span class="text-zinc-800">•</span>
                <button 
  @click.stop="editUserPromptAtIndex(index)" 
  class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer"
  title="Edit prompt"
>
                
                  <i class="i-lucide-pencil text-xs"></i>
                  <span>Edit</span>
                </button>
              </template>

              <template v-if="msg.role === 'assistant' && index === messages.length - 1">
                <span class="text-zinc-800">•</span>
                <button 
                  @click.stop="regenerateMessageAtIndex(index)" 
                  class="hover:text-yellow-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Regenerate response"
                >
                  <i class="i-lucide-rotate-cw text-xs"></i>
                  <span>Regenerate</span>
                </button>
              </template>
            </div>

          </div>
        </div>

        <div v-if="isProcessingPipeline" class="max-w-3xl mx-auto flex gap-3.5 p-1">
          <div class="w-6 h-6 rounded-full bg-yellow-500/10 border border-dashed border-yellow-500/40 flex items-center justify-center shrink-0 animate-spin text-[10px]">
            ⏳
          </div>
          <div class="text-xs text-zinc-500 font-mono italic flex items-center gap-2 animate-pulse pt-0.5">
            Analysing...
          </div>
        </div>
      </div> <footer class="p-3 md:p-4 border-t border-zinc-900/80 bg-zinc-950 shrink-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form @submit.prevent="executeTransmissionDirective" class="max-w-3xl mx-auto relative flex items-end bg-zinc-900 border border-zinc-800 focus-within:border-yellow-500/40 rounded-2xl p-2 transition-all shadow-lg">
  <textarea 
    ref="inputTextarea"
    v-model="inputFieldPrompt"
    @keydown="handleKeydown"
    @input="adjustTextareaHeight"
    rows="1"
    placeholder="Ask BANANA AI anything... (Shift + Enter for new line)"
    class="w-full bg-transparent text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none resize-none px-3 py-2 custom-scrollbar max-h-48 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap [word-break:break-word]"
  ></textarea>
  
  <button 
    v-if="isProcessingPipeline"
    type="button"
    @click="isProcessingPipeline = false"
    class="ml-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white font-mono font-bold rounded-xl text-xs tracking-wider transition-all shrink-0 mb-0.5 animate-pulse cursor-pointer"
  >
    STOP
  </button>
  <button 
    v-else
    type="submit"
    :disabled="!inputFieldPrompt.trim()"
    class="ml-2 px-4 py-2 bg-yellow-500 text-zinc-950 font-mono font-bold rounded-xl text-xs tracking-wider hover:bg-yellow-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5 cursor-pointer"
  >
    Send
  </button>
</form>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { AVAILABLE_MODELS } from '~~/src/models'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'

// Custom renderer to format code blocks with language labels and copy buttons
const mdProcessor = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
}).use(markdownItKatex, {
  throwOnError: false,
  errorColor: '#ef4444',
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
})

// Override fence renderer for code block containers
// Override fence renderer for code block containers
mdProcessor.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const rawCode = token.content
  const lang = token.info.trim() || 'PlainText'
  
  // Format display label
  const formattedLang = lang.toUpperCase()

  // Safe base64 encoding to prevent quotes, backticks, or newlines from breaking the inline onclick handler
  const base64Code = btoa(unescape(encodeURIComponent(rawCode)))
  
  // Escape HTML entities to safely render inside <code> tags
  const escapedCode = rawCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
  `
}

/**
 * Complete, Robust Markdown & LaTeX Parsing Pipeline
 * Handles streaming artifacts, currency escaping, bra-ket syntax, matrix wrapping,
 * table cleanup, and graceful error fallbacks.
 *
 * @param {string} rawText - Raw unparsed markdown string from LLM output.
 * @returns {string} HTML string processed by mdProcessor / KaTeX.
 */
function renderMarkdownMarkup(rawText) {
  if (rawText === null || rawText === undefined) {
    return ''
  }

  let text = String(rawText)

  if (!text.trim()) {
    return ''
  }

  // Normalize CRLF (\r\n) line breaks to standard UNIX (\n)
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // =========================================================================
  // 1. STASH CODE BLOCKS & INLINE CODE
  // Protects code fences and backticks from regex modifications
  // =========================================================================
  const codeBlocks = []
  
  function stashCodeBlock(match) {
    const placeholder = `___BANANA_CODE_BLOCK_STASH_${codeBlocks.length}___`
    codeBlocks.push(match)
    return placeholder
  }

  // Preserve multi-line code blocks (``` or ~~~) and inline backticks
  text = text.replace(/```[\s\S]*?```/g, stashCodeBlock)
  text = text.replace(/~~~[\s\S]*?~~~/g, stashCodeBlock)
  text = text.replace(/`[^`\n]+`/g, stashCodeBlock)

  // =========================================================================
  // 2. UNESCAPE BACKSLASHES, CURRENCY, & QUANTUM TOKENS
  // =========================================================================
  // 2a. Recover corrupted fraction token markers
  text = text.replace(/%@FRAC\|/g, '\\frac')
  text = text.replace(/%@FRAC/g, '\\frac')

  // 2b. Currency Protection: Escape currency dollar signs ($5, $10.50, $1000)
  // so KaTeX does not misinterpret them as LaTeX math delimiters
  text = text.replace(/\$(\d+(?:\.\d{1,2})?)\b/g, '\\$$1')

  // 2c. Clean up double-escaped backslashes in LaTeX macros
  text = text.replace(/\\\\(begin|end|frac|sqrt|ket|bra|vert|rangle|langle|pmatrix|bmatrix|vmatrix|cases|array|align|equation|text|mathrm|mathbf|sum|prod|int|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|rho|sigma|tau|phi|psi|omega)/g, '\\$1')

  // 2d. Clean bra-ket notation and standard vector states
  text = text.replace(/\\ket\s*\{([^}]+)\}/g, '| $1 \\rangle')
  text = text.replace(/\\bra\s*\{([^}]+)\}/g, '\\langle $1 |')
  text = text.replace(/\|00\\rangle/g, '\\vert 00 \\rangle')
  text = text.replace(/\|01\\rangle/g, '\\vert 01 \\rangle')
  text = text.replace(/\|10\\rangle/g, '\\vert 10 \\rangle')
  text = text.replace(/\|11\\rangle/g, '\\vert 11 \\rangle')

  // =========================================================================
  // 3. PSEUDO-HEADER CONVERSION
  // =========================================================================
  text = text.replace(/^(\s*)\*\*(Part\s+\d+[^:\n]*):\*\*\s*$/gm, '$1### $2')
  text = text.replace(/^(\s*)\*\*(Section\s+\d+[^:\n]*):\*\*\s*$/gm, '$1### $2')
  text = text.replace(/^(\s*)\*\*(Step\s+\d+[^:\n]*):\*\*\s*$/gm, '$1### $2')
  text = text.replace(/^(\s*)\*\*([A-Z0-9\s_\-]{3,40}):\*\*\s*$/gm, '$1### $2')

  // =========================================================================
  // 4. DELIMITER & EQUATION BLOCK NORMALIZATION
  // =========================================================================
  // Convert \[ ... \] to display math blocks $$...$$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, eq) => `\n$$\n${eq.trim()}\n$$\n`)

  // Convert \( ... \) to inline math $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, eq) => `$${eq.trim()}$`)

  // Fix mixed delimiters where equation equals signs bleed into $ markers
  text = text.replace(
    /(\\[A-Za-z]+(?:\\[A-Za-z]+)*\s*=\s*[^$\n]+?)\s*\$\s*(\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|cases)\}[\s\S]*?\\end\{(?:pmatrix|bmatrix|vmatrix|matrix|cases)\})/g,
    '\n$$\n$1 $2\n$$\n'
  )

  // =========================================================================
  // 5. AUTO-WRAP UNWRAPPED MATRICES & VECTOR EQUATIONS
  // =========================================================================
  const supportedEnvs = [
    'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix',
    'cases', 'align', 'align\\*', 'equation', 'equation\\*',
    'gather', 'gather\\*', 'array', 'split', 'subarray'
  ].join('|')

  // 5a. Wrap standalone LaTeX environments missing $$ wrappers
  const envRegex = new RegExp(`(?<!\\$\\$)\\s*\\\\begin\\{(${supportedEnvs})\\}([\\s\\S]*?)\\\\end\\{\\1\\}\\s*(?!\\$\\$)`, 'g')
  text = text.replace(envRegex, (_m, envType, envBody) => `\n$$\n\\begin{${envType}}\n${envBody.trim()}\n\\end{${envType}}\n$$\n`)

  // 5b. Catch un-delimited state vector equations starting with \Psi, \vert, or \ket
  const nakedVectorRegex = /(?<!\$)\b(\\(?:Psi|phi|psi|theta|chi|omega)\s*(?:\\rangle|\|)?\s*=\s*(?:\\frac\{[^{}]+\}\{[^{}]+\}|\d+)?\s*\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix)\}[\s\S]*?\\end\{(?:pmatrix|bmatrix|vmatrix|matrix)\})(?!\$)/g
  text = text.replace(nakedVectorRegex, (_m, vExpr) => `\n$$\n${vExpr.trim()}\n$$\n`)

  // =========================================================================
  // 6. INLINE MATH AUTO-WRAPPING
  // =========================================================================
  // Auto-wrap isolated fractions missing $ delimiters
  text = text.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, '$\\frac{$1}{$2}$')

  // Auto-wrap isolated bra-ket sums missing $ delimiters
  text = text.replace(
    /(?<!\$)\((?:\\vert|\\rangle|\\langle|\|)\s*[\d\w]+\s*(?:\\rangle|\|)\s*[\+\-]\s*(?:\\vert|\\rangle|\\langle|\|)\s*[\d\w]+\s*(?:\\rangle|\|)\)(?!\$)/g,
    '$$&$$'
  )

  // =========================================================================
  // 7. MARKDOWN TABLE SANITIZATION
  // =========================================================================
  function sanitizeMarkdownTables(content) {
    const lines = content.split('\n')
    const processedLines = []
    let inTable = false

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]
      const isPipeLine = /^\s*\|.*\|\s*$/.test(line)
      const isHeaderSeparator = /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line)

      if (isPipeLine || isHeaderSeparator) {
        if (!inTable) {
          inTable = true
          if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== '') {
            processedLines.push('')
          }
        }
        processedLines.push(line.trim())
      } else {
        if (inTable) {
          inTable = false
          if (line.trim() !== '') {
            processedLines.push('')
          }
        }
        processedLines.push(line)
      }
    }

    return processedLines.join('\n')
  }

  text = sanitizeMarkdownTables(text)

  // =========================================================================
  // 8. DOLLAR SIGN SANITIZATION & BLOCK SPACING
  // =========================================================================
  text = text.replace(/\${3,}/g, '$$')
  text = text.replace(/\$\$\s*\n+/g, '$$\n')
  text = text.replace(/\n+\s*\$\$/g, '\n$$')
  text = text.replace(/([^\n])\$\$/g, '$1\n$$')
  text = text.replace(/\$\$([^\n])/g, '$$\n$1')

  // =========================================================================
  // 9. RESTORE STASHED CODE BLOCKS
  // =========================================================================
  text = text.replace(/___BANANA_CODE_BLOCK_STASH_(\d+)___/g, (_match, index) => {
    const blockIndex = Number(index)
    return codeBlocks[blockIndex] !== undefined ? codeBlocks[blockIndex] : ''
  })

  // =========================================================================
  // 10. FINAL HTML RENDERING & SAFE FALLBACK CATCH
  // =========================================================================
  try {
    return mdProcessor.render(text)
  } catch (renderError) {
    console.error('KaTeX/Markdown Rendering Error:', renderError)
    
    // Fallback logic: If rendering fails catastrophically, display plain text
    const safeEscapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return `<div class="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-200 font-mono text-xs whitespace-pre-wrap">${safeEscapedText}</div>`
  }
}
// ─── STATE ARRAYS AND UI VALUES ───────────────────────────────────────
const isSidebarVisible = ref(true)
const chatHistoryList = ref([])
const activeSessionId = ref('')
const messages = ref([])
const inputFieldPrompt = ref('')
const selectedModelId = ref(AVAILABLE_MODELS[0]?.id || '')
const isProcessingPipeline = ref(false)
const activeRoutingSource = ref('')
const feedScrollContainer = ref(null)
const inputTextarea = ref(null) // Added for textarea auto-height

// Dynamic textarea autosize (expands up to max-h-36 / 144px, then scrolls)
function adjustTextareaHeight() {
  nextTick(() => {
    const el = inputTextarea.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  })
}

// Enter sends message, Shift + Enter inserts new line
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    executeTransmissionDirective()
  }
}

// 🔍 SMART SCROLL SYSTEM VALS
const userHasScrolledUpManually = ref(false)

// ─── USER INTERACTION ACCIDENTAL SCROLL PROTECTOR ─────────────────────
function handleUserScrollDetection() {
  const container = feedScrollContainer.value
  if (!container) return

  const bottomThresholdPadding = 45
  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
  
  // If the user's focus is higher up, turn off the script's snap auto-scrolling
  userHasScrolledUpManually.value = distanceFromBottom > bottomThresholdPadding
}

async function triggerSystemEnforcedAutoScroll(force = false) {
  await nextTick()
  const container = feedScrollContainer.value
  if (!container) return

  // Only scroll down if the user isn't reading old logs, OR if a fresh prompt was just sent
  if (!userHasScrolledUpManually.value || force) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// ─── CACHE LOCAL STORAGE PIPELINES ────────────────────────────────────
function syncSessionsToLocalStorage() {
  localStorage.setItem('banana_core_sessions', JSON.stringify(chatHistoryList.value))
}

function loadSessionsFromLocalStorage() {
  if (import.meta.client) {
    const data = localStorage.getItem('banana_core_sessions')
    if (data) {
      try {
        chatHistoryList.value = JSON.parse(data)
      } catch (e) {
        console.error('Failed to parse chat history from LocalStorage:', e)
      }
    }
    // Always start on the clean Home Page state on fresh load:
    startNewChatSession()
  }
}

// ─── NODE LIFECYCLE MANAGERS ──────────────────────────────────────────

function startNewChatSession() {
  // Clear active session pointer to return to the home screen layout
  activeSessionId.value = null
  
  // Clear messages from active view
  messages.value = []
  
  // Reset header status pill & scroll lock states
  activeRoutingSource.value = 'Ready'
  userHasScrolledUpManually.value = false
}


function switchActiveSession(id) {
  const matchedNode = chatHistoryList.value.find(s => s.id === id)
  if (matchedNode) {
    activeSessionId.value = id
    messages.value = [...matchedNode.messages]
    activeRoutingSource.value = 'Ready'
    userHasScrolledUpManually.value = false
    triggerSystemEnforcedAutoScroll(true) // Force scroll to bottom on switch
  }
}

function purgeSession(id) {
  chatHistoryList.value = chatHistoryList.value.filter(s => s.id !== id)
  syncSessionsToLocalStorage()
  
  if (activeSessionId.value === id) {
    if (chatHistoryList.value.length > 0) {
      switchActiveSession(chatHistoryList.value[0].id)
    } else {
      startNewChatSession()
    }
  }
}

async function triggerBackgroundChatNamingSummary(userPromptText, responseText) {
  const currentSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
  if (!currentSession || currentSession.title !== 'New chat') return

  try {
    const summaryPayload = [
      { role: 'user', content: `Context content to condense:\nUser: ${userPromptText}\nAI: ${responseText}\n\nGENERATE_SHORT_TITLE_SUMMARY_DIRECTIVE` }
    ]

    const summaryResponse = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        messages: summaryPayload,
        selectedModelId: selectedModelId.value,
        summaryContext: 'Title generation sub-routing pass.'
      }
    })

    const generatedTitle = summaryResponse?.message?.content?.replace(/["'‘“.]/g, '').trim()
    if (generatedTitle && generatedTitle.length > 2 && !generatedTitle.includes('⚠️')) {
      currentSession.title = generatedTitle.length > 26 ? generatedTitle.slice(0, 26) + '...' : generatedTitle
      syncSessionsToLocalStorage()
    }
  } catch (err) {
    console.warn('Background core title generation fallback sequence handled.', err)
    const fallbackTitle = userPromptText.replace(/\/search\s*/i, '').trim()
    currentSession.title = fallbackTitle.length > 24 ? fallbackTitle.slice(0, 24) + '...' : fallbackTitle
    syncSessionsToLocalStorage()
  }
}

// ─── DIRECTIVE EXECUTION LAYER WITH STREAMING ──────────────────────────
// ─── DIRECTIVE EXECUTION LAYER WITH STREAMING ──────────────────────────
async function executeTransmissionDirective() {
  const currentPayload = inputFieldPrompt.value.trim()
  if (!currentPayload || isProcessingPipeline.value) return

  const isFirstMessage = messages.value.length === 0

  if (!activeSessionId.value) {
    const targetId = `node_${Date.now()}`
    const newSession = {
      id: targetId,
      title: 'New chat',
      messages: []
    }
    chatHistoryList.value.unshift(newSession)
    activeSessionId.value = targetId
  }

  // 1. Push User Message
  messages.value.push({ role: 'user', content: currentPayload })
  
  inputFieldPrompt.value = ''
  adjustTextareaHeight()
  isProcessingPipeline.value = true
  
  // 2. Push Assistant Placeholder AND Capture Exact Index
  const assistantMsgIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    source: 'Live Stream'
  })

  userHasScrolledUpManually.value = false
  await triggerSystemEnforcedAutoScroll(true)

  try {
    const calculatedContext = messages.value[0]?.content 
      ? `Topic focuses around: ${messages.value[0].content.slice(0, 40)}` 
      : ''

    // Inject strict system directive to eliminate hallucinations and enforce calculation verification
    const systemInstruction = {
  role: 'system',
  content: `You are BANANA Orchestrator—a strictly precise, fact-checked AI model. You must complete ALL requested prompt sections without omitting any part.

CRITICAL FORMATTING & TRUTH DIRECTIVES:

1. MATHEMATICAL VERIFICATION & VECTOR MAPPING:
   - Always verify state vector matrix calculations step-by-step before outputting.
   - For 2-qubit Bell state (|01> + |10>)/sqrt(2), the 4D state vector corresponds to [0, 1, 1, 0]^T. NEVER map it to [1, 1, 0, 0]^T.
   - Math equations MUST be output in clean block syntax ($$ ... $$) or inline syntax ($ ... $). NEVER mix raw narrative text inside $ delimiters.

2. MARKDOWN TABLE STRUCTURE INTEGRITY:
   - Every entity in a requested comparison or analysis MUST have its own dedicated table row.
   - NEVER collapse or merge multiple array items into a single row (e.g., Solar, Wind, and Geothermal MUST each have their own separate row).
   - Ensure domain factual accuracy (e.g., Geothermal is continuous baseload energy, NOT intermittent).

3. CREATIVE NARRATIVE & FOOTNOTE ISOLATION:
   - Keep narrative story paragraphs clean and free of inline definition brackets.
   - Place all technical definitions, slang glossary entries, and structural footnotes in a separate "### Glossary & Footnotes" section at the end of that part.

4. COMPLETE MULTI-PART EXECUTION:
   - You MUST fulfill every requested part (e.g., Part 1 through Part 4) completely within a single response.
   - Do NOT terminate generation prematurely or omit the final evaluation section.`
}

    let historyPayload = []

    try {
      // PRIMARY MODE: Try accessing full history in memory/reactive state
      if (!messages.value || messages.value.length === 0) {
        throw new Error("Primary memory state is empty or inaccessible")
      }
      historyPayload = messages.value.slice(0, assistantMsgIndex)
    } catch (storageError) {
      console.warn("Primary message history failed. Reverting to Summary Fallback Mode:", storageError)

      // FALLBACK MODE: Fetch rolling summary from local storage
      const fallbackSummary = getRollingSummaryFromStorage(activeSessionId.value)
      
      historyPayload = [
        {
          role: 'system',
          content: fallbackSummary 
            ? `Previous Conversation Summary Context:\n${fallbackSummary}` 
            : 'No prior summary context available.'
        },
        {
          role: 'user',
          content: currentPayload // Fixed: userQueryText -> currentPayload
        }
      ]
    }

    const payloadMessages = [systemInstruction, ...historyPayload]

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: payloadMessages,
        selectedModelId: selectedModelId.value,
        summaryContext: calculatedContext,
        temperature: 0.1,
        stream: true
      })
    })

    if (!response.ok || !response.body) {
      throw new Error(`Server returned HTTP status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let accumulatedContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data: ')) {
          accumulatedContent += parseContentChunk(trimmed.slice(6))
        } else {
          accumulatedContent += parseContentChunk(trimmed)
        }
      }

      messages.value[assistantMsgIndex].content = accumulatedContent
      triggerSystemEnforcedAutoScroll()
    }

    if (buffer) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ')) {
        accumulatedContent += parseContentChunk(trimmed.slice(6))
      } else {
        accumulatedContent += parseContentChunk(trimmed)
      }
      messages.value[assistantMsgIndex].content = accumulatedContent
    }

    activeRoutingSource.value = 'Stream Complete'

  } catch (err) {
    if (!messages.value[assistantMsgIndex].content) {
      messages.value[assistantMsgIndex].content = `⚠️ **Pipeline Terminal Failure**: Could not establish live stream.\n\n* **Diagnostics**: ${err.message || 'Stream connection drop'}`
    }
    activeRoutingSource.value = 'Connection Error'
  } finally {
    isProcessingPipeline.value = false
    
    const targetSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
    if (targetSession) {
      targetSession.messages = [...messages.value]
    }
    
    // Save full chat history to local storage
    syncSessionsToLocalStorage()
    
    // Append completed user & AI exchange to the fallback rolling summary
    const finalAssistantText = messages.value[assistantMsgIndex]?.content || ''
    if (finalAssistantText && currentPayload) {
      appendToRollingSummary(activeSessionId.value, currentPayload, finalAssistantText)
    }

    await triggerSystemEnforcedAutoScroll()

    if (isFirstMessage && finalAssistantText) {
      triggerBackgroundChatNamingSummary(currentPayload, finalAssistantText)
    }
  }
}

function copyCodeToClipboard(event, base64Text) {
  const btn = event.currentTarget
  if (!btn || !base64Text) return

  try {
    // Decode base64 text safely back into original code block string
    const decodedText = decodeURIComponent(escape(atob(base64Text)))

    navigator.clipboard.writeText(decodedText).then(() => {
      const originalText = btn.innerText
      btn.innerText = 'COPIED!'
      btn.classList.add('text-yellow-400', 'border-yellow-500/50')
      
      setTimeout(() => {
        btn.innerText = originalText
        btn.classList.remove('text-yellow-400', 'border-yellow-500/50')
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy text using Clipboard API:', err)
    })
  } catch (err) {
    console.error('Failed to decode base64 code block text:', err)
  }
}

// Attach to global window object so rendered markdown inline onclick handlers can trigger it
// Attach it globally so the markdown-it rendered HTML can access it

if (import.meta.client) {
  window.copyCodeToClipboard = copyCodeToClipboard
}

function renameSession(id) {
  const session = chatHistoryList.value.find(s => s.id === id)
  if (!session) return

  const newTitle = prompt('Enter new chat title:', session.title)
  if (newTitle && newTitle.trim()) {
    session.title = newTitle.trim()
    syncSessionsToLocalStorage()
  }
}

// ─── LIFECYCLE HOOKS ───────────────────────────────────────────────
onMounted(() => {
  loadSessionsFromLocalStorage()
})

// --- INLINE TITLE EDITING STATE & FUNCTIONS ---
const isEditingTitle = ref(false)
const editableTitleText = ref('')

// Auto-focus directive so the cursor immediately lands in the input when double-clicked
const vFocus = {
  mounted: (el) => el.focus()
}

// Computed property for display title
const currentSessionTitle = computed(() => {
  if (!activeSessionId.value) return null
  const activeSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
  return activeSession ? activeSession.title : null
})

// Enable edit mode on click or tap
function handleTitleClick() {
  if (!activeSessionId.value) return
  editableTitleText.value = currentSessionTitle.value || 'BANANA AI'
  isEditingTitle.value = true
}

// Save edited title to history & LocalStorage
function saveEditedTitle() {
  if (!isEditingTitle.value) return
  isEditingTitle.value = false

  const newTitle = editableTitleText.value.trim()
  if (!newTitle || !activeSessionId.value) return

  const session = chatHistoryList.value.find(s => s.id === activeSessionId.value)
  if (session) {
    session.title = newTitle
    syncSessionsToLocalStorage()
  }
}

// --- ICON ACTION HANDLERS ---

// Universal Clipboard Copy with Icon Feedback
function copyMessageContent(text, event) {
  if (!text) return
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (event?.currentTarget) {
        const btn = event.currentTarget
        const originalHTML = btn.innerHTML
        btn.innerHTML = '<i class="i-lucide-check text-xs text-emerald-400"></i><span class="text-emerald-400">Copied!</span>'
        setTimeout(() => { btn.innerHTML = originalHTML }, 1800)
      }
    }).catch(err => console.error('Failed to copy text:', err))
  }
}

// EDIT PROMPT FUNCTION - POPULATES TEXTAREA, ADJUSTS HEIGHT & PLACES CURSOR AT END
// Replace editUserPrompt with this:
function editUserPromptAtIndex(index) {
  const targetMsg = messages.value[index]
  if (!targetMsg || targetMsg.role !== 'user') return

  // Populate prompt
  inputFieldPrompt.value = targetMsg.content

  // Slice history so everything from this message downward is removed
  messages.value = messages.value.slice(0, index)

  adjustTextareaHeight()
  nextTick(() => {
    if (inputTextarea.value) {
      inputTextarea.value.focus()
      inputTextarea.value.setSelectionRange(targetMsg.content.length, targetMsg.content.length)
    }
  })
}

async function regenerateMessageAtIndex(index) {
  if (isProcessingPipeline.value) return

  // 1. Keep history up to and including the target assistant slot
  messages.value = messages.value.slice(0, index + 1)

  // 2. Clear content in target assistant slot
  messages.value[index] = {
    role: 'assistant',
    content: '',
    source: 'Live Stream'
  }

  isProcessingPipeline.value = true
  userHasScrolledUpManually.value = false
  await triggerSystemEnforcedAutoScroll(true)

  // 3. Trigger streaming into index
  await streamAssistantResponse(index)
}

async function streamAssistantResponse(targetIndex = null) {
  const assistantMsgIndex = targetIndex ?? (messages.value.length - 1)
  if (assistantMsgIndex < 0) return

  try {
    const calculatedContext = messages.value[0]?.content 
      ? `Topic focuses around: ${messages.value[0].content.slice(0, 40)}` 
      : ''

    // Inject strict system directive to eliminate hallucinations and enforce calculation verification
    const systemInstruction = {
  role: 'system',
  content: `You are BANANA Orchestrator—a strictly precise, fact-checked AI model. You must complete ALL requested prompt sections without omitting any part.

CRITICAL FORMATTING & TRUTH DIRECTIVES:

1. MATHEMATICAL VERIFICATION & VECTOR MAPPING:
   - Always verify state vector matrix calculations step-by-step before outputting.
   - For 2-qubit Bell state (|01> + |10>)/sqrt(2), the 4D state vector corresponds to [0, 1, 1, 0]^T. NEVER map it to [1, 1, 0, 0]^T.
   - Math equations MUST be output in clean block syntax ($$ ... $$) or inline syntax ($ ... $). NEVER mix raw narrative text inside $ delimiters.

2. MARKDOWN TABLE STRUCTURE INTEGRITY:
   - Every entity in a requested comparison or analysis MUST have its own dedicated table row.
   - NEVER collapse or merge multiple array items into a single row (e.g., Solar, Wind, and Geothermal MUST each have their own separate row).
   - Ensure domain factual accuracy (e.g., Geothermal is continuous baseload energy, NOT intermittent).

3. CREATIVE NARRATIVE & FOOTNOTE ISOLATION:
   - Keep narrative story paragraphs clean and free of inline definition brackets.
   - Place all technical definitions, slang glossary entries, and structural footnotes in a separate "### Glossary & Footnotes" section at the end of that part.

4. COMPLETE MULTI-PART EXECUTION:
   - You MUST fulfill every requested part (e.g., Part 1 through Part 4) completely within a single response.
   - Do NOT terminate generation prematurely or omit the final evaluation section.`
}

    const historyPayload = [systemInstruction, ...messages.value.slice(0, assistantMsgIndex)]

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: historyPayload,
        selectedModelId: selectedModelId.value,
        summaryContext: calculatedContext,
        temperature: 0.1,
        stream: true
      })
    })

    if (!response.ok || !response.body) {
      throw new Error(`Server returned HTTP status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let accumulatedContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data: ')) {
          accumulatedContent += parseContentChunk(trimmed.slice(6))
        } else {
          accumulatedContent += parseContentChunk(trimmed)
        }
      }

      messages.value[assistantMsgIndex].content = accumulatedContent
      triggerSystemEnforcedAutoScroll()
    }

    if (buffer) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ')) {
        accumulatedContent += parseContentChunk(trimmed.slice(6))
      } else {
        accumulatedContent += parseContentChunk(trimmed)
      }
      messages.value[assistantMsgIndex].content = accumulatedContent
    }

    activeRoutingSource.value = 'Stream Complete'
  } catch (err) {
    if (!messages.value[assistantMsgIndex].content) {
      messages.value[assistantMsgIndex].content = `⚠️ **Pipeline Terminal Failure**: Could not establish live stream.\n\n* **Diagnostics**: ${err.message || 'Stream connection drop'}`
    }
    activeRoutingSource.value = 'Connection Error'
  } finally {
    isProcessingPipeline.value = false
    const targetSession = chatHistoryList.value.find(s => s.id === activeSessionId.value)
    if (targetSession) {
      targetSession.messages = [...messages.value]
    }
    syncSessionsToLocalStorage()
    await triggerSystemEnforcedAutoScroll()
  }
}

function parseContentChunk(chunk) {
  if (!chunk || chunk === '[DONE]' || chunk === 'DONE') return ''

  // Support Vercel AI SDK 0:"text" streaming format
  if (typeof chunk === 'string' && chunk.startsWith('0:')) {
    try {
      return JSON.parse(chunk.slice(2))
    } catch {
      return chunk.slice(2)
    }
  }

  try {
    const parsed = JSON.parse(chunk)
    if (typeof parsed === 'string') return parsed

    // 1. OpenAI / OpenRouter / Groq / DeepSeek SSE Format
    if (parsed.choices?.[0]?.delta?.content) return parsed.choices[0].delta.content
    if (parsed.choices?.[0]?.text) return parsed.choices[0].text
    if (parsed.choices?.[0]?.message?.content) return parsed.choices[0].message.content

    // 2. Anthropic / Ollama / Custom Formats
    if (parsed.delta?.text) return parsed.delta.text
    if (typeof parsed.delta === 'string') return parsed.delta
    if (parsed.delta?.content) return parsed.delta.content

    // 3. Fallbacks
    if (parsed.content) return typeof parsed.content === 'string' ? parsed.content : ''
    if (parsed.text) return typeof parsed.text === 'string' ? parsed.text : ''
    if (parsed.message?.content) return parsed.message.content
    if (parsed.response) return parsed.response

    return ''
  } catch {
    // Plain string fallback
    return chunk
  }
}

// --- Memory & Local Storage Fallback Helpers ---

// Save or update rolling summary in localStorage
function saveRollingSummaryToStorage(sessionId, summaryText) {
  try {
    localStorage.setItem(`banana_summary_${sessionId}`, summaryText)
  } catch (err) {
    console.error("Failed to write summary to localStorage:", err)
  }
}

// Retrieve rolling summary if main state fails
function getRollingSummaryFromStorage(sessionId) {
  try {
    return localStorage.getItem(`banana_summary_${sessionId}`) || ""
  } catch (err) {
    console.warn("Could not access localStorage summary:", err)
    return ""
  }
}

// Append new conversation turn to the running summary
function appendToRollingSummary(sessionId, userPrompt, assistantReply) {
  const existingSummary = getRollingSummaryFromStorage(sessionId)
  const newEntry = `\nUser: ${userPrompt}\nAI: ${assistantReply}`
  const updatedSummary = (existingSummary + newEntry).trim()
  saveRollingSummaryToStorage(sessionId, updatedSummary)
}
</script>

<style scoped>
/* Custom Scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}

/* Force distinct Markdown heading sizes */
:deep(.prose h1) {
  font-size: 2.25rem !important;
  line-height: 2.5rem !important;
  font-weight: 800 !important;
  color: #facc15 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
}

:deep(.prose h2) {
  font-size: 1.625rem !important;
  line-height: 2rem !important;
  font-weight: 700 !important;
  color: rgba(250, 204, 21, 0.9) !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  margin-top: 1.25rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.prose h3) {
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
  font-weight: 700 !important;
  color: #f4f4f5 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  margin-top: 1rem !important;
  margin-bottom: 0.375rem !important;
}

:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  font-size: 0.95rem !important;
  line-height: 1.25rem !important;
  font-weight: 600 !important;
  color: #e4e4e7 !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.25rem !important;
}

/* 📊 1. Scrollable Table Window & Gridlines */
:deep(.prose table) {
  display: block !important;
  width: 100% !important;
  overflow-x: auto !important;
  white-space: nowrap !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border: 1px solid rgba(39, 39, 42, 0.8) !important;
  border-radius: 0.5rem !important;
  margin: 1rem 0 !important;
}

:deep(.prose th) {
  background-color: rgba(24, 24, 27, 0.9) !important;
  color: #facc15 !important;
  font-weight: 700 !important;
  text-align: left !important;
  padding: 0.6rem 0.85rem !important;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8) !important;
  border-right: 1px solid rgba(39, 39, 42, 0.5) !important;
  min-width: 120px;
}

:deep(.prose td) {
  padding: 0.6rem 0.85rem !important;
  border-bottom: 1px solid rgba(39, 39, 42, 0.5) !important;
  border-right: 1px solid rgba(39, 39, 42, 0.5) !important;
  min-width: 120px;
}

:deep(.prose th:last-child),
:deep(.prose td:last-child) {
  border-right: none !important;
}

:deep(.prose tr:last-child td) {
  border-bottom: none !important;
}

:deep(.prose table)::-webkit-scrollbar {
  height: 5px;
}
:deep(.prose table)::-webkit-scrollbar-track {
  background: rgba(24, 24, 27, 0.5);
}
:deep(.prose table)::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 4px;
}
:deep(.prose table)::-webkit-scrollbar-thumb:hover {
  background: #eab308;
}

/* 🧮 2. KaTeX Math Block & Inline Formatting */
:deep(.katex-display) {
  margin: 1rem 0 !important;
  padding: 0.75rem 1rem !important;
  background-color: rgba(24, 24, 27, 0.6) !important;
  border: 1px solid rgba(39, 39, 42, 0.8) !important;
  border-radius: 0.75rem !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  text-align: center !important;
}

:deep(.katex) {
  font-size: 1.05em !important;
  color: #fef08a !important;
}

:deep(.katex-inline) {
  padding: 0.1rem 0.3rem !important;
  background: rgba(39, 39, 42, 0.4) !important;
  border-radius: 0.25rem !important;
}

/* 🟡 3. Clean Bullet & List Formatting */
:deep(.prose ul) {
  list-style-type: disc !important;
  padding-left: 1.25rem !important;
  margin-top: 0.5rem !important;
  margin-bottom: 0.75rem !important;
}

:deep(.prose ol) {
  list-style-type: decimal !important;
  padding-left: 1.25rem !important;
  margin-top: 0.5rem !important;
  margin-bottom: 0.75rem !important;
}

:deep(.prose li) {
  margin-top: 0.25rem !important;
  margin-bottom: 0.25rem !important;
  line-height: 1.625 !important;
}

:deep(.prose ul > li::marker),
:deep(.prose ol > li::marker) {
  color: #facc15 !important;
  font-weight: 700 !important;
}
</style>