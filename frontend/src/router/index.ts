import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Home from '@/pages/Home.vue'
import NexusForm from '@/pages/NexusForm.vue'
import Confirmation from '@/pages/Confirmation.vue'

const routes: Array<RouteRecordRaw> = [
    { path: '/', name: 'home', component: Home },
    { path: '/form', name: 'form', component: NexusForm },
    { path: '/confirmation', name: 'confirmation', component: Confirmation },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router