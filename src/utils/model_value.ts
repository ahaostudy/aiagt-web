import { EmitFn } from '@vue/runtime-core'

export interface vModelProps {
  modelValue?: string
}

export const vModelPropsObj = () => {
  return { modelValue: { type: String, default: '' } }
}

export const vModelEmits = () => ['update:modelValue', 'change']

export function vModelOnInput(emits: EmitFn, modelValue: string | undefined) {
  emits('update:modelValue', modelValue)
  emits('change', modelValue)
}
