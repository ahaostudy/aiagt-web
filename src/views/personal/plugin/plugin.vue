<script setup lang="ts">
import {
  createPluginToolAPI,
  deletePluginToolAPI,
  getPluginByKey,
  listPluginLabelAPI,
  testPluginToolAPI,
  updatePluginAPI,
  updatePluginToolAPI
} from '@/api/plugin'
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive, ref, watch } from 'vue'
import { CreatePluginToolReq, Plugin, PluginLabel, PluginSecret, PluginTool } from '@/models/plugin'
import { Time } from '@/models/base'
import InputGroup from '@c/input-group/input-group.vue'
import Params from '@v/personal/plugin/components/params.vue'
import CollapseEditorTitle from '@v/personal/plugin/components/collapse-editor-title.vue'
import { Message } from '@arco-design/web-vue'
import Secrets from '@v/personal/plugin/components/secrets.vue'
import Modal from '@c/modal/modal.vue'
import IconInputGroup from '@v/personal/componets/icon-input-group.vue'
import { generateSchemaFromRaw, JSONSchema } from '@/utils/json_schema.ts'
import Editor from '@c/editor/editor.vue'
import { asset } from '@/models/assets'
import AiSpin from '@c/ai-spin/ai-spin.vue'

const route = useRoute()
const router = useRouter()

const plugin = reactive({} as Plugin)
const focusedToolIndex = ref(0)

const focusedTool = computed((): PluginTool | undefined => {
  if (
    typeof focusedToolIndex.value === 'undefined' ||
    focusedToolIndex.value < 0 ||
    !plugin.tools ||
    focusedToolIndex.value >= (plugin?.tools?.length || 0)
  ) return undefined

  return plugin.tools[focusedToolIndex.value]
})

const pluginConfig = reactive({
  info: {},
  secrets: {},
  labels: [] as PluginLabel[]
} as {
  allowEditPluginInfo: boolean
  allowEditPluginSecrets: boolean
  info: {
    id: number,
    name?: string,
    description?: string,
    home_page?: string,
    is_private?: boolean,
    label_values: (BigInt | string)[],
    label_ids?: BigInt[],
    label_texts?: string[],
    logo: string
  },
  secrets: {
    enable_secret: boolean,
    secrets: PluginSecret[]
  }
  labels: PluginLabel[]
})

function resetPluginInfo() {
  Object.assign(pluginConfig.info, plugin)
  pluginConfig.info.label_values = plugin.label_ids
}

function resetPluginSecrets() {
  Object.assign(pluginConfig.secrets, plugin)
}

async function savePluginInfo() {
  await updatePluginAPI({
    id: plugin.id,
    name: pluginConfig.info.name,
    description: pluginConfig.info.description,
    home_page: pluginConfig.info.home_page,
    is_private: pluginConfig.info.is_private,
    label_ids: pluginConfig.info.label_ids,
    label_texts: pluginConfig.info.label_texts,
    logo: pluginConfig.info.logo,

    secrets: plugin.secrets
  })

  await init()
  Message.success('save plugin info success')
}

async function savePluginSecret() {
  await updatePluginAPI({
    id: plugin.id,
    secrets: pluginConfig.secrets.secrets || [],
    enable_secret: pluginConfig.secrets.enable_secret
  })

  await init()
  Message.success('save plugin secrets success')
}

function changePluginLabel(value: any) {
  if (!value) return
  const labels = value as (BigInt | string)[]
  pluginConfig.info.label_ids = []
  pluginConfig.info.label_texts = []

  for (const label of labels) {
    switch (typeof label) {
      case 'string':
        pluginConfig.info.label_texts.push(label)
        break
      case 'bigint':
        pluginConfig.info.label_ids.push(label)
        break
      case 'number':
        pluginConfig.info.label_ids.push(label)
        break
    }
  }
}

const toolConfig = reactive({} as {
  allowEditToolInfo: boolean
  allowEditRequestParams: boolean
  allowEditResponseParams: boolean
  info: {
    name?: string;
    description?: string;
    api_url?: string;
  }
  request_type: string
  response_type: string
})

