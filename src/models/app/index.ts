import { PaginationReq, PaginationResp, Time } from '@/models/base'
import { User } from '@/models/user'
import { PluginSecrets, PluginTool } from '@/models/plugin'

export interface App {
  id: BigInt;
  name: string;
  description: string;
  description_md: string;
  model_id: BigInt;
  enable_image: boolean;
  enable_file: boolean;
  version: string;
  is_private: boolean;
  home_page: string;
  preset_questions: string[];
  tool_ids: BigInt[];
  tools: PluginTool[];
  logo: string;
  author_id: BigInt;
  author?: User;
  label_ids: BigInt[];
  labels: AppLabel[];
  model_config: ModelConfig;
  created_at: Time;
  updated_at: Time;
  published_at?: Time;
  plugin_secrets?: PluginSecrets[];
}

export interface ModelConfig {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string[];
  presence_penalty?: number;
  response_format?: any;
  seed?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  user?: string;
  stream_options?: any;
}

export interface CreateAppReq {
  name: string;
  description: string;
  description_md: string;
  model_id: BigInt;
  enable_image: boolean;
  enable_file: boolean;
  version: string;
  is_private: boolean;
  home_page: string;
  preset_questions: string[];
  tool_ids: BigInt[];
  logo: string;
  label_ids: BigInt[];
  label_texts: string[];
  model_config: ModelConfig;
}

export interface UpdateAppReq {
  id: string;
  name?: string;
  description?: string;
  description_md?: string;
  model_id?: BigInt;
  enable_image?: boolean;
  enable_file?: boolean;
  version?: string;
  is_private?: boolean;
  home_page?: string;
  preset_questions?: string[];
  tool_ids?: BigInt[];
  logo?: string;
  label_ids?: BigInt[];
  label_texts?: string[];
  model_config?: ModelConfig;
}

export interface ListAppReq {
  pagination?: PaginationReq;
  author_id?: BigInt;
  name?: string;
  description?: string;
  label_ids?: BigInt[];
  with_author?: boolean;
}

export interface ListAppResp {
  pagination: PaginationResp;
  apps: App[];
}

export interface PublishAppReq {
  id: BigInt;
  version: string;
}

export interface AppLabel {
  id: BigInt;
  text: string;
  pinned?: number;
  created_at: Time;
}

export interface ListAppLabelReq extends PaginationReq {
  text?: string;
  pinned?: boolean;
}

export interface ListAppLabelResp {
  pagination: PaginationResp;
  labels: AppLabel[];
}

export interface GetAppByIDReq {
  id: BigInt;
  unfold?: boolean;
}

export interface GetAppByIDResp {
  app: App;
  ext?: GetAppByIDRespExtend;
}

export interface GetAppByIDRespExtend {
  private_tools_count: number;
}