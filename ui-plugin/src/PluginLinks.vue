<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({ context: { type: Object, required: true } });
const state = ref("loading");
const error = ref("");
const links = ref([]);
const groups = ref([]);
const keyword = ref("");
let controller;
const selected = computed(() => Array.isArray(props.context._value) ? props.context._value : []);
const groupNames = computed(() => new Map(groups.value.map(group => [group.metadata.name, group.spec.displayName])));
const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return links.value.filter(link => [link.spec.displayName, link.spec.url, groupLabel(link)].some(text => text.toLowerCase().includes(q)));
});
const missing = computed(() => selected.value.filter(name => !links.value.some(link => link.metadata.name === name)));
function groupLabel(link) { return groupNames.value.get(link.spec.groupName) || "未分组"; }
function select(name, checked) {
  if (props.context.disabled) return;
  props.context.node.input(checked ? [...new Set([...selected.value, name])] : selected.value.filter(item => item !== name));
}
async function read(path, signal) {
  const response = await fetch(path, { credentials: "same-origin", signal, headers: { Accept: "application/json" } });
  if (!response.ok) {
    const e = new Error(response.status === 403 ? "没有读取链接插件的权限，请联系管理员。" : "读取失败，请检查插件状态后重试。");
    e.status = response.status;
    throw e;
  }
  return response.json();
}
async function list(path, signal) {
  const items = [];
  let page = 1;
  while (true) {
    const data = await read(`${path}?page=${page}&size=100&sort=spec.priority,asc`, signal);
    items.push(...(data.items || []));
    if (!data.hasNext && items.length >= (data.total || 0)) break;
    if (!data.items?.length) break;
    page++;
  }
  return items;
}
async function refresh() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  state.value = "loading";
  error.value = "";
  try {
    const data = await read("/apis/plugin.halo.run/v1alpha1/plugins?fieldSelector=metadata.name%3DPluginLinks", current.signal);
    const plugin = data.items?.find(item => item.metadata.name === "PluginLinks");
    if (!plugin) { state.value = "missing"; return; }
    if (!plugin.spec.enabled || plugin.status?.phase !== "STARTED") { state.value = "disabled"; return; }
    const result = await Promise.all([
      list("/apis/core.halo.run/v1alpha1/links", current.signal),
      list("/apis/core.halo.run/v1alpha1/linkgroups", current.signal),
    ]);
    if (current.signal.aborted) return;
    links.value = result[0].filter(link => !link.metadata.deletionTimestamp);
    groups.value = result[1].filter(group => !group.metadata.deletionTimestamp);
    state.value = "ready";
  } catch (e) {
    if (current.signal.aborted) return;
    error.value = e.message;
    state.value = "error";
  }
}
onMounted(refresh);
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <section class="s4a-links" aria-label="插件友情链接选择" :aria-busy="state === 'loading'">
    <div class="s4a-links-toolbar">
      <a v-if="state === 'ready'" href="/console/links" target="_blank" rel="noopener">管理插件链接 ↗</a>
      <a v-else href="/console/plugins" target="_blank" rel="noopener">前往插件管理 ↗</a>
      <button type="button" :disabled="state === 'loading'" @click="refresh">刷新插件状态</button>
    </div>
    <p v-if="state === 'loading'" role="status">正在检查链接插件…</p>
    <div v-else-if="state === 'missing'" class="s4a-links-notice" role="status">
      <strong>尚未安装 Halo 链接管理插件</strong>
      <p>请先在插件管理中安装并启用“链接”（PluginLinks），再刷新这里选择友链。</p>
    </div>
    <div v-else-if="state === 'disabled'" class="s4a-links-notice" role="status">
      <strong>链接插件尚未启用或未运行</strong>
      <p>请在插件管理中启用“链接”，待运行成功后刷新这里。</p>
    </div>
    <div v-else-if="state === 'error'" class="s4a-links-notice" role="alert">{{ error }}</div>
    <template v-else>
      <p>勾选要放在页脚的友链，完成后点击页面下方的“保存”。名称、网址和分组由插件统一管理。</p>
      <p v-if="!links.length" class="s4a-links-notice">插件中还没有链接，请先前往链接管理添加，再刷新这里。</p>
      <template v-else>
        <div class="s4a-links-search">
          <input v-model="keyword" type="search" aria-label="搜索插件友链" placeholder="搜索名称、网址或分组" />
          <span>已选 {{ selected.length }} / {{ links.length }}</span>
        </div>
        <div class="s4a-links-list">
          <label v-for="link in filtered" :key="link.metadata.name" class="s4a-link-row">
            <input type="checkbox" :checked="selected.includes(link.metadata.name)" :disabled="context.disabled" :aria-label="`在页脚显示 ${link.spec.displayName}`" @change="select(link.metadata.name, $event.target.checked)" />
            <span class="s4a-link-copy"><strong>{{ link.spec.displayName }}</strong><span>{{ link.spec.url }}</span></span>
            <span class="s4a-link-group">{{ groupLabel(link) }}</span>
          </label>
          <p v-if="!filtered.length">没有匹配的链接。</p>
        </div>
      </template>
      <div v-if="missing.length" class="s4a-links-notice">
        <p>有 {{ missing.length }} 个已选链接已在插件中删除，前台会自动忽略。</p>
        <button type="button" :disabled="context.disabled" @click="context.node.input(selected.filter(name => !missing.includes(name)))">移除失效选择</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.s4a-links{width:100%;max-width:860px;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:10px;padding:18px;background:#fff;font-size:13px;line-height:1.6;color:#334155}
.s4a-links-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.s4a-links a{color:#176d47;text-decoration:underline;text-underline-offset:3px}
.s4a-links button{border:1px solid #cbd5e1;border-radius:5px;background:#fff;padding:5px 10px;cursor:pointer;color:#334155}
.s4a-links button:disabled{opacity:.5;cursor:default}
.s4a-links p{margin:6px 0 12px}
.s4a-links-notice{padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}
.s4a-links-notice p{margin:4px 0 0}
.s4a-links-search{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0 10px}
.s4a-links-search input{flex:1;min-width:180px;border:1px solid #cbd5e1;border-radius:5px;padding:8px 10px}
.s4a-links-list{max-height:400px;overflow:auto;border:1px solid #e2e8f0;border-radius:6px}
.s4a-link-row{display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;border-bottom:1px solid #eef2f6}
.s4a-link-row:last-child{border-bottom:0}
.s4a-link-row>input{flex:none;accent-color:#176d47;width:16px;height:16px}
.s4a-link-copy{flex:1;min-width:0;display:flex;flex-direction:column;overflow-wrap:anywhere}
.s4a-link-copy>span{font-size:12px;color:#64748b}
.s4a-link-group{flex:none;font-size:12px;border-radius:4px;background:#f1f5f9;padding:2px 7px}
@media(max-width:580px){.s4a-link-row{flex-wrap:wrap}.s4a-link-group{margin-left:28px}.s4a-links{padding:12px}}
</style>