watch(focusedTool, () => {
  if (focusedTool.value) {
    toolConfig.info = {
      name: focusedTool.value.name,
      description: focusedTool.value.description,
      api_url: focusedTool.value.api_url
    }
    toolConfig.request_type = focusedTool.value.request_type
    toolConfig.response_type = focusedTool.value.response_type
  }
}, { immediate: true })

async function saveToolInfo() {
  if (!focusedTool.value) {
    Message.error('save tool info error, please select tool first.')
    return
  }

  await updatePluginToolAPI({
    id: focusedTool.value.id,
    name: toolConfig.info.name,
    description: toolConfig.info.description,
    api_url: toolConfig.info.api_url
  })

  await init()
  Message.success('save tool info success')
}

async function saveToolRequestParams() {
  if (!focusedTool.value) {
    Message.error('save tool request params error, please select tool first.')
    return
  }

  await updatePluginToolAPI({
    id: focusedTool.value.id,
    request_type: toolConfig.request_type
  })

  await init()
  Message.success('save tool request params success')
}

async function saveToolResponseParams() {
  if (!focusedTool.value) {
    Message.error('save tool response params error, please select tool first.')
    return
  }

  await updatePluginToolAPI({
    id: focusedTool.value.id,
    response_type: toolConfig.response_type
  })

  await init()
  Message.success('save tool response params success')
}

async function createPluginTool() {
  await createPluginToolAPI({
    plugin_id: plugin.id,
    name: `tool_${new Date().getTime()}`
  } as CreatePluginToolReq)

  await init()
  Message.success('create plugin tool success')

  if (!plugin.tools) return

  let latestToolIdx = 0
  for (let i = 0; i < plugin.tools.length; i++) {
    const tool = plugin.tools[i]
    const toolCreatedAt = tool?.created_at?.timestamp || 0
    const latestToolCreatedAt = plugin.tools[latestToolIdx]?.created_at?.timestamp || 0

    if (!toolCreatedAt || !latestToolCreatedAt) continue

    if (toolCreatedAt > latestToolCreatedAt) {
      latestToolIdx = i
    }
  }

  focusedToolIndex.value = latestToolIdx
}

async function deletePluginTool() {
  if (!focusedTool.value) {
    Message.error('test plugin tool error, please select tool first.')
    return
  }

  await deletePluginToolAPI(focusedTool.value.id)

  await init()
  focusedToolIndex.value = 0
  Message.success('delete plugin tool success')
}

const testPluginToolConfig = reactive<{
  modalVisible: boolean,
  requestBody: string,
  responseBody: string
}>({
  modalVisible: false,
  requestBody: '{}',
  responseBody: '{}'
})

function autoGenerate() {
  const requestType = focusedTool.value?.request_type
  const result = generateSchemaFromRaw(requestType)
  if (result) testPluginToolConfig.requestBody = result
}

function jsonFormat(raw: string): string {
  try {
    const data = JSON.parse(raw)
    return JSON.stringify(data, null, 2)
  } catch (_) {
    return raw
  }
}

function updateSchema(schema: JSONSchema, type: 'req' | 'resp') {
  if (!focusedTool.value) return

  switch (type) {
    case 'req':
      focusedTool.value.request_type = btoa(JSON.stringify(schema))
      break
    case 'resp':
      focusedTool.value.response_type = btoa(JSON.stringify(schema))
      break
  }
}

async function testPluginTool() {
  if (!focusedTool.value) {
    Message.error('test plugin tool error, please select tool first.')
    return
  }

  const resp = await testPluginToolAPI({
    plugin_id: plugin.id,
    tool_id: focusedTool.value?.id,
    request: btoa(String.fromCharCode(...new TextEncoder().encode(testPluginToolConfig.requestBody)))
  })

  testPluginToolConfig.responseBody = atob(resp.response)
  await init()

  if (resp.code !== 0) {
    Message.error(resp.msg)
    testPluginToolConfig.responseBody = `/**\n * HTTP STATUS CODE: ${
      resp.http_code
    }\n * ${
      resp.msg.replace('\n', '\n * ')
    }\n */\n\n${
      testPluginToolConfig.responseBody
    }`
  } else {
    Message.success(`test plugin tool success`)
  }
}

