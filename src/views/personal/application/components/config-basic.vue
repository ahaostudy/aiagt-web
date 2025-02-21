<script setup lang="ts">
import InputGroup from '@c/input-group/input-group.vue'
import { useApplicationStore } from '@/store/application.ts'
import IconInputGroup from '@v/personal/componets/icon-input-group.vue'
import { parseLabels } from '@/utils/labels.ts'
import { reactive, watch } from 'vue'

const appStore = useApplicationStore()

const labelValues = reactive([] as (BigInt | string)[])

watch(appStore.inputAppInfo, () => {
  labelValues.splice(0, labelValues.length)
  if (appStore.inputAppInfo.label_ids) labelValues.push(...appStore.inputAppInfo.label_ids)
  if (appStore.inputAppInfo.label_texts) labelValues.push(...appStore.inputAppInfo.label_texts)
}, { immediate: true })
</script>

<template>
  <div class="bg-white w-80 rounded-xl shadow-lg shadow-gray-200 px-5 py-8 flex flex-col gap-6 border-[0.5px]"
       id="config-basic">
    <icon-input-group
      title-class="text-xs text-gray-500"
      type="app_logo"
      required
      name="App icon"
      v-model="appStore.inputAppInfo.logo"
      image-size="3rem"
    />
    <input-group name="App name" title-class="text-xs text-gray-500" v-model="appStore.inputAppInfo.name" required />
    <input-group name="App description" title-class="text-xs text-gray-500" type="textarea" auto-size
                 v-model="appStore.inputAppInfo.description" />
    <input-group name="Labels" title-class="text-xs text-gray-500">
      <a-select
        placeholder="Please select app labels"
        allow-create
        multiple
        :max-tag-count="8"
        v-model="labelValues"
        @change="(value: any) => {
          const r = parseLabels(value)
          appStore.inputAppInfo.label_ids = r.label_ids
          appStore.inputAppInfo.label_texts = r.label_texts
        }"
      >
        <a-option v-for="label of appStore.appLabels" :key="label.id.toString()" :value="label.id">
          {{ label.text }}
        </a-option>
      </a-select>
    </input-group>
    <input-group name="Private" title-class="text-xs text-gray-500" direction="horizontal">
      <a-switch v-model="appStore.inputAppInfo.is_private" size="small" />
    </input-group>
  </div>
</template>

<style>
#config-basic {
  .arco-input-wrapper, .arco-textarea-wrapper, .arco-select-view {
    @apply !border-gray-200 !rounded-md;
  }

  .arco-input-wrapper .arco-input, .arco-textarea, .arco-select-view-inner {
    @apply !text-xs !text-black;
  }

  .arco-select-view-inner {
    @apply py-0;

    .arco-select-view-input {
      @apply min-h-[22px];
      line-height: unset !important;
    }

    .arco-select-view-tag {
      @apply my-0.5 text-[10px] min-h-min px-1.5 py-0.5;
      line-height: unset !important;
    }
  }

  .arco-input-focus, .arco-textarea-focus, .arco-select-view-focus {
    @apply !border-blue-600 !shadow-transparent;
  }

  .arco-input-suffix {
    @apply !hidden;
  }
}
</style>