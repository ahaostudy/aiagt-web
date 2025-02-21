<script setup lang="ts">
import { listPluginAPI, listPluginLabelAPI } from '@/api/plugin'
import { ListPluginReq, Plugin, PluginLabel } from '@/models/plugin'
import { ref, reactive } from 'vue'
import ConfigPluginsPluginInfo from '@v/personal/application/components/config-plugins-plugin-info.vue'
import AiList from '@c/ai-list/ai-list.vue'
import AiListItem from '@c/ai-list/ai-list-item/ai-list-item.vue'
import { isEnterEvent } from '@/utils/event.ts'
import { useAuthStore } from '@/store/auth.ts'
import { asset } from '@/models/assets'
import AiSpin from '@c/ai-spin/ai-spin.vue'

const authStore = useAuthStore()

const plugins = reactive([] as Plugin[])
const pluginLabels = reactive([] as PluginLabel[])

const searchOptions = reactive({} as ListPluginReq)
const loadingPlugins = ref(true)

async function searchPlugin() {
  if (!searchOptions.labels?.length)
    searchOptions.labels = undefined

  loadingPlugins.value = true

  try {
    const resp = await listPluginAPI(searchOptions)

    plugins.splice(0)
    plugins.push(...resp.plugins)

    if (plugins.length > 0) focusedPluginID.value = plugins[0].id
  } finally {
    loadingPlugins.value = false
  }
}

async function init() {
  await searchPlugin()

  const listPluginLabelResp = await listPluginLabelAPI({ pagination: { page_size: 10000 } })
  pluginLabels.push(...listPluginLabelResp.labels)
}

init()

const focusedPluginID = ref<BigInt>()
</script>

<template>
  <div id="config-plugins" class="flex min-w-[880px]">

    <div class="h-screen flex flex-col border-r w-[32%] min-w-[24rem] max-w-[36rem]">
      <div class="text-blue-600 font-medium px-3 pt-3 pb-1">
        Plugins
      </div>

      <ai-spin :loading="loadingPlugins">
        <ai-list v-if="plugins.length" class="overflow-y-auto !bg-transparent w-full">
          <ai-list-item
            v-for="plugin of plugins"
            :key="plugin.id.toString()"
            class="!px-2"
            :class="focusedPluginID !== plugin.id ? 'hover:!bg-gray-50' : ''"
            focus-class="!bg-gray-100"
            inner-class="!justify-start !py-2 text-gray-800"
            :focused="focusedPluginID === plugin.id"
            @click="focusedPluginID = plugin.id"
          >
            <div class="flex flex-col gap-2">
              <div class="flex gap-2 items-center">
                <img :src="asset(plugin.logo)" :alt="plugin.name" class="w-7 h-7 bg-white rounded-md border">
                <div class="font-medium truncate">{{ plugin.name }}</div>
              </div>
              <div class="text-[10px] text-wrap">{{ plugin.description }}</div>
              <div class="flex flex-wrap gap-1">
                <div
                  v-for="label in plugin.labels"
                  :key="label.id.toString()"
                  class="px-1 py-0 rounded-sm bg-gray-50 text-gray-600 text-xs !text-[10px]"
                >
                  {{ label.text }}
                </div>
              </div>
            </div>
          </ai-list-item>
        </ai-list>

        <div v-else class="p-4 h-full flex flex-col justify-center items-center gap-5 text-gray-400">
          <div class="text-xl">
            <icon-empty stroke-linejoin="round" stroke-linecap="round" />
          </div>
          No plugins
        </div>
      </ai-spin>
    </div>

    <div class="flex flex-col flex-1 h-screen min-w-[720px]">
      <div class="flex justify-between items-center border-b px-4 py-3">
        <div class="text-black font-medium">Search Plugins</div>
        <div class="flex gap-2 items-center">
          <div class="flex items-center bg-gray-100 gap-1 p-[0.175rem] rounded-lg">
            <div
              class="w-16 py-[0.165rem] rounded-md text-center text-xs cursor-pointer"
              :class="{'bg-white': !searchOptions.author_id}"
              @click="searchOptions.author_id = undefined; searchPlugin()"
            >
              All
            </div>
            <div
              class="w-20 py-[0.165rem] rounded-md text-center text-xs cursor-pointer"
              :class="{'bg-white': searchOptions.author_id}"
              @click="searchOptions.author_id = authStore.userinfo.id; searchPlugin()"
            >
              Personal
            </div>
          </div>
          <a-select
            multiple size="small"
            placeholder="Select labels"
            :max-tag-count="2"
            style="width: 220px"
            v-model="searchOptions.labels"
            @change="searchPlugin"
            @clear="searchPlugin"
            allow-clear
          >
            <a-option
              v-for="label of pluginLabels"
              :key="label.id.toString()"
              :value="label.id"
              class="config-plugin-label-option"
            >
              {{ label.text }}
            </a-option>
          </a-select>
          <a-input-search
            size="small"
            placeholder="Search plugin"
            style="width: 220px"
            v-model="searchOptions.name"
            @search="searchPlugin"
            @clear="searchPlugin"
            @keydown.enter="(e?: Event) => { if (isEnterEvent(e)) searchPlugin() }"
            allow-clear
          />
        </div>
      </div>
      <div class="px-1 py-4 h-full overflow-y-hidden">
        <config-plugins-plugin-info :plugin-id="focusedPluginID" />
      </div>
    </div>

  </div>
</template>

<style>
#config-plugins {
  .arco-input-wrapper, .arco-select-view {
    @apply !border-[0.5px] !my-[0.5px] !bg-[#f8f8f8] !py-[1px] !px-[0.5rem] !rounded-[0.425rem];
  }

  .arco-input-wrapper.arco-input-focus, .arco-select-view.arco-select-view-focus {
    @apply !my-0 !border;
  }

  .arco-input.arco-input-size-small {
    font-size: 12px !important;
    @apply !py-0.5;
  }

  .arco-select-view-input {
    font-size: 12px !important;
    min-height: unset !important;
  }

  .arco-select-view-inner {
    .arco-tag {
      @apply !text-[10px] !my-0;

      .arco-tag-close-btn {
        @apply scale-[80%];
      }
    }
  }
}

.config-plugin-label-option {
  font-size: 12px !important;
}


</style>