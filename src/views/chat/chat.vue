<script setup lang="ts">
import { App } from '@/models/app'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { chatAPI, deleteMessageAPI, initDevelopAPI, listMessageAPI, updateMessageAPI } from '@/api/chat'
import { ChatResp, ListMessageReq, Message, MessageContent, MessageRole, MessageType } from '@/models/chat'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import { NewTime, Time } from '@/models/base'
import { mark, onClickMarked } from '@/assets/marked'
import { IconPlugin } from '@arco-iconbox/vue-aiagt'
import { clipboardCopy } from '@/utils/copy.ts'
import { debounce } from '@arco-design/web-vue/es/_utils/debounce'
import AiSpin from '@c/ai-spin/ai-spin.vue'
import AiImage from '@c/ai-image/ai-image.vue'
import { uploadAssetsAPI } from '@/api/assets'
import { UploadAssetResp } from '@/models/assets'

const props = defineProps<{
  app: App;
  dev?: boolean;
  conversation_id?: BigInt;
  scrollBy?: any;  // for scrolling to the bottom
}>()

const emits = defineEmits(['newConversation'])

const appInfo = reactive({} as App)
const conversation = reactive({
  messages: [],
  inputMessage: '',
  inputFiles: []
} as {
  id?: BigInt;
  messages: Message[];
  inputMessage: string;
  inputFiles: UploadAssetResp[];
})

interface messageGroup {
  type: 'text' | 'file' | 'other',
  msg?: Message
  msgs?: messageGroupOtherMsg[]
}

interface messageGroupOtherMsg {
  type: 'call' | 'result',
  name?: string,
  content?: string
}

const messageGroups = computed(() => {
  const result: messageGroup[] = []

  for (let msg of conversation.messages) {
    if (msg.content.type === MessageType.TEXT) {
      result.push({ type: 'text', msg: msg })
      continue
    }

    if (msg.content.type === MessageType.FILE) {
      result.push({ type: 'file', msg: msg })
      continue
    }

    const len = result.length
    if (len === 0 || result[len - 1].type === 'text') {
      result.push({ type: 'other', msgs: [] })
    }

    const { type, content } = msg.content
    const item = {} as messageGroupOtherMsg

    switch (type) {
      case MessageType.FUNCTION:
        item.type = 'result'
        item.name = content.func?.name
        item.content = content.func?.content
        break
      case MessageType.FUNCTION_CALL:
        item.type = 'call'
        item.name = content.func_call?.name
        item.content = content.func_call?.arguments
        break
      case MessageType.TOOL:
        item.type = 'result'
        item.name = content.tool?.name
        item.content = content.tool?.content
        break
      case MessageType.TOOL_CALL:
        item.type = 'call'
        item.name = content.tool_call?.name
        item.content = content.tool_call?.arguments
        break
    }

    result[result.length - 1].msgs?.push(item)
  }

  return result
})

const loadingMessage = ref(false)

watch(props.app, async () => {
  Object.assign(appInfo, props.app)

  if (props.dev) {
    loadingMessage.value = true
    const resp = await initDevelopAPI({ app_id: props.app.id })
    loadingMessage.value = false

    conversation.id = resp.conversation.id
    conversation.messages.splice(0, conversation.messages.length)
    conversation.messages.push(...resp.messages)
  }
}, { immediate: true })

const chatRef = ref<HTMLElement | undefined>()

const isAtBottom = () => {
  if (chatRef.value) {
    return chatRef.value.scrollTop >= (chatRef.value.scrollHeight - chatRef.value.clientHeight) - 200
  }
  return false
}

