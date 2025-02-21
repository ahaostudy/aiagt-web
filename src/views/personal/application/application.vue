<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { getAppAPI, updateAppAPI } from '@/api/app'
import { reactive, ref, watch, computed } from 'vue'
import { App } from '@/models/app'
import AppView from '@v/chat/chat.vue'
import { listPluginByToolsAPI } from '@/api/plugin'
import AiList from '@c/ai-list/ai-list.vue'
import SideListItem from '@v/personal/application/components/side-list-item.vue'
import AiButton from '@c/ai-button/ai-button.vue'
import { Time } from '@/models/base'
import ConfigPlugins from '@v/personal/application/components/config-plugins.vue'
import { debounce } from '@arco-design/web-vue/es/_utils/debounce'
import { useApplicationStore } from '@/store/application.ts'
import { deepClone } from '@/utils/clone.ts'
import { useModelStore } from '@/store/model.ts'
import ConfigModel from '@v/personal/application/components/config-model.vue'
import PluginsInner from '@v/personal/application/components/plugins-inner.vue'
import ConfigBasic from '@v/personal/application/components/config-basic.vue'
import { asset } from '@/models/assets'
import AiSpin from '@c/ai-spin/ai-spin.vue'

const route = useRoute()
const router = useRouter()

const id = String(route.params.id)
const app = reactive({} as App)
const appStore = useApplicationStore()

// auto save
const autoSavedAt = ref<Date>()

const autoSave = debounce(() => {
  console.log('Auto-saved:', appStore.inputAppInfo)

  updateAppAPI({
    id: id,
    name: appStore.inputAppInfo.name,
    description: appStore.inputAppInfo.description,
    description_md: appStore.inputAppInfo.description_md,
    model_id: appStore.inputAppInfo.model_id,
    enable_image: appStore.inputAppInfo.enable_image,
    enable_file: appStore.inputAppInfo.enable_file,
    version: appStore.inputAppInfo.version,
    is_private: appStore.inputAppInfo.is_private,
    home_page: appStore.inputAppInfo.home_page,
    preset_questions: appStore.inputAppInfo.preset_questions,
    tool_ids: appStore.inputAppInfo.tool_ids,
    logo: appStore.inputAppInfo.logo,
    label_ids: appStore.inputAppInfo.label_ids,
    label_texts: appStore.inputAppInfo.label_texts,
    model_config: appStore.inputAppInfo.model_config
  }).then(() => {
    init()
    autoSavedAt.value = new Date()
  })
}, 3000)

watch(appStore.inputAppInfo, () => {
  if (appStore.inputAppInfoInit) {
    appStore.inputAppInfoInit = false
    return
  }

  autoSave()
}, { deep: true })

// model info
const modelStore = useModelStore()

const model = computed(() => {
  return modelStore.getModel(appStore.inputAppInfo.model_id || app.model_id)
})

// init
async function init() {
  const getAppResp = await getAppAPI(id)

  Object.assign(app, getAppResp.app)
  if (!getAppResp.app.tools) app.tools = []
  document.title = `${app.name} - App - Aiagt`

  const appCopy = deepClone(app)
  appStore.initInputAppInfo(appCopy)
  await appStore.initAppLabels()


  if (app.tools?.length) {
    const getPluginsResp = await listPluginByToolsAPI({ tool_ids: app.tool_ids })

    const pluginMap = new Map(getPluginsResp.plugins.map(plugin => [plugin.id, plugin]))
    for (const tool of app.tools) {
      tool.plugin = pluginMap.get(tool.plugin_id)
    }
  }

  updatePreviewScroll()
}

const loading = ref(true)
init().then(_ => {
  loading.value = false
})

const focusedTab = ref('')
const previewScrollVal = ref(0)

function updatePreviewScroll() {
  previewScrollVal.value = Date.now()
}
</script>

