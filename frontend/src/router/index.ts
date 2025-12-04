import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Home from '@/pages/HelloWorld.vue'


const routes: Array<RouteRecordRaw> = [
    { path: '/', name: 'home', component: Home },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router