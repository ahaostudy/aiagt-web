import { defineStore } from 'pinia'
import { ref } from 'vue'
import { User } from '@/models/user'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/utils/local_storage.ts'
import { Time } from '@/models/base'
import { Message } from '@arco-design/web-vue'
import router from '@/router'

export enum Progress {
  SEND_CAPTCHA,
  REGISTER,
  LOGIN,
}

const userTokenKey = 'USER_TOKEN'
const userInfoKey = 'USER_INFO'

export const useAuthStore = defineStore('auth', () => {
  const progress = ref(Progress.SEND_CAPTCHA)
  const email = ref('')
  const userinfo = ref({} as User)
  const token = ref('')
  const expire = ref<Time>()


  function login(userInfo: User, userToken: string, tokenExpire: Time) {
    token.value = userToken
    userinfo.value = userInfo
    expire.value = tokenExpire

    setLocalStorage(userInfoKey, userinfo.value)
    setLocalStorage(userTokenKey, {
      token: token.value,
      expire: expire.value
    })
  }

  function loggedIn(): boolean {
    return !!userinfo?.value?.id;
  }

  function verifyLoggedIn(): boolean {
    if (!userinfo?.value?.id) {
      Message.error('please login first')
      router.push('/auth')
      return false
    }

    return true
  }

  function logout() {
    token.value = ''
    userinfo.value = {} as User

    removeLocalStorage(userTokenKey)
    removeLocalStorage(userInfoKey)

    router.push('/auth')
  }

  function loadUserInfo() {
    const tokenInfo = getLocalStorage<{ token: string; expire: Time }>(userTokenKey)
    const userInfo = getLocalStorage<User>(userInfoKey)

    if (tokenInfo && userInfo) {
      token.value = tokenInfo.token
      expire.value = tokenInfo.expire
      userinfo.value = userInfo
    }
  }

  function getToken(): string | null {
    if (!token.value || !expire.value) return null

    const exp = new Time(expire.value)
    if (exp.expired()) return null

    return token.value
  }

  loadUserInfo()

  return { progress, email, userinfo, login, loggedIn, verifyLoggedIn, logout, loadUserInfo, getToken }
})