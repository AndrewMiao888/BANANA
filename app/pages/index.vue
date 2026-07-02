<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
    <aside class="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div class="flex flex-col h-full overflow-hidden">
        <div class="flex items-center justify-between mb-6 px-2">
          <div class="flex items-center space-x-3">
            <div class="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center font-bold text-slate-950 text-lg">??</div>
            <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">BANANA Engine</h1>
          </div>
        </div>
        <button @click="createNewChat" class="w-full mb-4 py-2.5 px-4 rounded-xl font-medium text-sm bg-yellow-500 hover:bg-yellow-400 text-slate-950 border border-transparent shadow-lg shadow-yellow-950/20 transition-all flex items-center justify-center space-x-2 shrink-0">
          <span>+ New Workspace Node</span>
        </button>
        <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <div v-for="chat in chatSessions" :key="chat.id" class="group w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer" :class="currentChatId === chat.id ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/40'" @click="switchChat(chat.id)">
            <span class="text-xs font-mono truncate block font-medium">{{ chat.title }}</span>
            <button @click.stop="deleteChat(chat.id)" class="p-1 text-slate-500 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">???</button>
          </div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">Engine Cluster: BANANA Autonomous Core</div>
    </aside>
    <main class="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <header class="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-sm shrink-0">
        <div class="flex items-center space-x-4 text-sm font-mono text-slate-400">
          <div>Engine: <span class="text-yellow-400">{{ activeMetadata.engine }}</span></div>
          <div class="hidden sm:block text-slate-700">|</div>
          <div class="hidden sm:block">Source: <span class="text-amber-400">{{ activeMetadata.source }}</span></div>
        </div>
        <div v-if="activeMetadata.confidence" class="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">{{ activeMetadata.confidence }}</div>
      </header>
      <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="chatContainer">
        <div v-if="getCurrentMessages().length === 0" class="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
          <div class="text-4xl mb-2">??</div>
          <h3 class="font-mono text-sm">BANANA Neural Logic Processing Active</h3>
        </div>
        <div v-for="(msg, idx) in getCurrentMessages()" :key="idx" class="flex flex-col max-w-3xl mx-auto p-4 rounded-xl border font-mono text-sm leading-relaxed whitespace-pre-wrap" :class="msg.role === 'user' ? 'bg-slate-900/60 border-slate-800/80 ml-12 text-slate-200' : 'bg-yellow-950/10 border-yellow-900/20 mr-12 text-yellow-100'">
          <div class="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-40">{{ msg.role === 'user' ? 'Client Request' : 'Neural Matrix Response' }}</div>
          <div>{{ msg.text }}</div>
        </div>
      </div>
      <footer class="p-4 md:p-6 bg-gradient-to-t from-slate-950 to-transparent shrink-0">
        <form @submit.prevent="runQuery" class="max-w-3xl mx-auto relative rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 flex items-center">
          <input v-model="userPrompt" type="text" placeholder="Type word parameters..." :disabled="isGenerating" class="w-full bg-transparent px-4 py-2.5 text-sm text-slate-100 focus:outline-none" />
          <button type="submit" :disabled="!userPrompt.trim() || isGenerating" class="h-9 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-30">
            <span>{{ isGenerating ? 'Computing...' : 'Run Query' }}</span>
          </button>
        </form>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue';
const userPrompt = ref('');
const isGenerating = ref(false);
const chatContainer = ref(null);
const chatSessions = ref([]);
const currentChatId = ref('');
const activeMetadata = reactive({ engine: 'BANANA Active', source: 'Linguistic Layer', confidence: 'Ready' });

onMounted(() => {
  const saved = localStorage.getItem('banana_sessions');
  if (saved) {
    chatSessions.value = JSON.parse(saved);
    if (chatSessions.value.length > 0) currentChatId.value = chatSessions.value[0].id;
  } else { createNewChat(); }
  updateHeaderMetadata();
});
const createNewChat = () => {
  const id = 'chat_' + Date.now();
  chatSessions.value.unshift({ id, title: 'New Terminal Node', messages: [], metadata: { engine: 'BANANA Core', source: 'Linguistic Layer', confidence: '100%' } });
  currentChatId.value = id;
  localStorage.setItem('banana_sessions', JSON.stringify(chatSessions.value));
};
const switchChat = (id) => { currentChatId.value = id; updateHeaderMetadata(); scrollToBottom(); };
const deleteChat = (id) => {
  chatSessions.value = chatSessions.value.filter(c => c.id !== id);
  if (chatSessions.value.length === 0) createNewChat();
  else currentChatId.value = chatSessions.value[0].id;
  localStorage.setItem('banana_sessions', JSON.stringify(chatSessions.value));
  updateHeaderMetadata();
};
const getCurrentMessages = () => {
  const active = chatSessions.value.find(c => c.id === currentChatId.value);
  return active ? active.messages : [];
};
const updateHeaderMetadata = () => {
  const active = chatSessions.value.find(c => c.id === currentChatId.value);
  if (active) { activeMetadata.engine = active.metadata.engine; activeMetadata.source = active.metadata.source; activeMetadata.confidence = active.metadata.confidence; }
};
const scrollToBottom = async () => { await nextTick(); if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight; };
const runQuery = async () => {
  if (!userPrompt.value.trim() || isGenerating.value) return;
  const text = userPrompt.value.trim();
  userPrompt.value = '';
  isGenerating.value = true;
  const active = chatSessions.value.find(c => c.id === currentChatId.value);
  if (!active) return;
  active.messages.push({ role: 'user', text });
  if (active.title === 'New Terminal Node') active.title = text.substring(0, 20);
  await scrollToBottom();
  try {
    const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: text }) });
    const data = await response.json();
    active.metadata = { engine: data.engine, source: data.source, confidence: data.confidence };
    active.messages.push({ role: 'assistant', text: data.result });
    updateHeaderMetadata();
  } catch (err) { active.messages.push({ role: 'assistant', text: 'Pipeline communication error.' }); } finally { isGenerating.value = false; localStorage.setItem('banana_sessions', JSON.stringify(chatSessions.value)); await scrollToBottom(); }
};
</script>
