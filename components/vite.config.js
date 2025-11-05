import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // 库模式
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'TokenInjectorComponent',           // UMD 模块的全局变量名
      fileName: (format) => `token-injector-lib.${format}.js`,
      formats: ['cjs', 'es', 'umd'] // 支持 cjs, esm, umd
    },
    rollupOptions: {
      // 排除外部依赖（让用户项目自行引入）
      external: ['vue', 'element-plus', '@element-plus/icons-vue'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@element-plus/icons-vue': 'ElementPlusIconsVue'
        }
      }
    },
    outDir: 'dist' // 输出目录
  },
  // ✅ 关键：替换 process.env.NODE_ENV
  define: {
    'process.env.NODE_ENV': '"production"' // 注意是字符串中的字符串
  }    
})
