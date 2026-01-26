import { createRouter, createWebHashHistory } from 'vue-router'
import StroopView from '../views/StroopView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: StroopView
    },
  ]
})

export default router