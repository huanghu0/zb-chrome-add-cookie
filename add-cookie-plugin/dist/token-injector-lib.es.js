import { ref as g, watch as N, onMounted as M, resolveComponent as R, createBlock as $, openBlock as _, unref as r, withCtx as i, createElementVNode as U, createVNode as a, createCommentVNode as O, createTextVNode as D } from "vue";
import { ElCard as F, ElForm as P, ElFormItem as v, ElInput as H, ElText as j, ElInputNumber as W, ElButton as L, ElIcon as z, ElNotification as p } from "element-plus";
import { Loading as K } from "@element-plus/icons-vue";
const G = (k, d) => {
  const w = k.__vccOpts || k;
  for (const [I, h] of d)
    w[I] = h;
  return w;
}, J = { class: "content-container" }, Q = {
  __name: "TokenInjector",
  props: {
    defaultStorageType: {
      type: String,
      default: "cookie"
    },
    defaultTokenName: {
      type: String,
      default: "auth_token"
    },
    defaultExpireHours: {
      type: Number,
      default: 24
    },
    disableExpireInput: {
      type: Boolean,
      default: !1
    }
  },
  setup(k) {
    const d = k, w = (t) => {
      x.isValidDomain(t) ? b.value = x.formatDomain(t) : b.value = "";
    }, I = (t, e, u) => {
      if (!e.trim()) {
        u("请输入目标域名");
        return;
      }
      if (!x.isValidDomain(e)) {
        u("域名格式不合法 支持 abc.com 、 https://test.abc.com）");
        return;
      }
      b.value = x.formatDomain(e), u();
    }, h = g(null), s = g({
      targetDomain: "",
      storageType: d.defaultStorageType,
      tokenName: d.defaultTokenName,
      tokenValue: "",
      expireHours: d.defaultExpireHours
    }), b = g(""), x = {
      /**
       * 验证域名是否合法（支持带协议/不带协议、带端口）
       * @param domain 用户输入的域名（如 doubao.com、https://test.doubao.com:8080）
       */
      isValidDomain(t) {
        return t.trim() ? /^(https?:\/\/)?(([\w-]+\.)+[\w-]+|localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/.test(t) : !1;
      },
      /**
       * 格式化域名：补全协议（默认 https），确保格式正确
       * @param domain 用户输入的域名
       */
      formatDomain(t) {
        let e = t.trim();
        !e.startsWith("http://") && !e.startsWith("https://") && (e = `http://${e}`);
        try {
          return new URL(e).origin;
        } catch {
          return e;
        }
      },
      /**
       * 提取域名的主机名（用于 Cookie 配置）
       * @param domain 格式化后的域名（如 http://test.doubao.com:8080）
       */
      getHostname(t) {
        try {
          return new URL(t).hostname;
        } catch {
          return t;
        }
      }
    }, q = g({
      targetDomain: [
        { required: !0, message: "请输入目标域名", trigger: "blur" },
        { validator: I, trigger: "blur" }
        // 自定义域名校验
      ],
      storageType: [{ required: !0, message: "请选择存储方式", trigger: "change" }],
      tokenName: [{ required: !0, message: "请输入 Token 名称", trigger: "blur" }],
      tokenValue: [{ required: !0, message: "请输入 Token 值", trigger: "blur" }],
      expireHours: [{ required: !0, message: "请输入过期时间", trigger: "blur" }]
    }), E = g(!1), T = g(""), S = g("success"), { disableExpireInput: V } = d;
    N(
      () => d.defaultStorageType,
      (t) => {
        t && !s.value.storageType && (s.value.storageType = t);
      },
      { immediate: !0 }
    ), N(
      () => d.defaultTokenName,
      (t) => {
        t && !s.value.tokenName && (s.value.tokenName = t);
      },
      { immediate: !0 }
    ), N(
      () => d.defaultExpireHours,
      (t) => {
        t !== void 0 && !V && (s.value.expireHours = t);
      },
      { immediate: !0 }
    ), M(() => {
      V && (s.value.expireHours = 0);
    });
    const A = () => {
      h.value?.resetFields(), T.value = "", b.value = "";
    }, B = async () => {
      try {
        await h.value?.validate();
      } catch {
        return;
      }
      E.value = !0, T.value = "";
      try {
        const { storageType: t, tokenName: e, tokenValue: u, expireHours: y } = s.value, o = b.value;
        if (typeof window < "u" && typeof chrome < "u" && chrome.tabs && chrome.cookies)
          if (t == "cookie") {
            const n = new URL(o), l = {
              url: o,
              // 目标域名 origin
              name: e,
              value: u,
              secure: n.protocol === "https:",
              // HTTPS 自动启用 secure
              httpOnly: !1,
              sameSite: "lax",
              path: "/",
              // 全站可用
              domain: x.getHostname(o)
              // 自动提取主机名
            };
            if (y > 0) {
              const m = /* @__PURE__ */ new Date();
              m.setTime(m.getTime() + y * 60 * 60 * 1e3), l.expirationDate = m.getTime() / 1e3;
            }
            await new Promise((m, c) => {
              chrome.cookies.set(l, (C) => {
                if (chrome.runtime.lastError) {
                  const f = chrome.runtime.lastError.message;
                  f.includes("No host permissions") ? c(new Error(`注入失败：无 ${n.origin} 的 Cookie 操作权限，请检查插件 manifest 配置`)) : c(new Error(`注入失败：${f}`));
                  return;
                }
                if (!C) {
                  c(new Error("注入失败：Cookie 设置异常"));
                  return;
                }
                m();
              });
            }), T.value = `✅ 成功注入 Token 到 ${o}！`, S.value = "success", p({
              title: "Success",
              message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${o} 中查看`,
              type: "success"
            });
          } else {
            const [n] = await new Promise((l) => {
              chrome.tabs.query({ url: `${o}/*` }, l);
            });
            if (!n) {
              p({
                title: "Error",
                message: `未找到打开的 ${o} 标签页，请先打开目标域名页面`,
                type: "error"
              });
              return;
            }
            try {
              console.log(n, "targetTab"), await chrome.scripting.executeScript({
                target: { tabId: n.id },
                func: (l, m, c) => {
                  const C = escape(m), f = escape(c);
                  window[l].setItem(C, f);
                },
                args: [t, e, u],
                world: "MAIN"
                // 注入到页面主世界，确保能访问页面存储
              }), p({
                title: "Success",
                message: `Cookie 注入成功，可在开发者工具 Application → ${t} 中查看`,
                type: "success"
              });
            } catch (l) {
              p({
                title: "Error",
                message: `插件注入失败：${l.message}（请检查目标页面是否允许脚本注入）`,
                type: "error"
              });
              return;
            }
          }
        else if (t == "cookie") {
          if (typeof window > "u") {
            p({
              title: "Error",
              message: "当前环境不支持 Cookie 操作",
              type: "error"
            });
            return;
          }
          let n = "";
          const l = new URL(o);
          n = l.hostname;
          const m = l.protocol === "https:";
          let c = `${encodeURIComponent(e)}=${encodeURIComponent(u)}; path=/;`;
          if (y > 0 && !V) {
            const f = /* @__PURE__ */ new Date();
            f.setTime(f.getTime() + y * 60 * 60 * 1e3), c += ` expires=${f.toUTCString()};`;
          }
          if (m && (c += " secure;"), c += " SameSite=Lax;", n !== "localhost" && !n.startsWith("127.0.0.") && (c += ` domain=${n};`), document.cookie = c, !document.cookie.includes(encodeURIComponent(e))) {
            p({
              title: "Error",
              message: "Cookie 注入失败，请检查浏览器 Cookie 设置",
              type: "error"
            });
            return;
          }
          T.value = `✅ 成功注入 Token 到 ${n}！`, S.value = "success", p({
            title: "Success",
            message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${n} 中查看`,
            type: "success"
          });
        } else {
          if (window.location.origin !== o) {
            p({
              title: "Error",
              message: "普通浏览器环境不支持跨域存储操作，请直接在目标页面打开插件",
              type: "error"
            });
            return;
          }
          try {
            const l = escape(key), m = escape(value);
            window[t].setItem(l, m);
          } catch (l) {
            p({
              title: "Error",
              message: `存储操作失败：${l.message}`,
              type: "error"
            });
            return;
          }
          return;
        }
      } catch (t) {
        const e = t instanceof Error ? t.message : "未知错误";
        T.value = `❌ ${e}`, S.value = "error", p({
          title: "Error",
          message: e,
          type: "error"
        });
      } finally {
        E.value = !1;
      }
    };
    return (t, e) => {
      const u = R("el-option"), y = R("el-select");
      return _(), $(r(F), {
        shadow: "hover",
        "body-style": { padding: "20px", minHeight: "300px" }
      }, {
        default: i(() => [
          e[9] || (e[9] = U("h3", { class: "component-title" }, "Token 注入 Cookie 工具", -1)),
          U("div", J, [
            a(r(P), {
              model: s.value,
              rules: q.value,
              ref_key: "formRef",
              ref: h,
              "label-width": "120px",
              class: "form-container"
            }, {
              default: i(() => [
                a(r(v), {
                  label: "目标域名",
                  prop: "targetDomain"
                }, {
                  default: i(() => [
                    a(r(H), {
                      modelValue: s.value.targetDomain,
                      "onUpdate:modelValue": e[0] || (e[0] = (o) => s.value.targetDomain = o),
                      placeholder: "输入目标域名（如 https://doubao.com 或 doubao.com）",
                      clearable: "",
                      onInput: w
                    }, null, 8, ["modelValue"]),
                    a(r(j), {
                      size: "small",
                      type: "info",
                      class: "mt-1 block"
                    }, {
                      default: i(() => [...e[5] || (e[5] = [
                        D(" 支持格式：doubao.com、https://test.doubao.com、http://localhost:8080 ", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                a(r(v), {
                  label: "存储方式",
                  prop: "storageType"
                }, {
                  default: i(() => [
                    a(y, {
                      modelValue: s.value.storageType,
                      "onUpdate:modelValue": e[1] || (e[1] = (o) => s.value.storageType = o),
                      placeholder: "选择存储方式",
                      clearable: ""
                    }, {
                      default: i(() => [
                        a(u, {
                          label: "Cookie",
                          value: "cookie"
                        }),
                        a(u, {
                          label: "LocalStorage",
                          value: "localStorage"
                        }),
                        a(u, {
                          label: "SessionStorage",
                          value: "sessionStorage"
                        })
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                a(r(v), {
                  label: "Token 名称",
                  prop: "tokenName"
                }, {
                  default: i(() => [
                    a(r(H), {
                      modelValue: s.value.tokenName,
                      "onUpdate:modelValue": e[2] || (e[2] = (o) => s.value.tokenName = o),
                      placeholder: "输入后端需要的 Cookie 键名（如 auth_token）",
                      clearable: ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                a(r(v), {
                  label: "Token 值",
                  prop: "tokenValue"
                }, {
                  default: i(() => [
                    a(r(H), {
                      modelValue: s.value.tokenValue,
                      "onUpdate:modelValue": e[3] || (e[3] = (o) => s.value.tokenValue = o),
                      placeholder: "输入后端生成的有效 Token 字符串",
                      type: "textarea",
                      rows: 3,
                      clearable: ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                r(V) ? O("", !0) : (_(), $(r(v), {
                  key: 0,
                  label: "过期时间",
                  prop: "expireHours"
                }, {
                  default: i(() => [
                    a(r(W), {
                      modelValue: s.value.expireHours,
                      "onUpdate:modelValue": e[4] || (e[4] = (o) => s.value.expireHours = o),
                      min: 0,
                      step: 1,
                      suffix: "小时",
                      "controls-position": "right"
                    }, null, 8, ["modelValue"]),
                    a(r(j), {
                      size: "small",
                      type: "info",
                      class: "expire-tip"
                    }, {
                      default: i(() => [...e[6] || (e[6] = [
                        D(" 0 表示会话级 Cookie（关闭浏览器失效） ", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  _: 1
                })),
                a(r(v), null, {
                  default: i(() => [
                    a(r(L), {
                      type: "primary",
                      onClick: B,
                      loading: E.value
                    }, {
                      default: i(() => [
                        E.value ? (_(), $(r(z), { key: 0 }, {
                          default: i(() => [
                            a(r(K))
                          ]),
                          _: 1
                        })) : O("", !0),
                        e[7] || (e[7] = D(" 注入 Cookie ", -1))
                      ]),
                      _: 1
                    }, 8, ["loading"]),
                    a(r(L), {
                      type: "text",
                      onClick: A,
                      class: "ml-2"
                    }, {
                      default: i(() => [...e[8] || (e[8] = [
                        D("重置", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["model", "rules"])
          ])
        ]),
        _: 1
      });
    };
  }
}, X = /* @__PURE__ */ G(Q, [["__scopeId", "data-v-6f695907"]]), oe = {
  install: (k) => {
    k.component("TokenInjector", X);
  }
};
export {
  X as TokenInjector,
  oe as default
};
