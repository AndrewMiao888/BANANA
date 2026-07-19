import { defineComponent, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const isSidebarOpen = ref(true);
    const messages = ref([]);
    const inputMessage = ref("");
    const isLoading = ref(false);
    const networkStatus = ref("CHECKING...");
    ref(null);
    const runningSummary = ref("No summary computed yet.");
    const longTermMemories = ref([]);
    const isRecording = ref(false);
    const selectedFiles = ref([]);
    ref(null);
    const availableModels = ref([]);
    const selectedModelId = ref("llama3-8b-8192");
    const parseRichContent = (text) => {
      if (!text) return "";
      let formatted = text.replace(/\$\$(.*?)\$\$/gs, '<div class="my-3 p-3 bg-slate-950 rounded border border-slate-800 text-center font-serif text-emerald-300 overflow-x-auto">$$1</div>').replace(/\\\[(.*?)\\\]/gs, '<div class="my-3 p-3 bg-slate-950 rounded border border-slate-800 text-center font-serif text-emerald-300 overflow-x-auto">$$1</div>').replace(/\$(.*?)\$/g, '<span class="px-1 py-0.5 bg-slate-950 text-emerald-300 font-serif rounded">$1</span>').replace(/\\\((.*?)\\\)/g, '<span class="px-1 py-0.5 bg-slate-950 text-emerald-300 font-serif rounded">$1</span>').replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<div class="my-4 bg-slate-950 rounded border border-slate-800 overflow-hidden font-mono text-left">
        <div class="bg-slate-900 px-4 py-1.5 border-b border-slate-800 flex justify-between text-[10px] text-slate-400 select-none uppercase tracking-wider">
          <span>${lang || "CODE_STREAM"}</span>
          <span class="text-emerald-500/50">ACTIVE_BLOCK</span>
        </div>
        <pre class="p-4 overflow-x-auto text-slate-200 text-xs select-text"><code>${code.trim()}</code></pre>
      </div>`;
      }).replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-rose-400 font-mono rounded select-text">$1</code>').replace(/^### (.*$)/gim, '<h3 class="text-slate-100 font-bold text-sm mt-4 mb-2 tracking-wide font-sans">■ $1</h3>').replace(/^## (.*$)/gim, '<h2 class="text-emerald-400 font-black text-base mt-5 mb-2.5 tracking-wider font-sans">⚡ $1</h2>').replace(/^# (.*$)/gim, '<h1 class="text-emerald-400 font-black text-lg mt-6 mb-3 border-b border-slate-800 pb-1 tracking-widest font-sans">$1</h1>').replace(/\*\*([^*]+)\*\*/g, '<strong class="text-emerald-400 font-bold">$1</strong>');
      return formatted;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-screen bg-slate-950 font-mono text-xs select-none antialiased text-slate-200 overflow-hidden" }, _attrs))}><aside class="${ssrRenderClass([
        "bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-20 shrink-0 h-full",
        isSidebarOpen.value ? "w-64" : "w-0 border-r-0 overflow-hidden"
      ])}"><div class="p-4 border-b border-slate-800 flex items-center justify-between"><span class="text-emerald-400 font-black tracking-widest text-[10px]">CORE MEMORY DATA</span><span class="bg-slate-950 px-1 text-slate-500 rounded text-[9px] border border-slate-800">TELEMETRY</span></div><div class="flex-1 p-3 space-y-4 overflow-y-auto text-slate-400"><div class="space-y-1.5"><div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">⚡ Running Main Idea Summary:</div><div class="p-2.5 bg-slate-950 border border-slate-850 rounded text-slate-300 text-[10px] leading-relaxed font-sans max-h-40 overflow-y-auto">${ssrInterpolate(runningSummary.value)}</div></div>`);
      if (longTermMemories.value.length > 0) {
        _push(`<div class="space-y-1.5"><div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">💾 Extracted Memories (Offline Cache):</div><div class="space-y-1"><!--[-->`);
        ssrRenderList(longTermMemories.value, (memory, mIdx) => {
          _push(`<div class="p-1.5 bg-slate-950 border border-slate-850 rounded text-[9px] truncate text-emerald-400/80"> • ${ssrInterpolate(memory)}</div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-3 border-t border-slate-800 bg-slate-950 text-[10px] space-y-1 text-slate-500"><div>SYS_LOC: 127.0.0.1:11434</div><div>CONTEXT_STRATEGY: ${ssrInterpolate(networkStatus.value === "ONLINE" ? "LOCAL_FULL_READ" : "CLOUD_INCREMENTAL")}</div></div></aside><div class="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden"><header class="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0"><div class="flex items-center gap-3"><button class="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded transition">${ssrInterpolate(isSidebarOpen.value ? "◀" : "▶")}</button><div class="flex flex-col"><div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span class="font-bold tracking-wider text-slate-100">NANA_INTELLIGENCE_CORE</span></div></div></div><div class="flex items-center gap-4"><div class="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 border border-slate-800 rounded"><span class="text-slate-500 text-[10px]">GRID:</span><span class="${ssrRenderClass(["font-bold text-[10px]", networkStatus.value === "ONLINE" ? "text-emerald-400" : "text-rose-400"])}">${ssrInterpolate(networkStatus.value)}</span></div><select class="bg-slate-950 border border-slate-850 text-slate-300 text-[11px] rounded p-1 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer transition"><!--[-->`);
      ssrRenderList(availableModels.value, (model) => {
        _push(`<option${ssrRenderAttr("value", model.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedModelId.value) ? ssrLooseContain(selectedModelId.value, model.id) : ssrLooseEqual(selectedModelId.value, model.id)) ? " selected" : ""}>${ssrInterpolate(model.name)} [${ssrInterpolate(model.tier)}] </option>`);
      });
      _push(`<!--]--></select><button class="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded transition"> 🔄 </button></div></header><main class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">`);
      if (messages.value.length === 0) {
        _push(`<div class="h-full flex flex-col items-center justify-center text-center text-slate-600"><span class="text-3xl mb-2 text-slate-800">⚙️</span><p class="max-w-xs leading-normal">Operational matrix standby. Provide operational parameters or instructions to mount computational threads.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(messages.value, (msg, index) => {
        _push(`<div class="${ssrRenderClass([
          "p-3.5 rounded border text-[11px] max-w-[85%] relative transition-all duration-150",
          msg.role === "user" ? "bg-slate-900 border-slate-800 ml-auto text-slate-100" : msg.role === "system" ? "bg-rose-950/20 border-rose-900/40 text-rose-300 mx-auto w-full max-w-full text-center font-bold" : "bg-slate-900/30 border-slate-850/80 text-slate-300 mr-auto"
        ])}"><div class="flex items-center gap-2 mb-1.5 opacity-40 text-[9px] uppercase tracking-wider select-none font-black"><span>${ssrInterpolate(msg.role === "user" ? "► OP_INPUT" : msg.role === "system" ? "⚠️ BROADCAST" : "⚡ NANA_RESPONSE")}</span>`);
        if (msg.source) {
          _push(`<span class="text-[8px] bg-slate-950 px-1 border border-slate-800 text-emerald-400">${ssrInterpolate(msg.source)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (msg.attachments) {
          _push(`<div class="mb-2 p-1.5 bg-slate-950 border border-slate-850 rounded text-slate-400 space-y-0.5"><!--[-->`);
          ssrRenderList(msg.attachments, (file, fIdx) => {
            _push(`<div class="truncate flex items-center gap-1"> 📎 <span>${ssrInterpolate(file)}</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="prose prose-invert max-w-none space-y-2 select-text">${parseRichContent(msg.content) ?? ""}</div></div>`);
      });
      _push(`<!--]-->`);
      if (isLoading.value) {
        _push(`<div class="p-3 bg-slate-900 border border-emerald-950 text-[11px] w-fit rounded flex items-center gap-4 animate-pulse"><div class="flex items-center gap-2"><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span><span class="text-slate-400">Computing core routing parameters...</span></div><button class="px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 rounded text-[9px] hover:bg-rose-900/60 transition font-black"> 🛑 BREAK SYSTEM </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main><footer class="p-4 border-t border-slate-800 bg-slate-900 shrink-0">`);
      if (selectedFiles.value.length > 0) {
        _push(`<div class="flex flex-wrap gap-2 mb-3 p-2 bg-slate-950 border border-slate-850 rounded"><!--[-->`);
        ssrRenderList(selectedFiles.value, (file, idx) => {
          _push(`<div class="bg-slate-900 border border-slate-800 pl-2 pr-1 py-1 rounded flex items-center gap-2 max-w-[200px]"><span class="truncate text-slate-400 font-sans text-[10px]">📁 ${ssrInterpolate(file.name)}</span><button type="button" class="text-rose-400 hover:bg-rose-950/40 w-4 h-4 rounded text-center leading-none">×</button></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="flex gap-2"><input type="file" class="hidden" multiple accept="image/*"><div class="flex gap-1"><button type="button" class="px-3 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-emerald-400 rounded transition"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""}>📁</button><button type="button" class="${ssrRenderClass(["px-3 border rounded transition font-bold", isRecording.value ? "bg-rose-950 border-rose-800 text-rose-400 animate-pulse" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-emerald-400"])}"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""}>${ssrInterpolate(isRecording.value ? "🎙️ REC" : "🎙️")}</button></div><input${ssrRenderAttr("value", inputMessage.value)} type="text" placeholder="Awaiting operational protocols or file injections..." class="flex-1 bg-slate-950 border border-slate-850 focus:border-emerald-500 text-[11px] rounded px-3 text-slate-100 placeholder-slate-600 focus:outline-none font-mono transition"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""} autocomplete="off"><button type="submit" class="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-950 disabled:border-slate-850 disabled:text-slate-700 text-slate-950 px-5 rounded font-black border border-emerald-600 transition tracking-wider"${ssrIncludeBooleanAttr(isLoading.value || !inputMessage.value.trim() && selectedFiles.value.length === 0) ? " disabled" : ""}> EXECUTE </button></form></footer></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-xdqUp9JK.mjs.map
