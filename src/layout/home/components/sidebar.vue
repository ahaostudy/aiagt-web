<script setup lang="ts">
import { useHomeStore } from '@/store/home.ts'
import { useRouter } from 'vue-router'

defineProps({
  position: {
    type: String,
    default: 'top'
  }
})

const homeStore = useHomeStore()
const router = useRouter()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(tab, i) of homeStore.tabList"
      v-show="tab.position === position"
      :key="tab.title"
      class="flex gap-2.5 px-3 py-[0.435rem] items-center rounded-[0.435rem] hover:bg-white cursor-pointer
              text-gray-700 stroke-gray-700 transition duration-300 font-semibold"
      :class="{'stroke-blue-700 bg-white hover:bg-white': homeStore.isFocused(i), '!cursor-not-allowed': tab.link == '#'}"
      @click="() => {
        if (tab.link != '#') {
          homeStore.focusTab(i)
         router.push({path: tab.link})
        }
      }"
    >
      <slot name="icons" :icon="tab.icon" :focused="homeStore.isFocused(i)" />

      <div
        class="text-sm font-light transition duration-300"
        :class="{'font-medium text-gray-800': homeStore.isFocused(i)}"
        style="font-family: KumbhSans,serif"
      >
        {{ tab.title }}
      </div>
    </div>
    <slot />
  </div>
</template>

<style scoped>

</style>