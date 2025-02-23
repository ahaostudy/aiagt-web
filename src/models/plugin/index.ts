import { Time, PaginationReq, PaginationResp } from '../base'
import { User } from '../user'

export interface Plugin {
  id: BigInt;
  key: BigInt;
  name: string;
  description: string;
  description_md: string;
  author_id: BigInt;
  author?: User;
  is_private: boolean;
  home_page: string;
  enable_secret: boolean;
  secrets: PluginSecret[];
  label_ids: BigInt[];
  labels: PluginLabel[];
  tool_ids: BigInt[];
  tools?: PluginTool[];
  logo: string;
  created_at: Time;
  updated_at: Time;
  published_at?: Time;
}

export interface PluginSecret {
  name: string;
  description: string;
  acquire_method: string;
  link: string;
}

export interface PluginTool {
  id: BigInt;
  name: string;
  description: string;
  plugin_id: BigInt;
  plugin?: Plugin;
  request_type: string;
  response_type: string;
  api_url: string;
  import_model_id?: BigInt;
  created_at: Time;
  updated_at: Time;
  tested_at?: Time;
}

export interface PluginLabel {
  id: BigInt;
  text: string;
  created_at: Time;
}

export interface GetPluginByKeyReq {
  key: string;
}

export interface ListPluginLabelReq {
  pagination?: PaginationReq;
  text?: string;
}

export interface ListPluginLabelResp {
  pagination: PaginationResp;
  labels: PluginLabel[];
}

export interface CreatePluginReq {
  key: BigInt;
  name: string;
  description: string;
  description_md: string;
  is_private: boolean;
  home_page: string;
  enable_secret: boolean;
  secrets: PluginSecret[];
  label_ids: BigInt[];
  label_texts: string[];
  tool_ids: BigInt[];
  logo: string;
}

export interface UpdatePluginReq {
  id: BigInt;
  key?: BigInt;
  name?: string;
  description?: string;
  description_md?: string;
  is_private?: boolean;
  home_page?: string;
  enable_secret?: boolean;
  secrets?: PluginSecret[];
  label_ids?: BigInt[];
  label_texts?: string[];
  tool_ids?: BigInt[];
  logo?: string;
}

export interface ListPluginReq {
  pagination?: PaginationResp;
  author_id?: BigInt;
  name?: string;
  description?: string;
  labels?: BigInt[];
}

export interface ListPluginResp {
  pagination: PaginationResp;
  plugins: Plugin[];
}

export interface CreatePluginToolReq {
  name: string;
  description: string;
  plugin_id: BigInt;
  request_type: string;
  response_type: string;
  api_url: string;
  import_model_id?: BigInt;
}

export interface UpdatePluginToolReq {
  id: BigInt;
  name?: string;
  description?: string;
  plugin_id?: BigInt;
  request_type?: string;
  response_type?: string;
  api_url?: string;
  import_model_id?: BigInt;
}

export interface ListPluginToolReq {
  pagination: PaginationReq;
  plugin_id?: BigInt;
  tool_ids?: BigInt[];
}

export interface ListPluginToolResp {
  tools: PluginTool[];
  pagination: PaginationResp;
}

export interface CallPluginToolReq {
  plugin_id: BigInt;
  tool_id: BigInt;
  secrets?: { [key: string]: string };
  request: string;
}

export interface CallPluginToolResp {
  code: number;
  msg: string;
  response: string;
  http_code: string;
}

export interface TestPluginToolResp {
  code: number;
  msg: string;
  response: string;
  http_code: string;
}

export interface ListPluginByToolsReq {
  tool_ids: BigInt[];
}

export interface ListPluginByToolsResp {
  plugins: Plugin[];
}

export interface PluginSecrets {
  plugin_id: BigInt;
  plugin_name: string;
  secrets: PluginSecret[];
  is_private: boolean;
  author_id: string;
  plugin_logo: string;
}