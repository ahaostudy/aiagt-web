<script setup lang="ts">
import { computed, HTMLAttributes, ref } from 'vue'
import { vModelEmits, vModelOnInput } from '@/utils/model_value.ts'

const props = defineProps<{
  name: string;
  required?: boolean;
  gap?: string;
  direction?: 'vertical' | 'horizontal';
  size?: string | number;
  allowClear?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  error?: unknown;
  placeholder?: string;
  maxLength?: number;
  showWordLimit?: boolean;
  autoSize?: boolean | {
    minRows?: number | undefined;
    maxRows?: number | undefined;
  };
  type?: 'text' | 'password' | 'textarea';
  modelValue?: string;
  titleStyle?: HTMLAttributes['style'];
  titleClass?: HTMLAttributes['class'];
}>()

const emits = defineEmits(vModelEmits())

const input = ref<HTMLInputElement>()
const updated = ref(false)

const valid = computed((): boolean => {
  return !updated.value || !props.required || !!props.modelValue?.length
})
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="{'!flex-row items-start justify-between': direction === 'horizontal'}"
  >
    <div
      class="text-[13px] font-medium text-black flex gap-1 items-center"
      @click="input?.focus()"
      :class="titleClass"
      :style="titleStyle"
    >
      {{ name }}
      <span class="text-[14px] text-red-600" v-if="required">*</span>
    </div>

    <slot>
      <a-input
        v-if="!type || type === 'text' || type === 'password'"
        ref="input"
        v-bind="Object({ ...props, ...$attrs })"
        :modelValue="modelValue"
        @input="(v: any) => {
          updated=true;
          vModelOnInput(emits, v)
        }"
        :error="!valid"
      />
      <a-textarea
        v-else-if="type === 'textarea'"
        ref="input"
        v-bind="Object({ ...props, ...$attrs })"
        :modelValue="modelValue"
        @input="(v: any) => {
          updated=true;
          vModelOnInput(emits, v)
        }"
        :error="!valid"
      />
    </slot>
  </div>
</template>

<style>

</style>