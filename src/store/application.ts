import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { App, AppLabel, ModelConfig, UpdateAppReq } from '@/models/app'
import { listAppLabelAPI } from '@/api/app'

export const useApplicationStore = defineStore('application', () => {
  const inputAppInfo = reactive({} as UpdateAppReq)
  const inputAppInfoInit = ref(false)

  const initInputAppInfo = (appInfo?: App) => {
    if (appInfo) Object.assign(inputAppInfo, appInfo)
    if (!inputAppInfo.model_config)
      inputAppInfo.model_config = {} as ModelConfig
    inputAppInfo.label_texts = undefined
    inputAppInfoInit.value = true
  }

  initInputAppInfo()

  const appLabels = reactive([] as AppLabel[])
  const initAppLabels = async () => {
    const resp = await listAppLabelAPI({ page_size: 10000 })

    appLabels.splice(0)
    appLabels.push(...resp.labels)
  }

  return { inputAppInfo, inputAppInfoInit, initInputAppInfo, appLabels, initAppLabels }
})
