<script setup>
import { createInput, FormKit } from "@formkit/vue";
import PluginLinks from "./PluginLinks.vue";
const input = createInput(PluginLinks);
</script>
<template>
  <FormKit :type="input" name="plugin_links" :keep="true" label="选择插件友情链接" help="只展示勾选的链接；未选择时隐藏页脚友链区。" />
</template>
