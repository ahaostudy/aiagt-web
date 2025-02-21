import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import { type IStaticMethods } from 'flyonui/flyonui'

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

const AuthLayout = () => import('@/layout/auth/auth-layout.vue')
const Auth = () => import('@v/auth/auth.vue')
const Login = () => import('@v/login/login.vue')

const HomeLayout = () => import('@/layout/home/home-layout.vue')
const Personal = () => import('@v/personal/personal.vue')
const PersonalApplication = () => import('@v/personal/application.vue')
const PersonalPlugin = () => import('@v/personal/plugin.vue')

const ApplicationDev = () => import('@v/personal/application/application.vue')
const PluginDev = () => import('@v/personal/plugin/plugin.vue')

const AppChat = () => import('@v/app-chat/app-chat.vue')
const Application = () => import('@v/application/application.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        component: Auth
      },
      {
        path: 'login',
        component: Login
      }
    ]
  },
  {
    path: '/',
    component: HomeLayout,
    children: [
      {
        path: '',
        component: Application
      },
      {
        path: 'application/',
        component: Application
      },
      {
        path: 'personal/',
        component: Personal,
        children: [
          {
            path: '',
            component: PersonalApplication
          },
          {
            path: 'application',
            component: PersonalApplication
          },
          {
            path: 'plugin',
            component: PersonalPlugin
          }
        ]
      }
    ]
  },
  {
    path: '/app/space/:id',
    component: ApplicationDev
  },
  {
    path: '/plugin/space/:key',
    component: PluginDev
  },
  {
    path: '/app/:id',
    component: AppChat
  },
  {
    path: '/app/:id/:conversation_id',
    component: AppChat
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.afterEach((_, __, failure) => {
  if (!failure) {
    setTimeout(() => {
      window.HSStaticMethods.autoInit()
    }, 100)
  }
})

export default router
