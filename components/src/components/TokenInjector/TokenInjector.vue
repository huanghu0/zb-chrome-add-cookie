<template>
  <el-card shadow="hover" :body-style="{ padding: '20px', minHeight: '300px' }">
    <h3 class="component-title">Token 注入 Cookie 工具</h3>
    
    <!-- 核心：居中容器（表单+报错提示的父容器） -->
    <div class="content-container">
      <!-- 表单部分（保持不变） -->
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px" class="form-container">
        <el-form-item label="Token 名称" prop="tokenName">
          <el-input
            v-model="form.tokenName"
            placeholder="输入后端需要的 Cookie 键名（如 auth_token）"
            clearable
          />
        </el-form-item>
        <el-form-item label="Token 值" prop="tokenValue">
          <el-input
            v-model="form.tokenValue"
            placeholder="输入后端生成的有效 Token 字符串"
            type="textarea"
            :rows="3"
            clearable
          />
        </el-form-item>
        <el-form-item label="过期时间" prop="expireHours" v-if="!disableExpireInput">
          <el-input-number
            v-model="form.expireHours"
            :min="0"
            :step="1"
            suffix="小时"
            controls-position="right"
          />
          <el-text size="small" type="info" class="expire-tip">
            0 表示会话级 Cookie（关闭浏览器失效）
          </el-text>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleInject" :loading="isInjecting">
            <el-icon v-if="isInjecting"><Loading /></el-icon>
            注入 Cookie
          </el-button>
          <el-button type="text" @click="handleReset" class="ml-2">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElAlert, ElCard, ElForm, ElFormItem, ElInput, ElInputNumber, ElButton, ElText, ElIcon,ElNotification } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

// 组件 Props
const props = defineProps({
  defaultTokenName: {
    type:String,
    default:'auth_token'
  },
  defaultExpireHours:{
    type:Number,
    default:24
  },
  disableExpireInput:{
    type:Boolean,
    default:false
  }
});

// 表单相关
const formRef = ref(null);
const form = ref({
  tokenName: props.defaultTokenName,
  tokenValue: '',
  expireHours: props.defaultExpireHours
});

// 表单校验规则
const formRules = ref({
  tokenName: [{ required: true, message: '请输入 Token 名称', trigger: 'blur' }],
  tokenValue: [{ required: true, message: '请输入 Token 值', trigger: 'blur' }],
  expireHours: [{ required: true, message: '请输入过期时间', trigger: 'blur' }]
});

// 状态管理
const isInjecting = ref(false); // 注入加载状态
const message = ref(''); // 结果提示信息
const messageType = ref('success'); // 提示类型
const { disableExpireInput } = props;

// 监听 props 变化（支持动态更新默认值）
watch(
  () => props.defaultTokenName,
  (newVal) => {
    if (newVal && !form.value.tokenName) {
      form.value.tokenName = newVal;
    }
  },
  { immediate: true }
);

watch(
  () => props.defaultExpireHours,
  (newVal) => {
    if (newVal !== undefined && !disableExpireInput) {
      form.value.expireHours = newVal;
    }
  },
  { immediate: true }
);

// 初始化：如果禁用过期时间，强制设为 0
onMounted(() => {
  if (disableExpireInput) {
    form.value.expireHours = 0;
  }
});

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields();
  message.value = '';
};

