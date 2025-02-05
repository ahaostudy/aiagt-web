<script setup lang="ts">
import AppView from '@v/chat/chat.vue'
import { useRoute, useRouter } from 'vue-router'
import { getAppAPI } from '@/api/app'
import { computed, reactive, ref } from 'vue'
import { App } from '@/models/app'
import { Conversation } from '@/models/chat'
import { deleteConversationAPI, listConversationAPI, updateConversationAPI } from '@/api/chat'
import { IconLayoutLeft } from '@arco-iconbox/vue-aiagt'
import AiList from '@c/ai-list/ai-list.vue'
import AiListItem from '@c/ai-list/ai-list-item/ai-list-item.vue'
import { Time } from '@/models/base'
import AiagtText from '@c/aiagt/aiagt-text.vue'
import AiagtLong from '@c/aiagt/aiagt-long.vue'
import { useModelStore } from '@/store/model.ts'
import { Message } from '@arco-design/web-vue'
import AiImage from '@c/ai-image/ai-image.vue'
import AiSpin from '@c/ai-spin/ai-spin.vue'

const router = useRouter()
const route = useRoute()
const appID = String(route.params.id)

const app = reactive({} as App & { private_tools_count?: number })
const conversations = reactive([] as (Conversation & { editing?: boolean; editing_title?: string })[])

const loading = ref(true)

getAppAPI(appID, _ => {
  router.push('/')
}).then(resp => {
  Object.assign(app, resp.app)
  app.private_tools_count = resp.ext?.private_tools_count

  document.title = `${app.name} - Aiagt`
  loading.value = false
})

const loadingConversation = ref(true)

async function loadConversations() {
  const resp = await listConversationAPI({ app_id: appID, page_size: 200 })

  conversations.splice(0, conversations.length)
  conversations.push(...resp.conversations)
}

loadConversations().then(() => {
  loadingConversation.value = false
})

const focusedConversationID = ref<BigInt | undefined>()

const smallWindow = ref(window.innerWidth <= 768)

window.addEventListener('resize', () => {
  smallWindow.value = window.innerWidth <= 768
})

const showSidebar = ref(!smallWindow.value)

// model info
const modelStore = useModelStore()

const model = computed(() => {
  return modelStore.getModel(app.model_id)
})

// update conversation
function updateConversation(conversation: Conversation & { editing?: boolean; editing_title?: string }) {
  if (!conversation.editing_title || !conversation.editing_title.length) {
    Message.error('Conversation title should not be empty')
    return
  }

  conversation.title = conversation.editing_title
  conversation.editing = false

  updateConversationAPI({
    id: conversation.id,
    title: conversation.editing_title
  }).then(_ => {
    Message.success('update conversation success')
  })
}

// delete conversation
function deleteConversation(id: BigInt, idx: number) {
  deleteConversationAPI(id).then(_ => {
    Message.success('delete conversation success')

    conversations.splice(idx, 1)

    if (conversations.length > 0) {
      if (idx < conversations.length) focusedConversationID.value = conversations[idx].id
      else focusedConversationID.value = conversations[conversations.length - 1].id
    } else {
      conversations.splice(0)
    }
  })
}
</script>

