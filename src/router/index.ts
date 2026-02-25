import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StroopView from '../views/StroopView.vue'
import MatchstickView from '../views/MatchstickView.vue'

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
      component: StroopView
    },
    {
      path: '/matchsticks',
      name: 'matchsticks',
      component: MatchstickView
    },
  ]
})

export default router