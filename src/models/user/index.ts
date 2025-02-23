import { PaginationReq, PaginationResp, Time } from '@/models/base'

export interface User {
  id: BigInt;
  username: string;
  email: string;
  phone_number: string;
  signature: string;
  homepage: string;
  description_md: string;
  github: string;
  avatar: string;
  created_at: Time;
  updated_at: Time;
}

export interface Secret {
  id: BigInt;
  user_id: BigInt;
  plugin_id: BigInt;
  name: string;
  value: string;
  created_at: Time;
  updated_at: Time;
  plugin_name?: string;
  plugin_logo?: string;
}

export interface UserCaptchaResp {
  exists: boolean;
}

export interface UserRegisterReq {
  email: string;
  captcha: string;
  username?: string;
  password?: string;
}

export interface UserRegisterResp {
  token: string;
  expire: Time;
  user: User;
}

export interface UserLoginReq {
  email: string;
  password?: string;
  captcha?: string;
}

export interface UserLoginResp {
  token: string;
  expire: Time;
  user: User;
}

export interface SaveSecretReqItem {
  plugin_id: BigInt;
  name: string;
  value: string;
}


export interface SaveSecretReq {
  secrets: SaveSecretReqItem[];
}

export interface ListSecretReq extends PaginationReq {
  plugin_id?: BigInt;
  plugin_ids?: BigInt[];
  name?: string;
}

export interface ListSecretResp {
  pagination: PaginationResp;
  secrets: Secret[];
}
