<script setup lang="ts">
import { IconSearch } from '@arco-design/web-vue/es/icon'
import { vModelEmits, vModelPropsObj, vModelOnInput } from '@/utils/model_value.ts'
import { ref, watch } from 'vue'

const props = defineProps(vModelPropsObj())
const emits = defineEmits(vModelEmits())

const modelValue = ref(props.modelValue)

const searchFocus = ref(false)
const searchInputRef = ref<HTMLInputElement>()

watch(searchFocus, (v) => {
  if (v) searchInputRef.value?.focus()
})
</script>

<template>
  <div
    class="flex gap-2 px-2 py-1.5 rounded-md border border-solid border-gray-300
    bg-gray-100 bg-transparent/[.025] scale-110 m-2 transition"
    :class="{'bg-[rgba(255,255,255,0.3)] border-gray-400': searchFocus}"
    tabindex="1"
    @focus="searchFocus = true"
    @blur="searchFocus = false"
  >
    <icon-search
      class="w-4 !stroke-gray-400 transition"
      :class="{'!stroke-gray-700': searchFocus}"
    />
    <input
      type="text"
      placeholder="Search (⌘ + K)"
      class="placeholder-gray-500 text-xs w-32 text-black transition"
      v-model="modelValue"
      @input="vModelOnInput(emits, modelValue)"
      @focus="searchFocus = true"
      @blur="searchFocus = false"
      ref="searchInputRef"
    >
  </div>
</template>