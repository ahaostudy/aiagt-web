<script setup lang="ts">
import AiagtLong from '@c/aiagt/aiagt-long.vue'
import Search from '@/layout/home/components/search.vue'
import { IconApp, IconPlugin, IconKnowledge, IconHome, IconDevelop } from '@arco-iconbox/vue-aiagt'
import { IconUser, IconSettings } from '@arco-design/web-vue/es/icon'
import { useHomeStore } from '@/store/home.ts'
import { eq } from '@/utils'
import '@/assets/font/font.css'
import Sidebar from '@/layout/home/components/sidebar.vue'
import { useAuthStore } from '@/store/auth.ts'
import AiList from '@c/ai-list/ai-list.vue'
import AiListItem from '@c/ai-list/ai-list-item/ai-list-item.vue'
import { useRouter } from 'vue-router'
import AiagtText from '@c/aiagt/aiagt-text.vue'
import { asset } from '@/models/assets'

const homeStore = useHomeStore()
const authStore = useAuthStore()

const router = useRouter()


import { AestheticFluidBg } from '@/libs/AestheticFluidBg.module.js'
import { onMounted } from 'vue'
import SecretConfig from '@/layout/home/components/secret-config.vue'

onMounted(() => {
  new AestheticFluidBg({
    dom: 'home-layout',
    colors: ['#F9F5FD', '#edf3fb', '#fffeef', '#fdeef8'],
    seed: 2900,
    loop: true
  })
})
</script>

<template>
  <div class="home-layout h-screen flex p-1.5" id="home-layout">
    <div class="min-w-48 p-3.5 pl-2 flex flex-col justify-between" style="position: relative; z-index: 1">
      <div class="flex flex-col gap-5">
        <aiagt-long class="w-25" />
        <search v-model="homeStore.searchText" />

        <sidebar position="top">
          <template #icons="{ icon, focused }">
            <icon-app
              :span="true" v-if="eq(icon, 'app')"
              class="text-lg stroke-[6] transition duration-300"
              :class="{'text-blue-700': focused}"
            />
            <icon-plugin
              v-else-if="eq(icon, 'plugin')"
              class="text-lg stroke-[8] transition duration-300"
              :class="{'text-blue-700': focused}"
            />
            <icon-knowledge
              v-else-if="eq(icon, 'knowledge')"
              class="text-lg stroke-[10] transition duration-300"
              :class="{'text-blue-700': focused}"
            />
            <icon-home
              v-else-if="eq(icon, 'home')"
              class="text-md stroke-[5] transition duration-300"
              :class="{'text-blue-700': focused}"
            />
            <icon-develop
              v-else-if="eq(icon, 'develop')"
              class="text-lg stroke-[5] transition duration-300"
              :class="{'text-blue-700': focused}"
            />
          </template>
        </sidebar>
      </div>

      <div class="flex flex-col gap-4">
        <sidebar position="bottom">
          <template #icons="{ icon, focused }">
            <icon-user
              v-if="eq(icon, 'user')"
              class="text-lg transition duration-300"
              :class="{'!text-blue-700': focused}"
            />
            <icon-settings
              v-else-if="eq(icon, 'settings')"
              class="text-lg transition duration-300"
              :class="{'!text-blue-700': focused}"
            />
          </template>
        </sidebar>

        <a-trigger
          v-if="authStore.userinfo?.id"
          trigger="click"
          position="tl"
          :unmount-on-close="false"
          :popup-translate="[0, -5]"
        >
          <div
            class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white active:scale-[.98] cursor-pointer transition"
          >
            <img :src="asset(authStore.userinfo.avatar)" :alt="authStore.userinfo.username"
                 class="w-6 h-6 rounded-full bg-white">
            <div
              class="flex flex-col gap-1"
            >
              <div
                class="text-black text-[14px]"
                style="font-family: KumbhSans,serif"
              >
                {{ authStore.userinfo.username }}
              </div>
              <div class="text-[11px] text-gray-500">
                {{ authStore.userinfo.email }}
              </div>
            </div>
          </div>
          <template #content>
            <ai-list class="!bg-white !rounded-lg !p-1 border-[0.5px]">
              <ai-list-item
                class="hover:!bg-gray-100 !rounded-md !px-1"
                inner-class="!pl-2 !pr-3 !justify-start !py-2 !gap-3 text-gray-800"
              >
                <img :src="asset(authStore.userinfo.avatar)" :alt="authStore.userinfo.username"
                     class="w-8 h-8 rounded-full bg-white">
                <div
                  class="flex flex-col gap-2"
                >
                  <div
                    class="text-black text-[14px]"
                    style="font-family: KumbhSans,serif"
                  >
                    {{ authStore.userinfo.username }}
                  </div>
                  <div class="text-[11px] text-gray-500">
                    {{ authStore.userinfo.email }}
                  </div>
                </div>
              </ai-list-item>
              <a-trigger
                position="rb"
                trigger="click"
                auto-fit-position
                unmount-on-close
                :popup-translate="[10, 20]"
              >
                <ai-list-item
                  class="hover:!bg-gray-100 !rounded-md !px-1"
                  inner-class="!px-3.5 !py-2.5 !justify-start !gap-2 font-medium !text-gray-600"
                >
                  <div class="text-[16px]">
                    <icon-import stroke-linecap="round" stroke-linejoin="round" />
                  </div>
                  Secrets
                </ai-list-item>
                <template #content>
                  <secret-config />
                </template>
              </a-trigger>
              <ai-list-item
                class="hover:!bg-gray-100 !rounded-md !px-1"
                inner-class="!px-3.5 !py-2.5 !justify-start !gap-2 font-medium !text-gray-600"
                @click="authStore.logout()"
              >
                <div class="text-[16px]">
                  <icon-import stroke-linecap="round" stroke-linejoin="round" />
                </div>
                Logout
              </ai-list-item>
            </ai-list>
          </template>
        </a-trigger>

        <div
          class="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white active:scale-[.98] cursor-pointer transition !text-gray-700"
          @click="router.push('/auth')"
          v-else
        >
          <div>
            <icon-export :stroke-width="5" stroke-linejoin="round" />
          </div>
          <div
            class="text-sm font-medium"
            style="font-family: KumbhSans,serif"
          >
            Login
          </div>
          <aiagt-text class="w-12 h-4 mt-0.5" />
        </div>
      </div>
    </div>

    <div class="w-full h-full overflow-auto bg-white flex-1 rounded-lg min-w-[520px] shadow-md shadow-gray-300"
         style="position: relative; z-index: 1">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  background: linear-gradient(#F9F5FD, #FAF2FC 35%, #F0F6FE);
}
</style>