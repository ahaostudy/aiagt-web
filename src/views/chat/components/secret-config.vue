<script setup lang="ts">
import { PluginSecrets } from '@/models/plugin'
import SecretConfigInputGroup from '@v/chat/components/secret-config-input-group.vue'
import { reactive } from 'vue'
import { listSecretAPI, saveSecretsAPI } from '@/api/user'
import { SaveSecretReqItem } from '@/models/user'
import { Message } from '@arco-design/web-vue'

const props = defineProps<{
  pluginSecrets: PluginSecrets[]
}>()

const pluginSecretValues = reactive<any>({})
for (const pluginSecret of props.pluginSecrets) {
  pluginSecretValues[pluginSecret.plugin_id.toString()] = {}
}

async function init() {
  const pluginIDs = []
  for (const pluginSecret of props.pluginSecrets) pluginIDs.push(pluginSecret.plugin_id)

  const resp = await listSecretAPI({ plugin_ids: pluginIDs, page_size: 100 })

  for (const secret of resp.secrets) {
    const pluginID = secret.plugin_id.toString()
    pluginSecretValues[pluginID][secret.name] = secret.value
  }
}

init()

function saveSecrets() {
  const secrets: SaveSecretReqItem[] = []

  for (const [pluginID, secretMap] of Object.entries(pluginSecretValues)) {
    if (!secretMap) continue

    for (const [name, value] of Object.entries(secretMap)) {
      secrets.push({
        plugin_id: BigInt(pluginID),
        name: name,
        value: value
      })
    }
  }

  saveSecretsAPI({
    secrets: secrets
  }).then(() => {
    Message.success('save secrets success')
  })
}
</script>

<template>
  <div class="min-w-96 border rounded-2xl bg-[#f4f5f6]">
    <div class="px-4 py-2.5 font-medium text-blue-600">
      Secrets config
    </div>

    <div class="p-4 flex flex-col gap-3 bg-white rounded-t-lg rounded-b-2xl">
      <div
        v-for="pluginSecret in pluginSecrets"
        v-show="pluginSecret.secrets?.length"
        class="flex flex-col gap-3"
      >
        <div
          v-for="secret in pluginSecret.secrets"
        >
          <secret-config-input-group
            :secret="secret"
            :plugin_name="pluginSecret.plugin_name"
            :plugin_logo="pluginSecret.plugin_logo"
            v-model="pluginSecretValues[pluginSecret.plugin_id.toString()][secret.name]"
          />
        </div>
      </div>

      <button
        class="mt-3 py-1.5 px-3 text-white font-medium bg-blue-600 rounded-md"
        @click="saveSecrets"
      >
        Save
      </button>
    </div>
  </div>
</template>