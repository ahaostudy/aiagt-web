<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { App, ListAppReq, CreateAppReq } from '@/models/app'
import { createAppAPI, listAppAPI } from '@/api/app'
import { PaginationResp, Time } from '@/models/base'
import Modal from '@c/modal/modal.vue'
import InputGroup from '@c/input-group/input-group.vue'
import { Message } from '@arco-design/web-vue'
import Card from '@v/personal/componets/card.vue'
import IconInputGroup from '@v/personal/componets/icon-input-group.vue'
import { usePersonalStore } from '@/store/personal.ts'
import { useApplicationStore } from '@/store/application.ts'
import { useAuthStore } from '@/store/auth.ts'
import { asset } from '@/models/assets'
import AiSpin from '@c/ai-spin/ai-spin.vue'

const personalStore = usePersonalStore()
personalStore.focusByName('Application')

const appStore = useApplicationStore()
const authStore = useAuthStore()

const listCfg = reactive({
  apps: [] as App[],
  req: { pagination: { page: 1, page_size: 20 }, author_id: authStore.userinfo.id || 0 } as ListAppReq,
  pagination: {} as PaginationResp
})

const modalConfig = reactive({
  visible: false,

  createAppReq: {} as CreateAppReq,
  createAppReqValid: computed((): boolean => {
    return !!(modalConfig.createAppReq.name && modalConfig.createAppReq.logo)
  }),

  changeLabels: (value: any) => {
    if (!value) return
    const labels = value as (BigInt | string)[]
    modalConfig.createAppReq.label_ids = []
    modalConfig.createAppReq.label_texts = []

    for (const label of labels) {
      switch (typeof label) {
        case 'string':
          modalConfig.createAppReq.label_texts.push(label)
          break
        case 'bigint':
          modalConfig.createAppReq.label_ids.push(label)
          break
        case 'number':
          modalConfig.createAppReq.label_ids.push(label)
          break
      }
    }
  }
})

async function createApp() {
  await createAppAPI(modalConfig.createAppReq)
  Message.success('Create app success')

  await init()
}

async function init() {
  document.title = 'Applications - Aiagt'

  if (!authStore.verifyLoggedIn()) return

  const listAppResp = await listAppAPI(listCfg.req)
  listCfg.apps = listAppResp.apps
  listCfg.pagination = listAppResp.pagination

  await appStore.initAppLabels()
}

const loading = ref(true)
init().then(() => {
  loading.value = false
})
</script>

<template>
  <ai-spin :loading="loading">
    <div class="flex flex-col gap-6 items-start">
      <div
        class="w-full grid grid-cols-1 w2:grid-cols-2 w5:grid-cols-3 w6:grid-cols-4 w8:grid-cols-5 gap-6 min-w-80"
      >
        <card class="bg-[#f8f9fa] !border-[0.5px] !border-gray-200 !p-5">
          <div class="w-full h-full flex flex-col gap-4 text-gray-500">
            <div class="text-gray-800 font-medium text-[16px]">Create app</div>
            <div
              class="h-full flex flex-col justify-center items-center gap-2 rounded-2xl bg-white border-[0.5px] font-medium py-8 hover:text-blue-600"
              @click="modalConfig.visible = true"
            >
              <div class="text-[16px]">
                <icon-plus stroke-linecap="round" stroke-linejoin="round" :stroke-width="5" />
              </div>
              Create empty app
            </div>
          </div>
        </card>

        <card v-for="app of listCfg.apps"
              :id="app.id"
              :name="app.name"
              :logo="asset(app.logo)"
              :time="new Time(app.updated_at)"
              :description="app.description"
              :labels="app.labels"
              :link="`/app/space/${app.id}`"
              :link2="`/app/${app.id}`"
        />

      </div>
    </div>

    <modal
      title="Create App"
      v-model:visible="modalConfig.visible"
      :allow-confirm="modalConfig.createAppReqValid"
      @confirm="createApp"
    >
      <div class="py-3 flex flex-col gap-8">
        <icon-input-group
          type="app_logo"
          v-model="modalConfig.createAppReq.logo"
        />
        <input-group
          name="App name"
          placeholder="Please enter app name"
          required
          :max-length="32"
          show-word-limit
          v-model="modalConfig.createAppReq.name"
        />
        <input-group
          name="App description"
          type="textarea"
          placeholder="Please enter app description"
          :auto-size="{ minRows: 4, maxRows: 4 }"
          :max-length="200"
          show-word-limit
          v-model="modalConfig.createAppReq.description"
        />
        <input-group
          name="App labels"
        >
          <a-select
            placeholder="Please select app labels"
            allow-create
            multiple
            :max-tag-count="8"
            @change="modalConfig.changeLabels"
          >
            <a-option v-for="label of appStore.appLabels" :key="label.id.toString()" :value="label.id">
              {{ label.text }}
            </a-option>
          </a-select>
        </input-group>
      </div>
    </modal>
  </ai-spin>
</template>