<template>
  <ai-spin :loading="loading" class="h-screen" dot>
    <div class="flex w-screen">
      <div class="w-[18%] min-w-72 bg-[#f9f9f9] border-r flex flex-col justify-between h-screen">

        <div class="overflow-y-auto">

          <!-- app basic info -->
          <div class="flex items-start p-2 pl-1 border-b">
            <ai-button
              type="text"
              class="!px-1.5 !py-1.5 !mt-2 rounded-lg hover:!bg-[#eeeeee]"
              @click="router.push({path: '/personal/application'})"
            >
              <icon-left :size="16" stroke-linejoin="round" stroke-linecap="round" />
            </ai-button>
            <a-trigger position="rt" trigger="click" :unmount-on-close="false" :popup-translate="[15, 0]">
              <div class="flex flex-col gap-2 flex-1 rounded-xl px-3 py-2 hover:bg-[#eeeeee] cursor-pointer">
                <div class="flex gap-2 items-center">
                  <img :src="asset(app.logo)" :alt="app.name" class="w-12 rounded-lg bg-white">
                  <div class="flex flex-col gap-1">
                    <div class="font-medium text-lg !text-[16px] text-black flex items-center">
                      {{ app.name }}
                    </div>
                    <div class="text-xs !text-[10px]">
                      {{ `Updated at ${new Time(app.updated_at).string()}` }}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-500">
                  {{ app.description }}
                </div>
                <div class="flex flex-wrap gap-1">
                  <div class="app-info-tag !text-[9px] border-gray-300 !bg-gray-100">
                    {{ app.is_private ? 'Private' : 'Public' }}
                  </div>
                </div>
                <div class="flex flex-wrap gap-1">
                  <div
                    v-for="label of app.labels"
                    class="app-info-tag border-gray-200"
                  >
                    {{ label.text }}
                  </div>
                </div>
              </div>
              <template #content>
                <config-basic />
              </template>
            </a-trigger>
          </div>

          <!-- model configuration -->
          <div class="config-group-title">
            Model
          </div>
          <div class="px-2 py-3">
            <div
              class="flex justify-between items-center py-2 px-3 rounded-lg border-[0.5px] border-gray-300 bg-[#f4f4f4] hover:bg-#efefef] text-black text-xs !text-[11px] cursor-pointer"
              @click="focusedTab='model'"
            >
              <div class="flex gap-2">
                <img :src="asset(model.logo)" :alt="model.name" class="w-4 fill-blue-500">
                {{ model.name }}
              </div>
              <div class="py-0.5 px-1.5 rounded-[0.25rem] bg-white text-[9px] whitespace-nowrap text-gray-600">
                {{ `${model.input_price} | ${model.output_price}` }}
              </div>
            </div>
          </div>

          <!-- app functionally configuration -->
          <div class="config-group-title">
            Functionally
          </div>
          <ai-list class="!rounded-[0] !bg-transparent">
            <side-list-item default-show-inner @click="focusedTab='plugins'">
              Plugins
              <template #inner>
                <plugins-inner :tools="app.tools" />
              </template>
            </side-list-item>
            <side-list-item disabled>
              Workflows
            </side-list-item>
            <side-list-item disabled>
              Knowledge
            </side-list-item>
            <side-list-item disabled>
              Variables
            </side-list-item>
            <side-list-item disabled>
              Voices
            </side-list-item>
          </ai-list>

          <!-- app view configuration -->
          <div class="config-group-title">
            View
          </div>
          <ai-list class="!rounded-[0] !bg-transparent">
            <side-list-item disabled>
              Background Image
            </side-list-item>
            <side-list-item disabled>
              Preset Questions
            </side-list-item>
          </ai-list>

        </div>

        <!-- Preview -->
        <div class="px-2 py-3">
          <div
            class="px-2 py-2 rounded-lg  bg-[#e9edf8] border-[#c9d5f6] border-[0.5px] text-blue-600 font-medium text-[13px] flex justify-center items-center gap-1"
            @click="focusedTab='preview'; updatePreviewScroll()"
          >
            <icon-command :stroke-width="5" />
            Preview
          </div>
        </div>
      </div>

      <div class="bg-white border-r flex-1">
        <config-plugins v-show="focusedTab === 'plugins'" />
        <config-model v-show="focusedTab === 'model'" />
        <app-view dev :app="app" :scrollBy="previewScrollVal" v-show="focusedTab === '' || focusedTab === 'preview'" />
      </div>

    </div>
  </ai-spin>
</template>

<style scoped>
.config-group-title {
  @apply text-gray-500 font-medium px-4 pt-4;
}

.app-info-tag {
  @apply text-[10px] text-gray-600 px-1 py-0 rounded-sm bg-white border-[0.5px];
  line-height: 1rem;
}
</style>