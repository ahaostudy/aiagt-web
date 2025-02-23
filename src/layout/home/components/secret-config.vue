<script setup lang="ts">
import { listSecretAPI } from '@/api/user'
import { reactive, ref } from 'vue'
import { Secret } from '@/models/user'
import AiImage from '@c/ai-image/ai-image.vue'


interface secretGroup {
  plugin: {
    id: BigInt;
    name?: string;
    logo?: string;
  };
  secrets: Secret[];
}

const secrets = ref<Secret[]>([])
const secretGroups = reactive<secretGroup[]>([])

async function init() {
  const resp = await listSecretAPI({})
  secrets.value = resp.secrets

  const secretGroupMap = new Map<string, secretGroup>()
  for (let secret of secrets.value) {
    if (!secret.value?.length) continue
    const pluginID = secret.plugin_id.toString()
    if (!secretGroupMap.has(pluginID)) {
      secretGroupMap.set(pluginID, {
        plugin: {
          id: secret.plugin_id,
          name: secret.plugin_name,
          logo: secret.plugin_logo
        },
        secrets: []
      })
    }
    secretGroupMap.get(pluginID)?.secrets.push(secret)
  }

  secretGroups.splice(0)
  secretGroups.push(...secretGroupMap.values())
}

init()
</script>

<template>
  <div class="min-w-72 bg-white border-[0.5px] rounded-lg p-5 flex flex-col gap-6">
    <div class="font-medium text-[15px]">Secrets Config</div>

    <div
      v-for="secretGroup in secretGroups"
      class="flex flex-col gap-2 text-xs"
    >
      <div class="flex gap-2 items-center">
        <ai-image :src="secretGroup.plugin.logo" :alt="secretGroup.plugin.name"
                  class="w-5 h-5 rounded-md border-[0.5px]" />
        <div class="font-medium text-gray-500">
          {{ secretGroup.plugin.name }}
        </div>
      </div>
      <div
        v-for="secret in secretGroup.secrets"
        v-show="secret.value?.length"
        class="flex gap-2 items-center"
      >
        <div class="text-black font-medium">{{ secret.name }}</div>
        <a-input-password :model-value="secret.value" size="mini" readonly />
      </div>
    </div>

    <div v-show="!secretGroups?.length">
      <a-empty />
    </div>
  </div>
</template>

<style scoped>

</style>