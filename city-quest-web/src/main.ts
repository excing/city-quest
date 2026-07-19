import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initAppContext } from './app-context'
import 'leaflet/dist/leaflet.css'
import './styles/tokens.css'
import './styles/base.css'

initAppContext()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