// 核心：注入 Cookie 逻辑
const handleInject = async () => {
  // 1. 表单校验（保持不变）
  try {
    await formRef.value?.validate();
  } catch (error) {
    return;
  }

  isInjecting.value = true;
  message.value = '';

  try {
    const { tokenName, tokenValue, expireHours } = form.value;
    let currentDomain = '';

    // 2. 自动检测环境：是否为 Chrome 插件环境
    const isChromeExtension = typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.tabs && chrome.cookies;

    if (isChromeExtension) {
      // 👉 环境 1：Chrome 插件环境（使用 Chrome API，功能更完善）
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab.url) {
        throw new Error('无法获取当前页面 URL，请刷新页面后重试');
      }
      const urlObj = new URL(currentTab.url);
      currentDomain = urlObj.hostname;

      // 构造 Chrome Cookie 参数
      const cookieParams = {
        url: urlObj.origin,
        name: tokenName,
        value: tokenValue,
        secure: urlObj.protocol === 'https:',
        httpOnly: false,
        sameSite: 'lax',
        path: '/'
      };

      // 设置过期时间
      if (expireHours > 0 && !disableExpireInput) {
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + expireHours * 60 * 60 * 1000);
        cookieParams.expirationDate = expirationDate.getTime() / 1000;
      }

      // 调用 Chrome API 注入 Cookie
      await new Promise((resolve, reject) => {
        chrome.cookies.set(cookieParams, (cookie) => {
          if (chrome.runtime.lastError) {
            const errMsg = chrome.runtime.lastError.message;
            // 权限错误特殊提示
            if (errMsg.includes('No host permissions')) {
              reject(new Error(`注入失败：无 ${urlObj.origin} 的 Cookie 操作权限，请检查插件 manifest 配置`));
            } else {
              reject(new Error(`注入失败：${errMsg}`));
            }
            return;
          }
          if (!cookie) {
            reject(new Error('注入失败：Cookie 设置异常'));
            return;
          }
          resolve();
        });
      });
    } else {
      // 👉 环境 2：非 Chrome 插件环境（本地 Vue3 项目、普通浏览器，使用 document.cookie）
      if (typeof window === 'undefined') {
        throw new Error('当前环境不支持 Cookie 操作');
      }

      const urlObj = new URL(window.location.href);
      currentDomain = urlObj.hostname;
      const isHttps = urlObj.protocol === 'https:';

      // 构造 Cookie 字符串（符合浏览器原生格式）
      let cookieStr = `${encodeURIComponent(tokenName)}=${encodeURIComponent(tokenValue)}; path=/;`;

      // 添加过期时间（0 为会话级，不设置 expires）
      if (expireHours > 0 && !disableExpireInput) {
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + expireHours * 60 * 60 * 1000);
        cookieStr += ` expires=${expirationDate.toUTCString()};`;
      }

      // 添加 secure 标记（仅 HTTPS 环境）
      if (isHttps) {
        cookieStr += ' secure;';
      }

      // 添加 sameSite 策略
      cookieStr += ' SameSite=Lax;';

      // 特殊处理：localhost 不设置 domain（否则 Cookie 无法生效）
      if (currentDomain !== 'localhost' && !currentDomain.startsWith('127.0.0.')) {
        cookieStr += ` domain=${currentDomain};`;
      }

      // 注入 Cookie（原生 API）
      document.cookie = cookieStr;

      // 验证 Cookie 是否注入成功（可选）
      const isSuccess = document.cookie.includes(encodeURIComponent(tokenName));
      if (!isSuccess) {
        throw new Error('Cookie 注入失败，请检查浏览器 Cookie 设置');
      }
    }

    // 3. 成功提示（双环境通用）
    message.value = `✅ 成功注入 Token 到 ${currentDomain}！`;
    messageType.value = 'success';
    ElNotification({
      title: 'Success',
      message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${currentDomain} 中查看`,
      type: 'success',      
    })
  } catch (error) {
    // 4. 错误处理（双环境通用）
    const errMsg = error instanceof Error ? error.message : '未知错误';
    message.value = `❌ ${errMsg}`;
    messageType.value = 'error';
    ElNotification({
      title: 'Error',
      message: errMsg,
      type: 'error',
    })    
  } finally {
    isInjecting.value = false;
  }
};
</script>

<style scoped>
/* 原有样式保持不变 */
.component-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}
.expire-tip {
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
}
.ml-2 {
  margin-left: 8px;
}

/* 新增：内容容器（Flex 布局，让报错提示垂直+水平居中） */
.content-container {
  position: relative; /* 作为报错提示的定位父容器 */
  width: 100%;
  min-height: 220px; /* 最小高度，确保报错提示有足够空间居中 */
  display: flex;
  flex-direction: column;
}

/* 表单容器（确保表单正常布局） */
.form-container {
  width: 100%;
}

/* 关键：报错提示居中样式 */
.error-alert {
  position: absolute; /* 绝对定位，脱离文档流 */
  top: 50%; /* 垂直居中 */
  left: 50%; /* 水平居中 */
  transform: translate(-50%, -50%); /* 精准居中（抵消自身宽高） */
  width: 80%; /* 限制宽度，避免过宽 */
  z-index: 10; /* 层级高于表单，确保可见 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 增加阴影，突出显示 */
}

/* 成功提示样式（保持在表单下方） */
.success-alert {
  width: 100%;
}
</style>