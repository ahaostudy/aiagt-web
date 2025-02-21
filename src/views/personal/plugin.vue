<script setup lang="ts">
import { PaginationResp, Time } from '@/models/base'
import Card from '@v/personal/componets/card.vue'
import { computed, reactive, ref } from 'vue'
import { CreatePluginReq, ListPluginReq, Plugin, PluginLabel } from '@/models/plugin'
import { createPluginAPI, listPluginAPI, listPluginLabelAPI } from '@/api/plugin'
import Modal from '@c/modal/modal.vue'
import InputGroup from '@c/input-group/input-group.vue'
import IconInputGroup from '@v/personal/componets/icon-input-group.vue'
import { usePersonalStore } from '@/store/personal.ts'
import { useAuthStore } from '@/store/auth.ts'
import AiSpin from '@c/ai-spin/ai-spin.vue'
import { Message } from '@arco-design/web-vue'

const personalStore = usePersonalStore()
personalStore.focusByName('Plugin')

const authStore = useAuthStore()

const listConfig = reactive({
  plugins: [] as Plugin[],
  req: { pagination: { page: 1, page_size: 20 }, author_id: authStore.userinfo.id || 0 } as ListPluginReq,
  pagination: {} as PaginationResp
})

const modalConfig = reactive({
  visible: false,
  pluginLabels: [] as PluginLabel[],

  createPluginReq: {} as CreatePluginReq,
  createPluginReqValid: computed((): boolean => {
    return !!(modalConfig.createPluginReq.name && modalConfig.createPluginReq.logo)
  }),

  changeLabels: (value: any) => {
    if (!value) return
    const labels = value as (BigInt | string)[]
    modalConfig.createPluginReq.label_ids = []
    modalConfig.createPluginReq.label_texts = []

    for (const label of labels) {
      switch (typeof label) {
        case 'string':
          modalConfig.createPluginReq.label_texts.push(label)
          break
        case 'bigint':
          modalConfig.createPluginReq.label_ids.push(label)
          break
        case 'number':
          modalConfig.createPluginReq.label_ids.push(label)
          break
      }
    }
  }
})

async function createPlugin() {
  await createPluginAPI(modalConfig.createPluginReq)
  Message.success('Create plugin success')

  await init()
}

const loading = ref(true)

async function init() {
  document.title = 'Plugins - Aiagt'

  if (!authStore.verifyLoggedIn()) return

  const listResp = await listPluginAPI(listConfig.req)
  listConfig.plugins = listResp.plugins
  listConfig.pagination = listResp.pagination

  const listLabelResp = await listPluginLabelAPI({ pagination: { page_size: 10000 } })
  modalConfig.pluginLabels = listLabelResp.labels
}

init().then(() => {
  loading.value = false
})
</script>

<template>
  <ai-spin :loading="loading">
    <div class="flex flex-col gap-5 items-start">
      <div
        class="w-full grid grid-cols-1 w2:grid-cols-2 w5:grid-cols-3 w6:grid-cols-4 w8:grid-cols-5 gap-6 min-w-80">
        <card class="bg-[#f8f9fa] !border-[0.5px] !border-gray-200 !p-5">
          <div class="w-full h-full flex flex-col gap-4 text-gray-500">
            <div class="text-gray-800 font-medium text-[16px]">Create plugin</div>
            <div
              class="h-full flex flex-col justify-center items-center gap-2 rounded-2xl bg-white border-[0.5px] font-medium py-8 hover:text-blue-600"
              @click="modalConfig.visible = true"
            >
              <div class="text-[16px]">
                <icon-plus stroke-linecap="round" stroke-linejoin="round" :stroke-width="5" />
              </div>
              Create empty plugin
            </div>
          </div>
        </card>
        <card v-for="plugin of listConfig.plugins"
              :id="plugin.id"
              :name="plugin.name"
              :logo="plugin.logo"
              :time="new Time(plugin.updated_at)"
              :description="plugin.description"
              :labels="plugin.labels"
              :link="`/plugin/space/${plugin.key}`"
        />
      </div>
    </div>

    <modal
      title="Create Plugin"
      v-model:visible="modalConfig.visible"
      :allow-confirm="modalConfig.createPluginReqValid"
      @confirm="createPlugin"
    >
      <div class="py-3 flex flex-col gap-8">
        <icon-input-group
          type="plugin_logo"
          v-model="modalConfig.createPluginReq.logo"
        />
        <input-group
          name="Plugin name"
          placeholder="Please enter plugin name"
          required
          :max-length="32"
          show-word-limit
          v-model="modalConfig.createPluginReq.name"
        />
        <input-group
          name="Plugin description"
          type="textarea"
          placeholder="Please enter plugin description"
          :auto-size="{ minRows: 4, maxRows: 4 }"
          :max-length="200"
          show-word-limit
          v-model="modalConfig.createPluginReq.description"
        />
        <input-group
          name="Plugin labels"
        >
          <a-select
            placeholder="Please select plugin labels"
            allow-create
            multiple
            :max-tag-count="8"
            @change="modalConfig.changeLabels"
          >
            <a-option v-for="label of modalConfig.pluginLabels" :key="label.id.toString()" :value="label.id">
              {{ label.text }}
            </a-option>
          </a-select>
        </input-group>
      </div>
    </modal>
  </ai-spin>
</template>