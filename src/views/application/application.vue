<script setup lang="ts">
import { useHomeStore } from '@/store/home.ts'
import { App, AppLabel, ListAppReq } from '@/models/app'
import { computed, reactive, ref } from 'vue'
import { listAppAPI } from '@/api/app'
import AiSpin from '@c/ai-spin/ai-spin.vue'
import Card from '@v/application/components/card.vue'
import { useApplicationStore } from '@/store/application.ts'
import AiList from '@c/ai-list/ai-list.vue'
import { toPascalCase } from '@/utils/str.ts'
import SideListItem from '@v/application/components/side-list-item.vue'
import AiListItem from '@c/ai-list/ai-list-item/ai-list-item.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.ts'

const router = useRouter()

const homeStore = useHomeStore()
const appStore = useApplicationStore()
const authStore = useAuthStore()

document.title = 'App Store - Aiagt'
homeStore.focusTabByName('Application')

const apps = reactive([] as App[])
const loading = ref(true)

const listAppConfig = reactive({
  pagination: {
    page_size: 50,
    page: 1
  },
  with_author: true,
  selected_label: undefined
} as ListAppReq & { selected_label?: number })

function init() {
  loading.value = true

  listAppAPI(listAppConfig).then(resp => {
    apps.splice(0)
    apps.push(...resp.apps)
    appStore.initAppLabels()
  }).finally(() => {
    loading.value = false
  })
}

init()

const pinnedLabels = computed(() => {
  const result = appStore.appLabels.filter((label: AppLabel) => {
    return label.pinned
  })

  result.sort((a: AppLabel, b: AppLabel) => (a.pinned || 0) - (b.pinned || 0))
  return result
})
</script>

<template>
  <div class="header">
    <div class="h-[100%] flex flex-col justify-between p-8 pb-0">
      <div class="flex justify-between">
        <div
          class="text-xl font-semibold"
          style="font-family: Figtree,serif"
        >
          App Store
        </div>
        <div>
          <button
            class="px-6 py-2 text font-semibold rounded-full !text-blue-600 !bg-white"
            style="font-family: Figtree,serif"
            @click="router.push('/personal/application')"
          >
            Build your App
          </button>
        </div>
      </div>
      <div
        class="h-full w-full flex justify-center items-top p-5"
      >
        <div
          class="w-[36%] min-w-[240px] h-10 py-3 px-4 rounded-full bg-white flex items-center gap-4 shadow shadow-gray-100">
          <icon-search />
          <input
            type="text"
            class="flex-1 h-full"
            placeholder="Search"
            v-model="listAppConfig.name"
            @change="init"
            @input="() => {
              if (!listAppConfig.name?.length) init()
            }"
          >
        </div>
      </div>
    </div>
  </div>
  <div class="flex gap-10 w-full h-full p-2" id="app-card">

    <div class="flex flex-col gap-4 p-6 min-w-48">
      <div class="px-3 pt-3 text-gray-800 font-medium">Developer</div>
      <ai-list
        class="!bg-transparent !p-0 !gap-1"
      >
        <side-list-item
          text="All"
          focus-class="!bg-gray-100"
          focus-inner-class="!text-gray-800"
          :focused="!listAppConfig.author_id"
          @click="listAppConfig.author_id = undefined; init()"
        />
        <side-list-item
          text="Personal"
          focus-class="!bg-gray-100"
          focus-inner-class="!text-gray-800"
          :focused="authStore.userinfo.id && listAppConfig.author_id === authStore.userinfo.id"
          @click="listAppConfig.author_id = authStore.userinfo.id; init()"
        />
      </ai-list>

      <div class="px-3 pt-3 text-gray-800 font-medium">Categories</div>
      <ai-list
        class="!bg-transparent !p-0 !gap-1"
      >
        <ai-list-item class="!px-0.5" inner-class="!py-0.5">
          <a-select
            size="mini"
            placeholder="Select"
            allow-search
            allow-clear
            v-model="listAppConfig.selected_label"
            @change="(value: any) => {
                if (value) listAppConfig.label_ids = [BigInt(value)]
                else listAppConfig.label_ids = undefined
                init()
              }"
          >
            <a-option
              v-for="label of appStore.appLabels"
              :key="label.id.toString()"
              :value="label.id"
            >
              {{ label.text }}
            </a-option>
          </a-select>
        </ai-list-item>
        <side-list-item
          text="All"
          :focused="!listAppConfig.label_ids?.length"
          @click="listAppConfig.label_ids = undefined; init()"
        />
        <side-list-item
          v-for="label of pinnedLabels"
          :text="toPascalCase(label.text)"
          :focused="!!listAppConfig.label_ids?.length && listAppConfig.label_ids[0] === label.id"
          @click="listAppConfig.label_ids = [label.id]; init()"
        />
      </ai-list>
    </div>

    <div class="flex-1">
      <div class="h-full flex flex-col pr-6 overflow-y-auto min-w-[480px]">
        <div class="sticky top-0 py-6 px-2.5 w-full flex justify-between items-center gap-2"
             style="font-family: Figtree,serif">
          <div class="text-lg text-gray-800 font-medium">
            Applications
          </div>
        </div>

        <ai-spin :loading="loading">
          <div
            class="w-full gap-7 pt-1 pb-3 pl-1 pr-2 grid grid-cols-2 w5:grid-cols-3 w6:grid-cols-4 w7:grid-cols-5 w10:grid-cols-6"
            v-if="apps?.length"
          >
            <card
              class="h-auto"
              v-for="app of apps"
              :key="app.id.toString()"
              :app="app"
            />
          </div>
          <div
            class="h-full w-full flex justify-center items-center"
            v-else
          >
            <a-empty />
          </div>
        </ai-spin>
      </div>
    </div>
  </div>
</template>

<style>
#app-card {
  .arco-select-view-single,
  .arco-input-search {
    @apply !py-1;
  }
}
</style>

<style scoped>
.header {
  height: 160px;
  margin: 0;
  margin-bottom: -20px;
  background: linear-gradient(to bottom, #a1bcf6, #ffffff),
  linear-gradient(to right, #8b94f3, #7984f8, #c8c4fa, #ae7bfa, #a1bcf6);
  background-size: cover;
  background-blend-mode: screen;
}
</style>