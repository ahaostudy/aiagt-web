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
import AiButton from '@c/ai-button/ai-button.vue'
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
  console.log(appStore.appLabels)
  const result = appStore.appLabels.filter((label: AppLabel) => {
    return label.pinned
  })

  result.sort((a: AppLabel, b: AppLabel) => (a.pinned || 0) - (b.pinned || 0))
  return result
})
</script>

<template>
  <div class="flex gap-20 w-full h-full" id="app-card">

    <div class="flex flex-col gap-4 p-4 min-w-60">
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
          :focused="listAppConfig.author_id === authStore.userinfo.id"
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
        <div class="sticky top-0 bg-white py-6 px-2.5 w-full flex justify-between items-center gap-2" style="font-family: Figtree,serif">
          <div class="text-lg text-gray-800 font-medium">
            App Store
          </div>
          <a-input-search
            style="width: 40%; min-width: 200px;"
            size="mini"
            placeholder="Search"
            allow-clear
            v-model="listAppConfig.name"
            @search="init"
            @clear="init"
          />
          <ai-button
            class="!pl-4.5 !pr-4 !py-1.5 !text-[13px] !rounded-full !bg-blue-600 !font-medium"
            @click="router.push('/personal/application')"
          >
            Build
            <icon-right-circle :size="14" />
          </ai-button>
        </div>

        <ai-spin :loading="loading">
          <div
            class="w-full gap-7 pt-1 pb-3 pl-1 pr-2 grid grid-cols-2 w5:grid-cols-3 w6:grid-cols-4 w7:grid-cols-5 w9:grid-cols-6 w10:grid-cols-7"
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