import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/vote/:id',
      name: 'vote',
      component: () => import('@/views/VoteView.vue'),
      props: true,
    },
    {
      path: '/admin/:id',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      props: true,
      beforeEnter: (to) => {
        const id = to.params.id as string
        const token = (to.query.token as string) || localStorage.getItem(`admin_token_${id}`)
        if (!token) {
          return { name: 'vote', params: { id } }
        }
      },
    },
    {
      path: '/results/:id',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
