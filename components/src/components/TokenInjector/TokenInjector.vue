<template>
  <el-card shadow="hover" :body-style="{ padding: '20px', minHeight: '300px' }">
    <h3 class="component-title">Token 注入 Cookie 工具</h3>
    
    <!-- 核心：居中容器（表单+报错提示的父容器） -->
    <div class="content-container">
      <!-- 表单部分（保持不变） -->
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px" class="form-container">
        <!-- 目标域名输入（新增核心） -->
        <el-form-item label="目标域名" prop="targetDomain">
          <el-input
            v-model="form.targetDomain"
            placeholder="输入目标域名（如 https://doubao.com 或 doubao.com）"
            clearable
            @input="handleDomainInput"
          />
          <el-text size="small" type="info" class="mt-1 block">
            支持格式：doubao.com、https://test.doubao.com、http://localhost:8080
          </el-text>
        </el-form-item>  
        <!-- 存储方式选择 -->
        <el-form-item label="存储方式" prop="storageType">
          <el-select
            v-model="form.storageType"
            placeholder="选择存储方式"
            clearable
          >
            <el-option label="Cookie" value="cookie" />
            <el-option label="LocalStorage" value="localStorage" />
            <el-option label="SessionStorage" value="sessionStorage" />
          </el-select>
        </el-form-item>        
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
  defaultStorageType:{
    type:String,
    default:'cookie'
  },
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

// 域名输入处理：实时格式化
const handleDomainInput = (val) => {
  if (DomainValidator.isValidDomain(val)) {
    formattedDomain.value = DomainValidator.formatDomain(val);
  } else {
    formattedDomain.value = '';
  }
};

// 自定义校验：域名合法性
const validateDomain = (rule, value, callback) => {
  if (!value.trim()) {
    callback('请输入目标域名');
    return;
  }
  if (!DomainValidator.isValidDomain(value)) {
    callback('域名格式不合法 支持 abc.com 、 https://test.abc.com）');
    return;
  }
  formattedDomain.value = DomainValidator.formatDomain(value);
  callback();
};


// 表单相关
const formRef = ref(null);
const form = ref({
  targetDomain:'',
  storageType: props.defaultStorageType,
  tokenName: props.defaultTokenName,
  tokenValue: '',
  expireHours: props.defaultExpireHours
});

const formattedDomain = ref('')

