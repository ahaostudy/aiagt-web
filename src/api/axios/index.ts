import instance from './instance.ts'
import { AxiosRequestConfig } from 'axios'
import { Message } from '@arco-design/web-vue'

export interface Response {
  code: number;
  msg: string;
  data?: any;
}


export async function get(url: string, params?: object | undefined, onError?: (resp: any) => void): Promise<Response> {
  try {
    const response = await instance.get<Response>(url, { params })
    return Promise.resolve(response.data)
  } catch (err: any) {
    return defaultErrorHandler(err, onError)
  }
}

export async function post(url: string, data?: object | undefined, config?: AxiosRequestConfig<object> | undefined, onError?: (resp: any) => void): Promise<Response> {
  try {
    const response = await instance.post<Response>(url, data, config)
    return Promise.resolve(response.data)
  } catch (err: any) {
    return defaultErrorHandler(err, onError)
  }
}

export async function put(url: string, data?: object | undefined, config?: AxiosRequestConfig<object> | undefined, onError?: (resp: any) => void): Promise<Response> {
  try {
    const response = await instance.put<Response>(url, data, config)
    return Promise.resolve(response.data)
  } catch (err: any) {
    return defaultErrorHandler(err, onError)
  }
}

export async function del(url: string, config?: AxiosRequestConfig<any>, onError?: (resp: any) => void): Promise<Response> {
  try {
    const response = await instance.delete<Response>(url, config)
    return Promise.resolve(response.data)
  } catch (err: any) {
    return defaultErrorHandler(err, onError)
  }
}

export async function patch(url: string, data?: object | undefined, config?: AxiosRequestConfig<object> | undefined, onError?: (resp: any) => void): Promise<Response> {
  try {
    const response = await instance.patch<Response>(url, data, config)
    return Promise.resolve(response.data)
  } catch (err: any) {
    return defaultErrorHandler(err, onError)
  }
}


async function defaultErrorHandler(err: any, onError?: (resp: any) => void) {
  if (onError) onError(err)
  else {
    if (err?.code && typeof err?.code === 'number' && err?.code % 100 === 41) {
      Message.error('please login first')
    } else {
      Message.error(err?.msg)
    }
  }

  return Promise.reject(err)
}