function back() {
  router.push('/personal/plugin')
}

async function init() {
  if (typeof route.params.key !== 'string') {
    return
  }

  const getPluginResp = await getPluginByKey({ key: route.params.key })
  plugin.tools = undefined
  Object.assign(plugin, getPluginResp)
  resetPluginInfo()
  resetPluginSecrets()

  document.title = `${plugin.name} - Plugin -Aiagt`

  const listPluginLabelResp = await listPluginLabelAPI({ pagination: { page_size: 10000 } })
  pluginConfig.labels = listPluginLabelResp.labels
}

const loading = ref(true)
init().then(() => {
  loading.value = false
})
</script>

<template>
  <ai-spin :loading class="h-screen" dot>
    <div class="flex w-full h-screen bg-[#fafbfd]" id="plugin">

      <!-- Left - Plugin info -->
      <div class="p-4 bg-[#f7f8fa] border-r border-gray-100 min-w-[360px] w-[20%] flex flex-col gap-9">
        <div class="flex items-center gap-2">
          <div
            class="inline-block rounded-xl p-2 cursor-pointer hover:bg-white active:bg-gray-200 transition duration-300"
            @click="back()"
          >
            <icon-left :size="20" class="!text-gray-600" stroke-linejoin="round" stroke-linecap="round" />
          </div>
          <div
            class="inline-flex gap-2 items-center">
            <img
              class="w-9 h-9 rounded-lg"
              :src="asset(plugin.logo)"
              :alt="plugin.name"
            >
            <div class="flex flex-col gap-1 pr-1">
              <div class="text-[16px] font-medium text-black">{{ plugin.name }}</div>
              <div class="text-[10px] text-gray-400 scale-90 origin-bottom-left">
                {{ new Time(plugin.updated_at).string() }}
              </div>
            </div>
          </div>
        </div>

        <a-collapse class="!overflow-y-auto scrollbar-hide" :default-active-key="[1, 2]" :bordered="false">
          <a-collapse-item :key="1">
            <template #header>
              <collapse-editor-title
                title="Plugin Info"
                v-model:allow-edit="pluginConfig.allowEditPluginInfo"
                @cancel="resetPluginInfo"
                @save="savePluginInfo"
              />
            </template>
            <div class="flex flex-col gap-4" :class="{'editable': pluginConfig.allowEditPluginInfo}">
              <icon-input-group
                v-if="pluginConfig.allowEditPluginInfo"
                type="plugin_logo"
                image-size="3.75rem"
                v-model="pluginConfig.info.logo"
                title-class="text-xs"
                inner-class="!border-gray-[#f0f1f3] !rounded-xl"
              />
              <input-group
                name="Name"
                placeholder="Please enter plugin name"
                class="gap-3"
                title-class="text-xs font-normal"
                v-model="pluginConfig.info.name"
                :max-length="32"
                :show-word-limit="pluginConfig.allowEditPluginInfo"
                required
                :disabled="!pluginConfig.allowEditPluginInfo"
              />
              <input-group
                name="Description"
                placeholder="Please enter plugin description"
                class="gap-3"
                title-class="text-xs font-normal"
                v-model="pluginConfig.info.description"
                type="textarea"
                :max-length="200"
                :show-word-limit="pluginConfig.allowEditPluginInfo"
                :auto-size="{ minRows: 3, maxRows: 5 }"
                :disabled="!pluginConfig.allowEditPluginInfo"
              />
              <input-group
                name="Home page"
                placeholder="Please enter plugin home page"
                class="gap-3"
                title-class="text-xs font-normal"
                v-model="pluginConfig.info.home_page"
                :disabled="!pluginConfig.allowEditPluginInfo"
              />
              <input-group
                name="Private"
                direction="horizontal"
                title-class="text-xs font-normal"
              >
                <div>
                  <a-switch
                    v-model="pluginConfig.info.is_private"
                    :disabled="!pluginConfig.allowEditPluginInfo"
                  />
                </div>
              </input-group>
              <input-group
                name="Labels"
                placeholder="Please select plugin labels"
                class="gap-3"
                title-class="text-xs font-normal"
              >
                <a-select
                  :disabled="!pluginConfig.allowEditPluginInfo"
                  placeholder="Please select plugin labels"
                  v-model="pluginConfig.info.label_values"
                  @change="changePluginLabel"
                  multiple
                  allow-create
                  allow-search
                >
                  <a-option
                    v-for="label of pluginConfig.labels"
                    :key="label.id"
                    :value="label.id"
                  >
                    {{ label.text }}
                  </a-option>
                </a-select>
              </input-group>
            </div>
          </a-collapse-item>
          <div class="py-3" />
          <a-collapse-item :key="2">
            <template #header>
              <collapse-editor-title
                title="Plugin Secrets"
                v-model:allow-edit="pluginConfig.allowEditPluginSecrets"
                fixed-state="edit"
              />
            </template>
            <div class="flex flex-col gap-4" :class="{'editable': pluginConfig.allowEditPluginSecrets}">
              <input-group
                name="Enable secret"
                direction="horizontal"
                title-class="text-xs font-normal"
                disabled
              >
                <div>
                  <a-switch v-model="plugin.enable_secret" disabled />
                </div>
              </input-group>
              <input-group
                name="Secrets"
                placeholder="Please enter plugin secrets"
                class="gap-3"
                title-class="text-xs font-normal"
              >
                <secrets :secrets="plugin.secrets" />
              </input-group>
            </div>
          </a-collapse-item>
        </a-collapse>

      </div>


      <!-- Body - Tool list -->
      <div class="p-3 min-w-[240px]">
        <div class="border rounded-2xl h-full p-4 flex flex-col justify-between bg-white">
          <div class="flex-1 flex flex-col gap-3">
            <div class="text-lg text-black font-medium pl-1 py-2">Tool List</div>
            <div v-if="plugin.tools?.length" class="flex flex-col gap-4">
              <div
                v-for="(tool, index) of plugin.tools"
                :key="tool.id.toString()"
                class="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition duration-300"
                :class="{ '!bg-gray-100': focusedToolIndex === index }"
                @click="focusedToolIndex = index"
              >
                <icon-check-circle
                  style="font-size: 20px"
                  :style="{color: tool.tested_at ? 'green !important' : 'gray'}"
                />
                <div class="flex flex-col gap-0.5">
                  <div
                    class="text-gray-500 text-xs"
                    :class="{'!text-gray-900 !font-medium': focusedToolIndex === index}"
                  >
                    {{ tool.name }}
                  </div>
                  <div
                    class="origin-bottom-left scale-90 text-xs text-gray-400 max-w-40 overflow-hidden whitespace-nowrap overflow-ellipsis"
                    :class="{'!text-gray-800': focusedToolIndex === index}"
                    v-if="tool.description?.length"
                  >
                    {{ tool.description }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="flex-1 flex justify-center items-center">
              <a-empty />
            </div>
          </div>
          <button
            class="bg-blue-700 text-white p-2.5 rounded-lg hover:bg-blue-600 active:bg-blue-800"
            @click="createPluginTool"
          >
            <icon-plus />
            Create Tool
          </button>
        </div>
      </div>

      <!-- Right - Tool info -->
      <div class="flex-1 py-4 pr-2 overflow-y-auto min-w-96 bg-[#fafbfd]" id="plugin-tool-content">
        <div v-if="focusedTool" class="flex flex-col pt-3">
          <div class="flex items-center justify-between pr-[13px]">
            <div class="text-lg text-black font-medium flex gap-1 items-center">
              {{ focusedTool.name }}
              <icon-check-circle-fill
                :stroke-width="5"
                class="text-[15px] !text-gray-400"
                :class="{'!text-green-600': focusedTool.tested_at}"
              />
              <div class="text-xs text-gray-500" v-if="focusedTool.tested_at">
                tested on {{ new Time(focusedTool.tested_at).string() }}
              </div>
            </div>
            <div class="flex gap-2">
              <a-popconfirm
                content="Are you sure you want to delete?"
                @ok="deletePluginTool"
              >
                <button
                  class="py-1.5 px-2.5 flex justify-center items-center gap-2 rounded-lg bg-white !text-xs !text-gray-500 border border-gray-100 font-medium hover:bg-gray-100 active:bg-gray-300 transition"
                >
                  <icon-delete stroke-linejoin="round" stroke-linecap="round" />
                  Delete
                </button>
              </a-popconfirm>
              <button
                class="py-1 px-3.5 flex justify-center items-center gap-1 rounded-lg bg-blue-700 text-xs text-white font-bold hover:bg-blue-600 active:bg-blue-800 transition"
                @click="testPluginToolConfig.modalVisible=true"
              >
                <icon-play-arrow :stroke-width="5" stroke-linejoin="round" stroke-linecap="round" class="text-[15px]" />
                Test
              </button>
            </div>
          </div>
          <div class="border-b my-3" />

          <a-collapse :default-active-key="[1, 2, 3]" :bordered="false">
            <a-collapse-item :key="1">
              <template #header>
                <collapse-editor-title
                  v-model:allow-edit="toolConfig.allowEditToolInfo"
                  title="Tool Info"
                  @save="saveToolInfo"
                />
              </template>
              <div class="flex flex-col gap-4" :class="{'editable': toolConfig.allowEditToolInfo}">
                <input-group
                  name="Name"
                  placeholder="Please enter plugin name"
                  class="gap-3"
                  title-class="text-xs font-normal"
                  v-model="toolConfig.info.name"
                  :max-length="32"
                  show-word-limit
                  required
                  :disabled="!toolConfig.allowEditToolInfo"
                />
                <input-group
                  name="Description"
                  placeholder="Please enter plugin description"
                  class="gap-3"
                  title-class="text-xs font-normal"
                  v-model="toolConfig.info.description"
                  type="textarea"
                  :max-length="200"
                  show-word-limit
                  :auto-size="{ minRows: 3, maxRows: 5 }"
                  :disabled="!toolConfig.allowEditToolInfo"
                />
                <input-group
                  name="API URL"
                  placeholder="Please enter api url"
                  class="gap-3"
                  title-class="text-xs font-normal"
                  v-model="toolConfig.info.api_url"
                  required
                  :disabled="!toolConfig.allowEditToolInfo"
                />
              </div>
            </a-collapse-item>

            <div class="border-b pt-3" />
            <div class="pt-3" />

            <a-collapse-item :key="2">
              <template #header>
                <collapse-editor-title
                  title="Request Params"
                  v-model:allow-edit="toolConfig.allowEditRequestParams"
                  @save="saveToolRequestParams"
                />
              </template>
              <params
                :raw="focusedTool.request_type"
                :allow-edit="toolConfig.allowEditRequestParams"
                @update:raw="v => toolConfig.request_type=v"
                @update:schema="v => updateSchema(v, 'req')"
              />
            </a-collapse-item>

            <div class="border-b pt-3" />
            <div class="pt-3" />

            <a-collapse-item :key="3">
              <template #header>
                <collapse-editor-title
                  title="Response Params"
                  v-model:allow-edit="toolConfig.allowEditResponseParams"
                  @save="saveToolResponseParams"
                />
              </template>
              <params
                :raw="focusedTool.response_type"
                :allow-edit="toolConfig.allowEditResponseParams"
                @update:raw="v => toolConfig.response_type=v"
                @update:schema="v => updateSchema(v, 'resp')"
              />
            </a-collapse-item>
          </a-collapse>
        </div>
        <div v-else-if="!focusedTool || !plugin.tools?.length" class="h-full flex justify-center items-center">
          <a-empty />
        </div>
      </div>

      <!-- Tool test modal -->
      <modal
        title="Plugin Tool Testing"
        v-model:visible="testPluginToolConfig.modalVisible"
        :width="640"
        modal-class="!bg-gray-50"
      >
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <div class="font-medium">Request Body</div>
            <div class="flex gap-2">
              <button
                class="px-2 py-1 text-xs bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition duration-300"
                @click="testPluginToolConfig.requestBody = jsonFormat(testPluginToolConfig.requestBody)"
              >
                <icon-palette />
                Pretty
              </button>
              <button
                class="px-2 py-1 text-xs bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition duration-300"
                @click="autoGenerate"
              >
                <icon-refresh />
                Auto Generate
              </button>
              <button
                class="px-2 py-1 text-xs text-white bg-blue-700 rounded-md hover:bg-blue-600 active:bg-blue-800 transition duration-300"
                @click="testPluginTool"
              >
                <icon-play-arrow stroke-linecap="round" stroke-linejoin="round" />
                Test
              </button>
            </div>
          </div>
          <editor
            v-model="testPluginToolConfig.requestBody"
            :visible="testPluginToolConfig.modalVisible"
          />
          <div class="flex justify-between items-center">
            <div class="font-medium">Response Body</div>
            <button
              class="px-2 py-1 text-xs bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition duration-300"
              @click="testPluginToolConfig.responseBody = jsonFormat(testPluginToolConfig.responseBody)"
            >
              <icon-palette />
              Pretty
            </button>
          </div>
          <editor
            v-model="testPluginToolConfig.responseBody"
            :visible="testPluginToolConfig.modalVisible"
            readonly
          />
        </div>
        <template #footer>
          <div></div>
        </template>
      </modal>

      <!-- Plugin secrets modal -->
      <modal
        title="Plugin Secrets"
        v-model:visible="pluginConfig.allowEditPluginSecrets"
        :width="840"
        small
        @confirm="savePluginSecret"
      >
        <div class="w-full h-full secret-modal" id="secret-modal">
          <secrets v-model:secrets="pluginConfig.secrets.secrets" allow-edit />
        </div>
        <template #footer-extend>
          <div class="flex items-center gap-2.5 px-0.5">
            <div class="font-normal text-[13px]">Enable Secret</div>
            <a-switch size="small" v-model="pluginConfig.secrets.enable_secret" />
          </div>
        </template>
      </modal>
    </div>
  </ai-spin>
</template>

<style>
#plugin, #secret-modal {
  .arco-input-wrapper,
  .arco-select-view-single,
  .arco-select-view-multiple,
  .arco-textarea-wrapper {
    @apply !bg-gray-100 !text-gray-700 border-gray-200;
  }

  .arco-input-wrapper.arco-input-focus,
  .arco-textarea-wrapper.arco-textarea-focus,
  .arco-select-view-single.arco-select-view-focus,
  .arco-select-view-multiple.arco-select-view-focus {
    @apply !border-blue-700 shadow-blue-100 shadow-sm;
  }

  .arco-input,
  .arco-textarea,
  .arco-select-view-input,
  .arco-select-view-value {
    font-size: 12px;
  }

  .arco-input-wrapper.arco-input-disabled,
  .arco-input-wrapper .arco-input[disabled],
  .arco-textarea-wrapper.arco-textarea-disabled,
  .arco-textarea-wrapper .arco-textarea[disabled] {
    @apply !text-gray-700;
    -webkit-text-fill-color: unset !important;
  }

  .arco-collapse-item-header {
    @apply !bg-transparent !border-0 !pl-6;

    .arco-collapse-item-header-title {
      @apply flex-1;
    }
  }

  .arco-collapse-item-icon-hover {
    left: 0;
  }

  .arco-collapse-item-content {
    @apply !bg-transparent !border-0 !px-3;
  }

  .arco-collapse-item {
    @apply !border-0;
  }

  .editable {
    .arco-input-wrapper,
    .arco-select-view-single,
    .arco-select-view-multiple,
    .arco-textarea-wrapper {
      @apply !bg-white !border-gray-100;
    }

    .arco-input-wrapper.arco-input-focus,
    .arco-textarea-wrapper.arco-textarea-focus,
    .arco-select-view-single.arco-select-view-focus,
    .arco-select-view-multiple.arco-select-view-focus {
      @apply !border-blue-700;
    }
  }
}

#secret-modal {
  @apply !bg-gray-50 !rounded-xl;
}

.code-editor {
  .scroll-decoration {
    display: none !important;
  }
}
</style>