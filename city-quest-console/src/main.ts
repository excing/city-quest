/**
 * Callers: index.html. Console entry.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')
