<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'normal'
}>()

</script>

<template>
  <div
    class="bg-[#f9f9fb] rounded-full px-3.5 py-[0.4rem] border flex gap-2 items-center text-[13px] font-medium cursor-pointer hover:bg-gray-100"
    :class="{'text-blue-600': type==='primary'}"
  >
    <slot />
  </div>
</template>

<style scoped>

</style>