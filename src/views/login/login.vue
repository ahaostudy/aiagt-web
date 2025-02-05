<script setup lang="ts">
import { Progress, useAuthStore } from '@/store/auth.ts'
import { useRouter } from 'vue-router'
import VerificationCode from '@v/login/components/verification-code.vue'
import { ref } from 'vue'
import { loginAPI, registerAPI } from '@/api/user'
import { onEnter } from '@/utils/event.ts'
import { Message } from '@arco-design/web-vue'
import { IconLoading } from '@arco-design/web-vue/es/icon'

document.title = 'Login - Aiagt'

const authStore = useAuthStore()
const router = useRouter()

if (!authStore.email?.length) {
  back()
}

const captcha = ref('')
const nextButtonLoading = ref(false)

async function next() {
  if (captcha.value.length !== 6) {
    Message.error('Please enter the complete verification code.')
    return
  }

  nextButtonLoading.value = true

  try {
    switch (authStore.progress) {
      case Progress.LOGIN:
        const loginResp = await loginAPI({
          email: authStore.email,
          captcha: captcha.value
        })
        authStore.login(loginResp.user, loginResp.token, loginResp.expire)
        break
      case Progress.REGISTER:
        const registerResp = await registerAPI({
          email: authStore.email,
          captcha: captcha.value
        })
        authStore.login(registerResp.user, registerResp.token, registerResp.expire)
        break
    }
  } finally {
    nextButtonLoading.value = false
  }

  await router.push({ path: '/' })
}

function back() {
  router.push({ path: '/auth' })
}
</script>

<template>
  <div class="flex flex-col justify-center items-center w-full h-full gap-8">

    <div class="font-medium text-2xl">Verify your email</div>

    <input
      type="text"
      class="border-solid border h-10 w-full rounded-lg text-center bg-gray-100 text-gray-500 cursor-not-allowed"
      :value="authStore.email"
    >

    <div class="text-gray-600 text-xs">
      The verification code has been sent to your email, please enter the six-digit verification code in your email
    </div>

    <verification-code v-model="captcha" @complete="next" @keydown.enter="(e: Event) => onEnter(e, next)" />

    <div class="w-full flex flex-col gap-4">
      <button
        class="border-solid border h-10 w-full rounded-lg text-center text-gray-500 hover:bg-gray-50 active:bg-gray-200"
        @click="back"
      >
        Back
      </button>
      <button
        class="border-solid bg-blue-700 text-white h-10 w-full rounded-lg text-center hover:bg-blue-600 active:bg-blue-800"
        @click="next"
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
