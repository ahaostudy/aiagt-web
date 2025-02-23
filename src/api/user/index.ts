import { post } from '@/api/axios'
import {
  ListSecretReq,
  ListSecretResp,
  SaveSecretReq,
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

export async function saveSecretsAPI(req: SaveSecretReq): Promise<void> {
  const resp = await post('/user/secret/batch_save', req)
  return Promise.resolve(resp.data)
}

export async function listSecretAPI(req: ListSecretReq): Promise<ListSecretResp> {
  const resp = await post('/user/secret/list', req)
  return Promise.resolve(resp.data)
}