const DomainValidator = {
  /**
   * 验证域名是否合法（支持带协议/不带协议、带端口）
   * @param domain 用户输入的域名（如 doubao.com、https://test.doubao.com:8080）
   */
  isValidDomain(domain) {
    if (!domain.trim()) return false;
    // 简化版域名正则：支持协议、子域名、端口、路径
    const domainReg = /^(https?:\/\/)?(([\w-]+\.)+[\w-]+|localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/;
    return domainReg.test(domain);
  },

  /**
   * 格式化域名：补全协议（默认 https），确保格式正确
   * @param domain 用户输入的域名
   */
  formatDomain(domain) {
    let formatted = domain.trim();
    // 补全协议（无协议时默认 http）
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    // 处理端口和路径（确保 URL 格式完整）
    try {
      const urlObj = new URL(formatted);
      return urlObj.origin; // 返回 origin（协议+域名+端口），避免路径干扰
    } catch (error) {
      return formatted;
    }
  },

  /**
   * 提取域名的主机名（用于 Cookie 配置）
   * @param domain 格式化后的域名（如 http://test.doubao.com:8080）
   */
  getHostname(domain) {
    try {
      return new URL(domain).hostname;
    } catch (error) {
      return domain;
    }
  }
};

// 表单校验规则
const formRules = ref({
  targetDomain: [
    { required: true, message: '请输入目标域名', trigger: 'blur' },
    { validator: validateDomain, trigger: 'blur' } // 自定义域名校验
  ],  
  storageType: [{ required: true, message: '请选择存储方式', trigger: 'change' }],
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
  () => props.defaultStorageType,
  (newVal) => {
    if (newVal && !form.value.storageType) {
      form.value.storageType = newVal;
    }
  },
  { immediate: true }
);

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
  formattedDomain.value = '';
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
    const { storageType, tokenName, tokenValue, expireHours } = form.value;
    
    const targetOrigin = formattedDomain.value;
    // 2. 自动检测环境：是否为 Chrome 插件环境
    const isChromeExtension = typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.tabs && chrome.cookies;

    if (isChromeExtension) {
      if(storageType == 'cookie'){
        const urlObj = new URL(targetOrigin);
        const cookieParams = {
          url: targetOrigin, // 目标域名 origin
          name: tokenName,
          value: tokenValue,
          secure: urlObj.protocol === 'https:', // HTTPS 自动启用 secure
          httpOnly: false,
          sameSite: 'lax',
          path: '/', // 全站可用
          domain: DomainValidator.getHostname(targetOrigin) // 自动提取主机名
        };

        // 设置过期时间（0 为会话级）
        if (expireHours > 0) {
          const expirationDate = new Date();
          expirationDate.setTime(expirationDate.getTime() + expireHours * 60 * 60 * 1000);
          cookieParams.expirationDate = expirationDate.getTime() / 1000; // 秒级时间戳
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

        // 3. 成功提示（双环境通用）
        message.value = `✅ 成功注入 Token 到 ${targetOrigin}！`;
        messageType.value = 'success';
        ElNotification({
          title: 'Success',
          message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${targetOrigin} 中查看`,
          type: 'success',      
        })

      }else{
        // 检查目标域名是否已打开标签页
        const [targetTab] = await new Promise((resolve) => {
          chrome.tabs.query({ url: `${targetOrigin}/*` }, resolve);
        });

        if (!targetTab) {
          ElNotification({
            title: 'Error',
            message: `未找到打开的 ${targetOrigin} 标签页，请先打开目标域名页面`,
            type: 'error',
          })          
          return          
        }

        // 通过 scripting API 注入脚本（V3 推荐，替代 executeScript）
        try {
          console.log(targetTab,'targetTab')
          await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            func: (storageType, key, value) => {
              const safeKey = escape(key);
              const safeValue = escape(value);
              window[storageType].setItem(safeKey, safeValue);
            },
            args: [storageType, tokenName, tokenValue],
            world: 'MAIN' // 注入到页面主世界，确保能访问页面存储
          });
          ElNotification({
            title: 'Success',
            message: `Cookie 注入成功，可在开发者工具 Application → ${storageType} 中查看`,
            type: 'success',      
          }) 
          // await injectToStorageByExtension(storageType,tokenName,tokenValue,expireHours)
        } catch (err) {
          ElNotification({
            title: 'Error',
            message: `插件注入失败：${err.message}（请检查目标页面是否允许脚本注入）`,
            type: 'error',
          })          
          return           
        }  
      }
    } else {
      if(storageType == 'cookie'){
        // 👉 环境 2：非 Chrome 插件环境（本地 Vue3 项目、普通浏览器，使用 document.cookie）
        if (typeof window === 'undefined') {
          ElNotification({
            title: 'Error',
            message: '当前环境不支持 Cookie 操作',
            type: 'error',
          })          
          return            
        }
        let currentDomain = '';targetOrigin
        const urlObj = new URL(targetOrigin);
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
          ElNotification({
            title: 'Error',
            message: 'Cookie 注入失败，请检查浏览器 Cookie 设置',
            type: 'error',
          })          
          return           
        }   
        
        // 3. 成功提示（双环境通用）
        message.value = `✅ 成功注入 Token 到 ${currentDomain}！`;
        messageType.value = 'success';
        ElNotification({
          title: 'Success',
          message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${currentDomain} 中查看`,
          type: 'success',      
        })        

      }else{
        const currentOrigin = window.location.origin;
        if (currentOrigin !== targetOrigin) {
          ElNotification({
            title: 'Error',
            message: '普通浏览器环境不支持跨域存储操作，请直接在目标页面打开插件',
            type: 'error',
          })          
          return            
        }
        // 直接操作当前页面存储
        try {
          const safeKey = escape(key);
          const safeValue = escape(value);
          window[storageType].setItem(safeKey, safeValue);
        } catch (err) {
          ElNotification({
            title: 'Error',
            message: `存储操作失败：${err.message}`,
            type: 'error',
          })          
          return          
        }
        return;
      }
    }
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


// 直接操作存储（普通浏览器环境，当前页面）
const injectToStorageDirectly = (
  storageType,
  key,
  value
) => {
  try {
    // 处理特殊字符（避免存储失败）
    const safeKey = escape(key);
    const safeValue = escape(value);
    window[storageType].setItem(safeKey, safeValue);
    
    ElNotification({
      title: 'Success',
      message: `Cookie 注入成功，可在开发者工具 Application → ${storageType} 中查看`,
      type: 'success',      
    })       
  } catch (err) {
    throw new Error(`存储操作失败：${err.message}`);
  }
};

// 通过 Chrome 插件 API 注入到目标页面存储（popup 环境）
const injectToStorageByExtension = async (
  storageType,
  key,
  value,
  origin
) => {
  return new Promise((resolve, reject) => {
    // 向当前页面注入脚本，执行存储操作（跨域/跨页面需通过 executeScript）
    chrome.tabs.executeScript(
      {
        code: `
          try {
            const safeKey = escape('${escape(key)}');
            const safeValue = escape('${escape(value)}');
            ${storageType}.setItem(safeKey, safeValue);
            console.log('Token 注入成功（Chrome 插件）：', '${key}');
          } catch (err) {
            console.error('存储注入失败（Chrome 插件）：', err);
            throw err;
          }
        `,
        runAt: 'document_idle'
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (results?.[0] === false) {
          reject(new Error('无法访问当前页面的存储，请检查页面权限或刷新页面'));
          return;
        }
        ElNotification({
          title: 'Success',
          message: `Cookie 注入成功，可在开发者工具 Application → ${storageType} 中查看`,
          type: 'success',      
        })         
        resolve();
      }
    );
  });
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