<template>
  <ai-spin :loading="loading" class="h-screen" dot>
    <div class="flex bg-[#fcfcfc] max-w-full">

      <div
        class="fixed top-4 left-4 p-2 rounded-3xl bg-[#f3f4f6]"
        v-show="!showSidebar"
      >
        <div class="flex items-center justify-between">
          <aiagt-long class="h-7 w-20 cursor-pointer rounded-md hover:bg-gray-50 px-1.5 py-1" allow-jump />
          <div
            class="text-xl text-gray-400 cursor-pointer rounded-md px-1.5 py-0.5 hover:bg-gray-50"
            @click="showSidebar = !showSidebar"
          >
            <icon-layout-left />
          </div>
        </div>
      </div>

      <div
        class="pl-4 py-4 h-screen flex flex-col gap-4"
        :class="{'fixed z-10': smallWindow}"
        v-show="showSidebar"
      >
        <div
          class="max-w-80 min-w-72 flex flex-col gap-2 bg-gray-100 rounded-3xl p-3 flex-1 overflow-y-hidden"
        >
          <div class="flex items-center justify-between">
            <aiagt-long class="h-7 w-20 cursor-pointer rounded-md hover:bg-gray-50 px-1.5 py-1" allow-jump />
            <div
              class="text-xl text-gray-400 cursor-pointer rounded-md px-1.5 py-0.5 hover:bg-gray-50"
              @click="showSidebar = !showSidebar"
            >
              <icon-layout-left />
            </div>
          </div>

          <div class="flex flex-col gap-1.5 flex-1 overflow-y-hidden">
            <div class="flex flex-col gap-3 p-4 bg-white rounded-2xl">

              <div class="flex items-center gap-2">
                <ai-image :src="app.logo" :alt="app.name" class="w-12 h-12 rounded-xl" />
                <div class="truncate flex flex-col gap-1">
                  <div class="truncate text-lg !text-[16px] text-black font-medium">{{ app.name }}</div>
                  <div class="flex gap-1 flex-wrap">
                    <div
                      v-for="label of app.labels"
                      class="px-1 bg-gray-50 text-xs !text-[10px] rounded-[0.2rem]"
                    >
                      {{ label.text }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-xs">
                {{ app.description }}
              </div>

              <div
                class="flex justify-between items-center gap-2 py-2 px-3 text-xs !text-[11px] text-gray-700 border-[0.5px] rounded-lg">
                <div class="flex items-center gap-2">
                  <ai-image :src="model.logo" :alt="model.name" class="w-4 h-4" />
                  {{ model.name }}
                </div>
                <div class="px-1 bg-gray-100 rounded-sm text-[8px]">{{ model.source }}</div>
              </div>

              <div v-if="app.tools?.length" class="text-xs font-medium">
                Plugin tools
              </div>

              <div v-if="app.tools?.length" class="flex flex-wrap gap-2">
                <div
                  v-for="tool of app.tools.slice(0, 3)"
                  class="flex items-center gap-1 py-1.5 px-2 text-xs !text-[11px] text-gray-700 rounded-md bg-gray-100 app-tools-item transition"
                >
                  <ai-image v-if="tool.plugin" :src="tool.plugin?.logo" :alt="tool.name" class="w-4 h-4" />
                  <div class="app-tools-item-name">{{ tool.name }}</div>
                </div>
                <div
                  class="flex items-center gap-1 py-1.5 px-2 text-xs !text-[11px] text-gray-700 rounded-md bg-gray-100 app-tools-item transition"
                  v-if="app.private_tools_count"
                >
                  Private x {{ app.private_tools_count }}
                </div>
              </div>

              <div class="text-xs truncate flex gap-1.5 pt-2 pl-0.5 items-center justify-between">
                <div class="flex gap-1.5 items-center truncate">
                  <ai-image :src="app.author?.avatar" :alt="app.author?.username" class="w-4 h-4 rounded-full" />
                  <div class="font-medium">{{ app.author?.username }}</div>
                </div>
                <aiagt-text style="height: 14px; width: 47px" />
              </div>
            </div>

            <div class="bg-[#f4f5f6] rounded-2xl overflow-y-hidden flex-1 flex flex-col border border-gray-200">
              <div class="px-4.5 py-3 !border-0 text-[#4b6ce9] font-medium">
                Conversations
              </div>
              <ai-list class="!bg-[#fdfdfe] !rounded-2xl !px-1 !py-1 h-full overflow-y-auto">
                <ai-spin :loading="loadingConversation">
                  <ai-list-item
                    v-for="(conversation, idx) of conversations"
                    @click="focusedConversationID = conversation.id"
                    class="text-black rounded-xl !px-1.5"
                    :class="focusedConversationID === conversation.id ? '!bg-[#edeeef]' : 'hover:!bg-gray-100'"
                    :focused="focusedConversationID === conversation.id"
                    inner-class="!py-2.5 !px-2 justify-between gap-4 text-gray-800"
                  >
                    <div
                      class="flex flex-col gap-1 text-gray-600 truncate"
                      :class="{'!text-black font-medium': focusedConversationID === conversation.id}"
                      v-if="!conversation.editing"
                    >
                      {{ conversation.title }}
                      <div class="text-[10px] text-gray-500">{{ `${new Time(conversation.updated_at).string()}` }}</div>
                    </div>
                    <a-input
                      placeholder="Edit conversation title"
                      size="mini"
                      v-model="conversation.editing_title"
                      v-else
                    />
                    <div class="text-gray-400 flex gap-2 items-center">
                      <icon-edit
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        @click="conversation.editing = true; conversation.editing_title = conversation.title"
                        v-if="!conversation.editing"
                      />
                      <icon-close
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        @click="conversation.editing = false"
                        v-if="conversation.editing"
                      />
                      <icon-check
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        @click="updateConversation(conversation)"
                        v-if="conversation.editing"
                      />
                      <a-popconfirm
                        content="Are you sure you want to delete?"
                        @ok="deleteConversation(conversation.id, idx)"
                      >
                        <icon-delete stroke-linecap="round" stroke-linejoin="round" />
                      </a-popconfirm>
                    </div>
                  </ai-list-item>
                </ai-spin>
              </ai-list>
            </div>

            <div
              class="flex justify-center items-center gap-2 py-2.5 rounded-lg bg-[#e7ebf6] border-[#cad6f6] border-[0.5px] text-[12px] font-medium text-[#4b6ce9] cursor-pointer"
              @click="focusedConversationID = focusedConversationID === undefined ? BigInt(0) : undefined"
            >
              <icon-plus :stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
              New Conversation
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex justify-center max-w-full">
        <div class="w-full">
          <app-view :app="app" :conversation_id="focusedConversationID" @new-conversation="loadConversations()" />
        </div>
      </div>

    </div>
  </ai-spin>
</template>