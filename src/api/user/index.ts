import { get, del, post, put } from '@/api/axios'
import {
  CreateSecretReq,
  ListSecretReq,
  ListSecretResp,
  UpdateSecretReq,
  UserCaptchaResp,
  UserLoginReq,
  UserLoginResp,
  UserRegisterReq,
  UserRegisterResp
} from '@/models/user'

export async function registerAPI(req: UserRegisterReq): Promise<UserRegisterResp> {
  const resp = await post('/user/register', req)
  return Promise.resolve(resp.data)
}

export async function loginAPI(req: UserLoginReq): Promise<UserLoginResp> {
  const resp = await post('/user/login', req)
  return Promise.resolve(resp.data)
}

export async function sendCaptchaAPI(email: string): Promise<UserCaptchaResp> {
  const resp = await post('/user/captcha', { email })
  return Promise.resolve(resp.data)
}

export async function createSecretAPI(req: CreateSecretReq): Promise<void> {
  const resp = await post('/user/secret', req)
  return Promise.resolve(resp.data)
}

export async function updateSecretAPI(req: UpdateSecretReq): Promise<void> {
  const resp = await put('/user/secret', req)
  return Promise.resolve(resp.data)
}

export async function deleteSecretAPI(id: BigInt): Promise<void> {
  const resp = await del(`/user/secret/${id.toString()}`)
  return Promise.resolve(resp.data)
}

export async function listSecretAPI(req: ListSecretReq): Promise<ListSecretResp> {
  const resp = await get('/user/secret', req)
  return Promise.resolve(resp.data)
}