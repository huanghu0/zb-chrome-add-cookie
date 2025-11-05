import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css'; // 可选：暗色模式

// 导入自定义组件
import TokenInjector from './components/TokenInjector/index.js';

// 导出组件库（支持按需引入和全量引入）
export { TokenInjector };


export default {
  install: (app) => {
    app.component('TokenInjector', TokenInjector);
  }
};