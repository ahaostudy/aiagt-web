import {
  ChatReq,
  ChatResp,
  InitDevelopReq,
  InitDevelopResp,
  ListConversationReq,
  ListConversationResp,
  ListMessageReq,
  ListMessageResp,
  UpdateConversationReq,
  UpdateMessageReq
} from '@/models/chat'
import { sseV2 } from '@/utils/sse.ts'
import { useAuthStore } from '@/store/auth.ts'
import { del, get, post, put } from '@/api/axios'
import JSONBigInt from 'json-bigint'

const authStore = useAuthStore()

export function chatAPI(
  req: ChatReq,
  onMessage: (event: string, data: ChatResp | string) => void,
  onError: (error: any) => void = console.error
) {
  let headers: Record<string, string> = {}

  const token = authStore.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  sseV2(`${import.meta.env.VITE_API_BASE_URL}/chat/chat`, req, headers, message => {
    switch (message.event) {
      case 'chunk':
        onMessage(message.event, JSONBigInt.parse(message.data) as ChatResp)
        break
      default:
        onMessage(message.event, message.data)
        break
    }

  }, onError)
}

export async function initDevelopAPI(req: InitDevelopReq): Promise<InitDevelopResp> {
  const resp = await post('/chat/conversation/develop', req)
  return Promise.resolve(resp.data)
}

export async function listMessageAPI(req: ListMessageReq): Promise<ListMessageResp> {
  const resp = await get('/chat/message/', req)
  return Promise.resolve(resp.data)
}

export async function listConversationAPI(req: ListConversationReq): Promise<ListConversationResp> {
  const resp = await get('/chat/conversation/', req)
  return Promise.resolve(resp.data)
}

export async function deleteConversationAPI(id: BigInt): Promise<void> {
  const resp = await del(`/chat/conversation/${id.toString()}`)
  return Promise.resolve(resp.data)
}

export async function updateConversationAPI(req: UpdateConversationReq): Promise<void> {
  const resp = await put(`/chat/conversation/${req.id.toString()}`, req)
  return Promise.resolve(resp.data)
}

export async function deleteMessageAPI(id: BigInt, more?: boolean): Promise<void> {
  const resp = await del(`/chat/message/${id}${more ? '?more=1' : ''}`)
  return Promise.resolve(resp.data)
}

export async function updateMessageAPI(req: UpdateMessageReq): Promise<void> {
  const resp = await put(`/chat/message/${req.id}`, req)
  return Promise.resolve(resp.data)
}