import { ref, computed, watch, mergeProps, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderComponent, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

async function runAgent1Core(messages) {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content
  }));
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: formattedMessages })
  });
  return await response.json();
}
const _sfc_main$1 = {
  __name: "ChatInput",
  __ssrInlineRender: true,
  props: {
    isLoading: Boolean
  },
  emits: ["send-message", "stop-generation", "attach-click"],
  setup(__props, { emit: __emit }) {
    const internalInput = ref("");
    const isMenuOpen = ref(ref(false));
    const isListening = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "chat-input-wrapper" }, _attrs))} data-v-f0a66314><div class="chat-input-container" data-v-f0a66314><div class="menu-wrapper" data-v-f0a66314><button class="${ssrRenderClass([{ "active": isMenuOpen.value }, "action-toggle-btn"])}" type="button" data-v-f0a66314><span class="plus-icon" data-v-f0a66314>\uFF0B</span></button>`);
      if (isMenuOpen.value) {
        _push(`<ul class="actions-dropdown" data-v-f0a66314><li data-v-f0a66314><strong data-v-f0a66314>[FILE]</strong> Upload File</li><li data-v-f0a66314><strong data-v-f0a66314>[IMG]</strong> Process Vision</li><li data-v-f0a66314><strong data-v-f0a66314>[EDIT]</strong> Smart Write</li><li data-v-f0a66314><strong data-v-f0a66314>[SRC]</strong> Search Web</li></ul>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><input${ssrRenderAttr("value", internalInput.value)} type="text"${ssrRenderAttr("placeholder", isListening.value ? "Listening (Auto-Detecting Language)..." : "Ask anything...")} class="large-chat-input"${ssrIncludeBooleanAttr(__props.isLoading) ? " disabled" : ""} data-v-f0a66314><div class="input-actions-tray" data-v-f0a66314><button type="button" class="${ssrRenderClass([{ "listening-active": isListening.value }, "tray-icon-btn mic-btn"])}" title="Voice Input (Auto-Detect)" data-v-f0a66314><span class="mic-icon" data-v-f0a66314>\u{1F3A4}</span></button>`);
      if (__props.isLoading) {
        _push(`<button type="button" class="tray-icon-btn stop-btn" data-v-f0a66314><div class="stop-square" data-v-f0a66314></div></button>`);
      } else {
        _push(`<button type="button" class="tray-icon-btn send-btn"${ssrIncludeBooleanAttr(!internalInput.value.trim()) ? " disabled" : ""} data-v-f0a66314><span data-v-f0a66314>\u25B2</span></button>`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ChatInput.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-f0a66314"]]);
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userInput = ref("");
    const isLoading = ref(false);
    const isMenuOpen = ref(false);
    const chatWindow = ref(null);
    let currentAbortController = null;
    const defaultSystemMessage = {
      role: "system",
      content: "You are BANANA system core agent. You are helpful, precise, and highly capable."
    };
    const chatHistory = ref([defaultSystemMessage]);
    const visibleMessages = computed(() => {
      return chatHistory.value.filter((msg) => msg.role !== "system");
    });
    watch(chatHistory, (newHistory) => {
      localStorage.setItem("banana_chat_history", JSON.stringify(newHistory));
    }, { deep: true });
    const scrollWindowToBottom = async () => {
      await nextTick();
      if (chatWindow.value) {
        chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
      }
    };
    const submitMessage = async () => {
      const cleanInput = userInput.value.trim();
      if (!cleanInput || isLoading.value) return;
      chatHistory.value.push({ role: "user", content: cleanInput });
      userInput.value = "";
      isLoading.value = true;
      isMenuOpen.value = false;
      await scrollWindowToBottom();
      currentAbortController = new AbortController();
      try {
        const systemPrompt = chatHistory.value[0];
        const recentHistory = chatHistory.value.slice(-10);
        const optimizedPayload = [systemPrompt, ...recentHistory];
        const finalAiReply = await runAgent1Core(optimizedPayload);
        if (isLoading.value) {
          chatHistory.value.push({ role: "assistant", content: finalAiReply });
        }
      } catch (error) {
        console.error("Transmission breakdown handled:", error);
        if (isLoading.value) {
          chatHistory.value.push({
            role: "assistant",
            content: "Connection Error: BANANA core limits exceeded. Please wait a minute or clear history."
          });
        }
      } finally {
        isLoading.value = false;
        currentAbortController = null;
        await scrollWindowToBottom();
      }
    };
    const handleAbortTransmission = () => {
      if (currentAbortController) {
        currentAbortController.abort();
      }
      isLoading.value = false;
      chatHistory.value.push({
        role: "assistant",
        content: "_Generation stopped by Banana Admin._"
      });
    };
    const isSidebarOpen = ref(true);
    const searchQuery = ref("");
    const savedSessions = ref([]);
    const currentSessionIndex = ref(null);
    watch(savedSessions, (newSessions) => {
      localStorage.setItem("banana_saved_sessions", JSON.stringify(newSessions));
    }, { deep: true });
    watch(currentSessionIndex, (newIdx) => {
      localStorage.setItem("banana_current_session_index", JSON.stringify(newIdx));
    });
    const sortedAndFilteredChats = computed(() => {
      const mappedSessions = savedSessions.value.map((chat, idx) => ({
        ...chat,
        originalIndex: idx,
        // Use an existing timestamp property, or default to item positioning sequence
        updatedAt: chat.updatedAt || Date.now() - idx
      }));
      const sorted = mappedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
      if (!searchQuery.value.trim()) return sorted;
      return sorted.filter(
        (chat) => chat.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ChatInput = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app-container" }, _attrs))} data-v-d856a0be><aside class="${ssrRenderClass([{ "sidebar-collapsed": !isSidebarOpen.value }, "sidebar"])}" data-v-d856a0be><div class="sidebar-top" data-v-d856a0be><div class="sidebar-header" data-v-d856a0be><button class="toggle-sidebar-btn" data-v-d856a0be><span data-v-d856a0be>${ssrInterpolate(isSidebarOpen.value ? "\u25C0" : "\u25B6")}</span></button>`);
      if (isSidebarOpen.value) {
        _push(`<button class="new-chat-btn-header" data-v-d856a0be><span data-v-d856a0be>\u270E New Chat</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isSidebarOpen.value) {
        _push(`<div class="sidebar-body" data-v-d856a0be><div class="search-box" data-v-d856a0be><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Search Chats..." class="search-input" data-v-d856a0be></div><div class="recents-section" data-v-d856a0be><div class="recents-title" data-v-d856a0be>Recents</div><div class="recents-scrollbar-container" data-v-d856a0be><ul class="chat-list" data-v-d856a0be><!--[-->`);
        ssrRenderList(sortedAndFilteredChats.value, (chat) => {
          _push(`<li class="${ssrRenderClass([{ "active-session": currentSessionIndex.value === chat.originalIndex }, "chat-item"])}" data-v-d856a0be><span class="chat-title-text" data-v-d856a0be>${ssrInterpolate(chat.title)}</span></li>`);
        });
        _push(`<!--]--></ul></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isSidebarOpen.value) {
        _push(`<div class="sidebar-bottom" data-v-d856a0be><button class="banana-features-btn" data-v-d856a0be><span data-v-d856a0be>[*] BANANA Features</span></button><div class="user-profile" data-v-d856a0be><div class="avatar" data-v-d856a0be>BA</div><div class="user-info" data-v-d856a0be><div class="username" data-v-d856a0be>Banana Admin</div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</aside><main class="main-workspace" data-v-d856a0be><header class="top-header" data-v-d856a0be><h1 class="platform-title" data-v-d856a0be>BANANA <span class="version-tag" data-v-d856a0be>v2.0</span></h1></header><div class="chat-log-window" data-v-d856a0be>`);
      if (visibleMessages.value.length === 0) {
        _push(`<div class="empty-state-hero" data-v-d856a0be><h2 data-v-d856a0be>What&#39;s on the agenda today?</h2></div>`);
      } else {
        _push(`<div class="message-list" data-v-d856a0be><!--[-->`);
        ssrRenderList(visibleMessages.value, (msg, index2) => {
          _push(`<div class="${ssrRenderClass(["message-card", msg.role])}" data-v-d856a0be><div class="sender-label" data-v-d856a0be>`);
          if (msg.role === "user") {
            _push(`<span class="avatar-small user-avatar" data-v-d856a0be>BA</span>`);
          } else {
            _push(`<span class="avatar-small ai-avatar" data-v-d856a0be>\u{1F34C}</span>`);
          }
          _push(` ${ssrInterpolate(msg.role === "user" ? "Banana Admin" : "BANANA Core")}</div><div class="response-text-block" data-v-d856a0be><!--[-->`);
          ssrRenderList(msg.content.split("\n"), (paragraph, pIdx) => {
            _push(`<p data-v-d856a0be>${ssrInterpolate(paragraph)}</p>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]-->`);
        if (isLoading.value) {
          _push(`<div class="message-card assistant loading" data-v-d856a0be><div class="sender-label" data-v-d856a0be><span class="avatar-small ai-avatar" data-v-d856a0be>\u{1F34C}</span> BANANA Core </div><div class="response-text-block status" data-v-d856a0be>Analyzing request...</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
      if (!isSidebarOpen.value) {
        _push(`<button class="tooltip-btn floating-open-btn" data-v-d856a0be> [+] <span class="tooltip" data-v-d856a0be>Open Sidebar</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<footer class="footer-input-tray" data-v-d856a0be><div class="chat-input-container" data-v-d856a0be>`);
      _push(ssrRenderComponent(_component_ChatInput, {
        modelValue: userInput.value,
        "onUpdate:modelValue": ($event) => userInput.value = $event,
        "is-loading": isLoading.value,
        onSubmit: submitMessage,
        onStop: handleAbortTransmission
      }, null, _parent));
      _push(`</div></footer></main></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d856a0be"]]);

export { index as default };
//# sourceMappingURL=index-DiQZCRlG.mjs.map
