<script setup lang="ts">
import { IconGithub, IconGoogleOriginal } from '@arco-iconbox/vue-aiagt'
import { sendCaptchaAPI } from '@/api/user'
import { Progress, useAuthStore } from '@/store/auth.ts'
import { useRouter } from 'vue-router'
import { IconLoading } from '@arco-design/web-vue/es/icon'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { onEnter } from '@/utils/event.ts'

document.title = 'Login - Aiagt'

const authStore = useAuthStore()
const router = useRouter()

const nextButtonLoading = ref(false)

async function next() {
  nextButtonLoading.value = true

  const resp = await sendCaptchaAPI(authStore.email)
  authStore.progress = resp.exists ? Progress.LOGIN : Progress.REGISTER

  nextButtonLoading.value = false
  Message.success('Verification code has been sent.')
  await router.push({ path: '/auth/login' })
}
</script>

<template>
  <div class="flex flex-col justify-center items-center w-full h-full gap-8">

    <div class="font-medium text-2xl">Welcome to Aiagt</div>

    <div class="flex flex-col gap-6 w-full">
      <button class="border-solid border h-10 w-full rounded-lg cursor-not-allowed active:bg-gray-100">
        <span class="flex justify-center items-center w-full gap-4">
          <icon-google-original />
          Continue with Google
        </span>
      </button>

      <button class="border-solid border h-10 w-full rounded-lg cursor-not-allowed active:bg-gray-100">
        <span class="flex justify-center items-center w-full gap-4">
          <icon-github class="text-sm" />
          Continue with Github
        </span>
      </button>
    </div>

    <div class="text-gray-400 font-light">or</div>

    <div class="flex flex-col gap-6 w-full">
      <input
        type="text"
        class="border-solid border h-10 w-full rounded-lg text-center focus:border-blue-700 focus:border-2 transition"
        placeholder="Enter your email"
        v-model="authStore.email"
        @keydown.enter="e => onEnter(e, next)"
      >

      <button
        class="border-solid bg-blue-700 text-white h-10 w-full rounded-lg text-center btn-continue hover:bg-blue-600 active:bg-blue-800"
        @click="next"
        :class="{
        'bg-blue-600': nextButtonLoading,
         'hover:bg-blue-600': nextButtonLoading,
         'active:bg-blue-600': nextButtonLoading
      }"
        :disabled="nextButtonLoading"
      >
        <icon-loading
          v-if="nextButtonLoading"
          style="stroke: white"
        />
        Next
      </button>
    </div>
  </div>
</template>
