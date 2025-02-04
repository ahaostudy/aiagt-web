import { PaginationReq, PaginationResp, Time } from '@/models/base'

export enum MessageType {
  TEXT,
  IMAGE,
  FILE,
  FUNCTION,
  FUNCTION_CALL,
  TOOL,
  TOOL_CALL
}

export enum MessageRole {
  USER,
  ASSISTANT,
  SYSTEM,
  FUNCTION,
  TOOL
}

export interface MessageContentValue {
  text?: MessageContentValueText;
  image?: MessageContentValueImage;
  file?: MessageContentValueFile;
  func?: MessageContentValueFunc;
  func_call?: MessageContentValueFuncCall;
  tool?: MessageContentValueTool;
  tool_call?: MessageContentValueToolCall;
}

export interface MessageContentValueText {
  text: string;
}

export interface MessageContentValueImage {
  url: string;
}

export interface MessageContentValueFile {
  url: string;
  type: string;
}

export interface MessageContentValueFunc {
  name: string;
  content: string;
}

export interface MessageContentValueFuncCall {
  name: string;
  arguments: string;
}

export interface MessageContentValueTool {
  id: string;
  name: string;
  content: string;
}

export interface MessageContentValueToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface MessageContent {
  type: MessageType;
  content: MessageContentValue;
}

export interface ChatReq {
  conversation_id?: BigInt;
  app_id: BigInt;
  messages: MessageContent[];
}

export interface ChatResp {
  messages: Message[];
  conversation_id: BigInt;
  conversation_title?: string;
}

export interface ChatRespMessage {
  role: MessageRole;
  content: MessageContent;
}

export interface Conversation {
  id: BigInt;
  user_id: BigInt;
  app_id: BigInt;
  title: string;
  created_at: Time;
  updated_at: Time;
}

export interface Message {
  id: BigInt;
  conversation_id: BigInt;
  role: MessageRole;
  content: MessageContent;
  created_at: Time;
  updated_at: Time;
}

export interface UpdateMessageReq {
  id: BigInt;
  message: MessageContent;
}

export interface ListMessageReq extends PaginationReq {
  conversation_id: BigInt;
}

export interface ListMessageResp {
  pagination: PaginationResp;
  messages: Message[];
}

export interface UpdateConversationReq {
  id: BigInt;
  title: string;
}

export interface ListConversationReq {
  pagination?: PaginationResp;
  app_id: string;
}

export interface ListConversationResp {
  pagination: PaginationResp;
  conversations: Conversation[];
}

export interface InitDevelopReq {
  app_id: BigInt;
}

export interface InitDevelopResp {
  conversation: Conversation;
  messages: Message[];
}