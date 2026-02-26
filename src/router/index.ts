import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/stroop',
      name: 'stroop',
      component: () => import('../views/StroopView.vue')
    },
    {
      path: '/matchsticks',
      name: 'matchsticks',
      component: () => import('../views/MatchstickView.vue')
    },
  ]
})

export default router