const scrollToBottom = debounce((force?: boolean) => {
  if (chatRef.value && (force || isAtBottom())) {
    chatRef.value.scrollTo({
      top: chatRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}, 30)

const smallWindow = ref(window.innerWidth <= 768)
const isMounted = ref(false)

onMounted(() => {
  if (chatRef.value) smallWindow.value = chatRef.value.offsetWidth <= 768
  isMounted.value = true
  focusMsgInput()
})

window.addEventListener('resize', () => {
  if (chatRef.value) smallWindow.value = chatRef.value.offsetWidth <= 768
  else smallWindow.value = window.innerWidth <= 768
})

watch(computed(() => props.scrollBy), () => {
  focusMsgInput()
  if (scrollToBottom) scrollToBottom(true)
})

watch(computed(() => props.conversation_id), async () => {
  conversation.id = props.conversation_id

  if (props.conversation_id) {
    loadingMessage.value = true

    try {
      const resp = await listMessageAPI({ conversation_id: props.conversation_id, page_size: 200 } as ListMessageReq)
      conversation.messages.splice(0, conversation.messages.length)
      conversation.messages.push(...resp.messages)
    } finally {
      loadingMessage.value = false
    }
  } else {
    conversation.messages.splice(0, conversation.messages.length)
  }

  focusMsgInput()
  if (scrollToBottom) scrollToBottom(true)
}, { immediate: true })

function updateLastMsg(msg: Message) {
  const len = conversation.messages.length
  if (!len) {
    return
  }

  const lastMsg = conversation.messages[len - 1]
  lastMsg.id = msg.id
  lastMsg.created_at = msg.created_at
  lastMsg.updated_at = msg.updated_at
  lastMsg.conversation_id = msg.conversation_id
  lastMsg.role = msg.role

  const content = msg.content
  const lastContent = lastMsg.content
  if (lastContent.type !== content.type) {
    return
  }

  switch (content.type) {
    case MessageType.TEXT:
      if (msg.role === MessageRole.ASSISTANT) {
        if (!lastContent.content.text) lastContent.content.text = { text: '' }
        lastContent.content.text.text += content.content.text?.text
      } else lastContent.content.text = content.content.text
      scrollToBottom()
      break
    case MessageType.FUNCTION:
      lastContent.content.func = content.content.func
      scrollToBottom()
      break
    case MessageType.FUNCTION_CALL:
      lastContent.content.func_call = content.content.func_call
      scrollToBottom()
      break
    case MessageType.TOOL:
      lastContent.content.tool = content.content.tool
      scrollToBottom()
      break
    case MessageType.TOOL_CALL:
      lastContent.content.tool_call = content.content.tool_call
      scrollToBottom()
      break
  }
}

interface ChatStatus {
  oldType?: MessageType;
  isNewMessage: boolean;
}

const chatting = ref(false)

function chat(messages?: MessageContent[]) {
  const status: ChatStatus = { isNewMessage: true }
  chatting.value = true

  chatAPI(
    {
      app_id: appInfo.id,
      conversation_id: conversation.id || undefined, // avoid 0 case
      messages: messages || []
    },
    (event: string, data: ChatResp | string) => {
      switch (event) {
        case 'chunk':
          handleChatChunk(data as ChatResp, status)
          break
        case 'error':
          ArcoMessage.error(data as string)
          break
        case 'done':
          console.log(conversation.messages)
          chatting.value = false
          break
      }
    },
    error => {
      ArcoMessage.error(error)
      chatting.value = false
    }
  )

  if (messages) {
    const now = Date.now()
    conversation.messages.push({
      id: BigInt(now),
      conversation_id: conversation.id || BigInt(0),
      role: MessageRole.USER,
      content: { type: MessageType.TEXT, content: { text: { text: conversation.inputMessage } } },
      created_at: new Time({ timestamp: now }),
      updated_at: new Time({ timestamp: now })
    })
    conversation.inputMessage = ''
  }
}

function handleChatChunk(chunk: ChatResp, status: ChatStatus) {
  if (!conversation.id && chunk.conversation_id) {
    emits('newConversation')
  }
  if (chunk.conversation_title) {
    emits('newConversation')
    return
  }

  conversation.id = chunk.conversation_id

  for (const message of chunk.messages) {
    const content = message.content

    if (message.role !== MessageRole.USER) {
      if (status.oldType !== content.type) {
        status.isNewMessage = true
      }

      if (status.isNewMessage) {
        status.isNewMessage = false

        const now = Date.now()
        const newMsg = {
          id: BigInt(now),
          conversation_id: chunk.conversation_id,
          role: message.role,
          content: { type: content.type, content: {} },
          created_at: new Time({ timestamp: now }),
          updated_at: new Time({ timestamp: now })
        }

        conversation.messages.push(newMsg)
      }
    }

    status.oldType = content.type

    switch (message.role) {
      case MessageRole.USER:
        updateLastMsg(message)
        scrollToBottom(true)
        break
      case MessageRole.ASSISTANT:
        switch (content.type) {
          case MessageType.TEXT:
            updateLastMsg(message)
            break
          case MessageType.FUNCTION_CALL:
            updateLastMsg(message)
            break
          case MessageType.TOOL_CALL:
            updateLastMsg(message)
            break
        }
        break
      case MessageRole.FUNCTION:
        updateLastMsg(message)
        break
      case MessageRole.TOOL:
        updateLastMsg(message)
        break
      default:
        console.log(message)
    }
  }
}

const updateMsgInput = ref<HTMLInputElement | undefined>()

function focusUpdateMsgInput() {
  if (updateMsgInput.value) updateMsgInput.value.focus()
}

const msgInput = ref<HTMLInputElement | undefined>(undefined)
const fileInput = ref<HTMLInputElement | undefined>(undefined)

function focusMsgInput() {
  if (isMounted.value && msgInput.value) msgInput.value.focus()
}

function isSendEvent(event?: KeyboardEvent) {
  if (!event) return true

  if (
    !event.isComposing
    && !event.shiftKey
    && !event.ctrlKey
    && !event.altKey
  ) {
    event.preventDefault()
    return true
  }

  return false
}

function sendMsg(e?: Event) {
  if (chatting.value || uploadingFile.value) return

  const event = e as KeyboardEvent | undefined

  if (isSendEvent(event) && conversation.inputMessage.trim().length) {
    const messages: MessageContent[] = []
    const now = NewTime()

    for (const file of conversation.inputFiles) {
      const msg = {
        type: MessageType.FILE,
        content: {
          file: {
            url: `${import.meta.env.VITE_ASSETS_HOST}/api/v1/assets/${file.file_path}`,
            type: file.file_ext
          }
        }
      }

      messages.push(msg)
      conversation.messages.push({
        id: BigInt(0),
        conversation_id: BigInt(0),
        created_at: now,
        updated_at: now,
        role: MessageRole.USER,
        content: msg
      })
    }

    conversation.inputFiles.splice(0)

    messages.push({
      type: MessageType.TEXT,
      content: { text: { text: conversation.inputMessage } }
    })

    chat(messages)
  }
}

function deleteMessage(messageID: BigInt | undefined, idx: number) {
  if (!messageID) return

  conversation.messages.splice(idx, 1)
  deleteMessageAPI(messageID).then(_ => {
    ArcoMessage.success('delete message success')
  })
}

const updateMsgStatus = reactive({
  id: undefined,
  text: undefined
} as {
  id?: BigInt;
  text?: string;
})

async function updateMsg(e?: Event) {
  if (chatting.value || uploadingFile.value) return

  const event = e as KeyboardEvent | undefined

  const text = updateMsgStatus.text?.trim() || ''

  if (isSendEvent(event) && updateMsgStatus.id && text.length) {
    await updateMessageAPI({
      id: updateMsgStatus.id,
      message: {
        type: MessageType.TEXT,
        content: { text: { text } }
      }
    })

    const idx = conversation.messages.findIndex(msg => {
      if (msg?.id === updateMsgStatus.id) {
        if (msg.content.content.text) {
          msg.content.content.text.text = text
        }
        msg.updated_at = NewTime()

        return true
      }

      return false
    })
    conversation.messages.splice(idx + 1)
    updateMsgStatus.id = undefined

    chat()
  }
}

function regenerate(idx: number) {
  for (let i = idx - 1; i >= 0; i--) {
    if (conversation.messages[i].role === MessageRole.USER) {
      const nextMsg = conversation.messages[i + 1]

      deleteMessageAPI(nextMsg.id, true).then(_ => {
        conversation.messages.splice(i + 1)
        chat()
      })

      break
    }
  }
}

const uploadingFile = ref(false)

async function uploadFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files ? target.files[0] : null

  if (file) {
    uploadingFile.value = true
    try {
      const fileData = {
        file_path: '',
        file_name: '',
        file_ext: ''
      } as UploadAssetResp
      conversation.inputFiles.push(fileData)

      const resp = await uploadAssetsAPI('chat_file', file)
      Object.assign(fileData, resp)
    } finally {
      uploadingFile.value = false
    }
  }
}

function assistantText(text: string): string {
  const splits = text.split('\u003c/think\u003e', 2)

  if (splits.length !== 2) {
    return text
  }

  let think = splits[0].replace('\u003cthink\u003e', '').trim()

  if (think.length === 0) {
    return text
  }

  think = '> ' + think.replace(/\n/g, '\n> ').trim() + '\n\n---\n\n'

  return think + splits[1]
}
</script>

<template>
  <div class="h-screen w-full flex flex-col items-center overflow-y-auto p-10" ref="chatRef">
    <ai-spin :loading="loadingMessage" hide-icon>
      <div class="flex flex-col gap-2 mb-10 flex-1 inner-container" v-if="conversation.messages?.length || chatting">
        <div
          v-for="(mg, idx) of messageGroups"
          class="flex flex-col w-full"
          :class="mg.msg?.role === MessageRole.USER ? 'items-end' : 'items-start'"
        >
          <div
            v-if="mg.type === 'text' && mg.msg?.role === MessageRole.USER && mg.msg?.content.type === MessageType.TEXT"
            class="px-3 py-2 rounded-xl bg-[#ebeced] marked"
            style="white-space: pre-wrap;"
            v-text="mg.msg?.content.content.text?.text"
          />
          <div
            v-else-if="mg.type === 'text' && mg.msg?.role === MessageRole.ASSISTANT && mg.msg?.content.type === MessageType.TEXT"
            class="pt-2 pb-0 rounded-xl marked"
            v-html="mark(assistantText(mg.msg?.content.content.text?.text || ''))"
            @click="onClickMarked"
          />
          <div
            v-else-if="mg.type === 'file' && mg.msg?.role === MessageRole.USER && mg.msg?.content.type === MessageType.FILE"
            class="px-3 py-2 rounded-xl bg-white border-[0.5px] flex flex-col"
          >
            <ai-image
              :src="mg.msg.content.content?.file?.url"
              v-if="['.png', '.jpeg', '.jpg', '.webp', '.gif'].includes(mg.msg.content.content?.file?.type || '')"
              class="max-w-40 max-h-64 py-1"
              allow-preview
            />
            <div
              class="text-xs"
              style="font-family: 'JetBrains Mono NL',serif"
              v-else
            >
              <icon-file />
              {{ mg.msg.content.content?.file?.type }}
            </div>
          </div>
          <div
            v-else-if="mg.type === 'other'"
            class="flex flex-col gap-1 p-1 rounded-xl border max-w-full bg-[#fafafa]"
          >
            <div class="p-1 text-xs !text-[11px] flex gap-2 items-center text-gray-500">
              <div class="text-[13px]">
                <icon-list />
              </div>
              Call Plugin
            </div>
            <div
              v-for="message of mg.msgs"
              class="bg-white border-[#eeeeee] border-[0.5px] px-2 py-1 rounded-lg flex flex-col gap-0.5 text-xs cursor-pointer hover:bg-[#f3f3f3] max-w-96"
              :class="{'!max-w-full': smallWindow}"
            >
              <div class="truncate flex items-center gap-2 text-gray-700">
                <div class="text-[15px]">
                  <icon-plugin class="stroke-[100]" />
                </div>
                {{ message.name }}
                <div
                  class="bg-white px-1 rounded-sm text-xs !text-[10px]"
                  :class="message.type === 'call' ? 'text-purple-500' : 'text-blue-500'"
                >
                  {{ message.type }}
                </div>
              </div>
              <div
                class="truncate text-[10px] text-gray-600"
              >
                {{ message.content }}
              </div>
            </div>
          </div>
          <div
            class="py-2 text-gray-400 flex gap-2 text-xs !text-[11px] items-center"
            v-if="mg.type === 'text'"
          >
            <div>{{ new Time(mg.msg?.updated_at).string() }}</div>
            <a-popconfirm
              content="Are you sure you want to delete?"
              @ok="deleteMessage(mg.msg?.id, idx)"
            >
              <icon-delete
                class="cursor-pointer"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </a-popconfirm>
            <icon-copy
              class="cursor-pointer"
              stroke-linecap="round"
              stroke-linejoin="round"
              @click="() => {
              const text = mg.msg?.content.content.text?.text;
              if (text) {
                clipboardCopy(text)
                ArcoMessage.info('Copied to clipboard')
              }
            }"
            />
            <icon-edit
              class="cursor-pointer"
              v-show="mg.msg?.role === MessageRole.USER"
              stroke-linecap="round"
              stroke-linejoin="round"
              @click="updateMsgStatus.id = mg.msg?.id; updateMsgStatus.text = mg.msg?.content.content.text?.text; focusUpdateMsgInput()"
            />
            <icon-refresh
              class="cursor-pointer"
              v-show="mg.msg?.role === MessageRole.ASSISTANT"
              stroke-linecap="round"
              stroke-linejoin="round"
              @click="regenerate(idx)"
            />
          </div>
        </div>
        <div v-show="chatting" class="bg-black w-3 h-3 rounded-full scale-animation" />
      </div>
      <div class="flex flex-col justify-center items-center gap-6 flex-1 inner-container" v-else>
        <ai-image :src="app.logo" :alt="app.name" class="w-14 h-14 rounded-xl" />
        <div class="text-gray-700 text-lg">
          {{ app.name }}
        </div>
      </div>
    </ai-spin>
    <div class="inner-container sticky bottom-0">
      <div class="px-2 flex justify-between">
        <div
          class="text-xs pl-3.5 pr-3 py-1 rounded-xl bg-[#f8f8f8] border-[0.5px] flex items-center gap-1"
          v-if="updateMsgStatus.id"
        >
          Editing message
          <div
            class="hover:bg-white text-gray-500 rounded-full w-4 h-4 flex justify-center items-center"
            @click="updateMsgStatus.id = undefined"
          >
            <icon-close />
          </div>
        </div>
      </div>
      <div
        class="mt-2 px-1.5 py-1 rounded-[1.5rem] border bg-[#fafafa] question-input shadow-xl shadow-gray-200"
      >
        <div class="flex gap-1 px-3" v-show="conversation.inputFiles.length">
          <div
            v-for="(file, idx) of conversation.inputFiles"
            class="pl-2 pr-1 py-1.5 rounded-xl bg-white border-[0.5px] flex items-center gap-2"
          >
            <ai-image
              :src="file.file_path"
              v-if="['.png', '.jpeg', '.jpg', '.webp', '.gif'].includes(file.file_ext || '')"
              class="max-w-8 max-h-8"
              allow-preview
            />
            <div
              class=" text-blue-500 cursor-pointer hover:bg-gray-100 px-1 py-[0.075rem] rounded-[0.25rem]"
              v-else
            >
              <icon-file v-if="file.file_path.length" />
              <icon-loading v-else />
              {{ file.file_ext }}
            </div>
            <div
              class="text-gray-500 text-[10px] rounded-full hover:bg-gray-200 w-3.5 h-3.5 flex justify-center items-center cursor-pointer"
              @click="conversation.inputFiles.splice(idx, 1)"
            >
              <icon-close />
            </div>
          </div>
        </div>
        <div
          class="flex items-end gap-2"
        >
          <a-textarea
            class="flex-1 !px-2"
            placeholder="Edit your question"
            size="large"
            v-show="updateMsgStatus.id"
            v-model="updateMsgStatus.text"
            @keydown.enter="updateMsg"
            ref="updateMsgInput"
            :auto-size="{maxRows: 20}"
          />
          <a-textarea
            class="flex-1 !px-2"
            placeholder="Enter your question"
            size="large"
            v-show="!updateMsgStatus.id"
            v-model="conversation.inputMessage"
            @keydown.enter="sendMsg"
            ref="msgInput"
            :auto-size="{maxRows: 20}"
          />
          <input type="file" ref="fileInput" class="hidden" @change="uploadFile" />
          <button
            class="h-7 w-7 m-0.5 text-[16px] text-gray-500 rounded-lg hover:bg-gray-100"
            @click="fileInput?.click()"
            v-if="!uploadingFile"
          >
            <icon-plus />
          </button>
          <button
            class="h-7 w-7 m-0.5 text-[16px] text-gray-500 rounded-lg hover:bg-gray-100 cursor-not-allowed"
            v-else
          >
            <icon-loading />
          </button>
          <button
            class="bg-black text-white text-lg rounded-full my-0.5 !w-8 !h-8 flex justify-center items-center ml-2"
            :class="{'!bg-gray-500 !cursor-not-allowed': chatting || uploadingFile}"
            @click="() => {
              if (updateMsgStatus.id) updateMsg()
              else sendMsg()
            }"
          >
            <icon-arrow-up :stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inner-container {
  @apply w-full max-w-[980px];
}
</style>

<style>
.question-input {
  .arco-textarea-wrapper {
    @apply !border-0;
  }

  .arco-textarea-focus {
    @apply !shadow-transparent;
  }
}

@keyframes scale {
  0%, 100% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.8);
  }
}

.scale-animation {
  animation: scale 1s infinite;
}
</style>