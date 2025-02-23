<script setup lang="ts">
import { PluginSecret } from '@/models/plugin'
import AiImage from '@c/ai-image/ai-image.vue'
import { vModelEmits, vModelProps, vModelOnInput } from '@/utils/model_value.ts'

defineProps<{
  secret: PluginSecret;
  plugin_name: string;
  plugin_logo: string;
} & vModelProps>()

const emits = defineEmits(vModelEmits())
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex gap-1 items-center text-[12px]">
      <a-tooltip :content="plugin_name" mini>
        <ai-image :src="plugin_logo" :alt="plugin_name" class="w-5 h-5 rounded-md border-[0.5px]" />
      </a-tooltip>
      {{ secret.name }}
      <a-tooltip mini>
        <template #content>
          <div class="text-[13px]">
            <p>
              <span class="font-bold">Description: </span>
              {{ secret.description }}
            </p>
            <p>
              <span class="font-bold">Acquire method: </span>
              {{ secret.acquire_method }}
            </p>
          </div>
        </template>
        <div class="text-gray-500">
          <icon-info-circle />
        </div>
      </a-tooltip>
      <a-tooltip v-if="secret.link?.length" content="Get the secret or view related documentation" mini>
        <a :href="secret.link" target="_blank" class="flex justify-center items-center text-blue-600">
          <icon-launch size="12px" />
        </a>
      </a-tooltip>
    </div>
    <a-input-password
      size="mini"
      :placeholder="secret.name"
      :model-value="modelValue"
      @input="(v: string) => vModelOnInput(emits, v)"
    />
  </div>

</template>

<style scoped>

</style>