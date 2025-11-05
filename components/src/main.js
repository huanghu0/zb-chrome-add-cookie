import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import TokenInjector from './index.js';

const app = createApp(App)
app.use(ElementPlus)
app.use(TokenInjector); // 全局注册组件
app.mount('#app')
