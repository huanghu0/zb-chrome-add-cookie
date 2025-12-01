import { ref as k, watch as S, onMounted as B, resolveComponent as H, createBlock as _, openBlock as $, unref as l, withCtx as i, createElementVNode as R, createVNode as o, createCommentVNode as U, createTextVNode as D } from "vue";
import { ElCard as M, ElForm as F, ElFormItem as v, ElInput as O, ElText as j, ElInputNumber as P, ElButton as L, ElIcon as W, ElNotification as p } from "element-plus";
import { Loading as K } from "@element-plus/icons-vue";
const G = (y, d) => {
  const w = y.__vccOpts || y;
  for (const [I, x] of d)
    w[I] = x;
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
  setup(y) {
    const d = y, w = (t) => {
      b.isValidDomain(t) ? h.value = b.formatDomain(t) : h.value = "";
    }, I = (t, e, s) => {
      if (!e.trim()) {
        s("请输入目标域名");
        return;
      }
      if (!b.isValidDomain(e)) {
        s("域名格式不合法 支持 abc.com 、 https://test.abc.com）");
        return;
      }
      h.value = b.formatDomain(e), s();
    }, x = k(null), a = k({
      targetDomain: "",
      storageType: d.defaultStorageType,
      tokenName: d.defaultTokenName,
      tokenValue: "",
      expireHours: d.defaultExpireHours
    }), h = k(""), b = {
      /**
       * 验证域名是否合法（支持带协议/不带协议、带端口）
       * @param domain 用户输入的域名（如 xxx.com、https://test.xxx.com:8080）
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
       * @param domain 格式化后的域名（如 http://test.xxx.com:8080）
       */
      getHostname(t) {
        try {
          return new URL(t).hostname;
        } catch {
          return t;
        }
      }
    }, q = k({
      targetDomain: [
        { required: !0, message: "请输入目标域名", trigger: "blur" },
        { validator: I, trigger: "blur" }
        // 自定义域名校验
      ],
      storageType: [{ required: !0, message: "请选择存储方式", trigger: "change" }],
      tokenName: [{ required: !0, message: "请输入 Token 名称", trigger: "blur" }],
      tokenValue: [{ required: !0, message: "请输入 Token 值", trigger: "blur" }],
      expireHours: [{ required: !0, message: "请输入过期时间", trigger: "blur" }]
    }), E = k(!1), T = k(""), N = k("success"), { disableExpireInput: V } = d;
    S(
      () => d.defaultStorageType,
      (t) => {
        t && !a.value.storageType && (a.value.storageType = t);
      },
      { immediate: !0 }
    ), S(
      () => d.defaultTokenName,
      (t) => {
        t && !a.value.tokenName && (a.value.tokenName = t);
      },
      { immediate: !0 }
    ), S(
      () => d.defaultExpireHours,
      (t) => {
        t !== void 0 && !V && (a.value.expireHours = t);
      },
      { immediate: !0 }
    ), B(() => {
      V && (a.value.expireHours = 0);
    });
    const z = () => {
      x.value?.resetFields(), T.value = "", h.value = "";
    }, A = async () => {
      try {
        await x.value?.validate();
      } catch {
        return;
      }
      E.value = !0, T.value = "";
      try {
        const { storageType: t, tokenName: e, tokenValue: s, expireHours: g } = a.value, r = h.value;
        if (typeof window < "u" && typeof chrome < "u" && chrome.tabs && chrome.cookies)
          if (t == "cookie") {
            const u = new URL(r), n = {
              url: r,
              // 目标域名 origin
              name: e,
              value: s,
              secure: u.protocol === "https:",
              // HTTPS 自动启用 secure
              httpOnly: !1,
              sameSite: "lax",
              path: "/",
              // 全站可用
              domain: b.getHostname(r)
              // 自动提取主机名
            };
            if (g > 0) {
              const m = /* @__PURE__ */ new Date();
              m.setTime(m.getTime() + g * 60 * 60 * 1e3), n.expirationDate = m.getTime() / 1e3;
            }
            await new Promise((m, c) => {
              chrome.cookies.set(n, (C) => {
                if (chrome.runtime.lastError) {
                  const f = chrome.runtime.lastError.message;
                  f.includes("No host permissions") ? c(new Error(`注入失败：无 ${u.origin} 的 Cookie 操作权限，请检查插件 manifest 配置`)) : c(new Error(`注入失败：${f}`));
                  return;
                }
                if (!C) {
                  c(new Error("注入失败：Cookie 设置异常"));
                  return;
                }
                m();
              });
            }), T.value = `✅ 成功注入 Token 到 ${r}！`, N.value = "success", p({
              title: "Success",
              message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${r} 中查看`,
              type: "success"
            });
          } else {
            const [u] = await new Promise((n) => {
              chrome.tabs.query({ url: `${r}/*` }, n);
            });
            if (!u) {
              p({
                title: "Error",
                message: `未找到打开的 ${r} 标签页，请先打开目标域名页面`,
                type: "error"
              });
              return;
            }
            try {
              console.log(u, "targetTab"), await chrome.scripting.executeScript({
                target: { tabId: u.id },
                func: (n, m, c) => {
                  const C = escape(m), f = escape(c);
                  window[n].setItem(C, f);
                },
                args: [t, e, s],
                world: "MAIN"
                // 注入到页面主世界，确保能访问页面存储
              }), p({
                title: "Success",
                message: `Cookie 注入成功，可在开发者工具 Application → ${t} 中查看`,
                type: "success"
              });
            } catch (n) {
              p({
                title: "Error",
                message: `插件注入失败：${n.message}（请检查目标页面是否允许脚本注入）`,
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
          let u = "";
          const n = new URL(r);
          u = n.hostname;
          const m = n.protocol === "https:";
          let c = `${encodeURIComponent(e)}=${encodeURIComponent(s)}; path=/;`;
          if (g > 0 && !V) {
            const f = /* @__PURE__ */ new Date();
            f.setTime(f.getTime() + g * 60 * 60 * 1e3), c += ` expires=${f.toUTCString()};`;
          }
          if (m && (c += " secure;"), c += " SameSite=Lax;", u !== "localhost" && !u.startsWith("127.0.0.") && (c += ` domain=${u};`), document.cookie = c, !document.cookie.includes(encodeURIComponent(e))) {
            p({
              title: "Error",
              message: "Cookie 注入失败，请检查浏览器 Cookie 设置",
              type: "error"
            });
            return;
          }
          T.value = `✅ 成功注入 Token 到 ${u}！`, N.value = "success", p({
            title: "Success",
            message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${u} 中查看`,
            type: "success"
          });
        } else {
          if (window.location.origin !== r) {
            p({
              title: "Error",
              message: "普通浏览器环境不支持跨域存储操作，请直接在目标页面打开插件",
              type: "error"
            });
            return;
          }
          try {
            const n = escape(key), m = escape(value);
            window[t].setItem(n, m);
          } catch (n) {
            p({
              title: "Error",
              message: `存储操作失败：${n.message}`,
              type: "error"
            });
            return;
          }
          return;
        }
      } catch (t) {
        const e = t instanceof Error ? t.message : "未知错误";
        T.value = `❌ ${e}`, N.value = "error", p({
          title: "Error",
          message: e,
          type: "error"
        });
      } finally {
        E.value = !1;
      }
    };
    return (t, e) => {
      const s = H("el-option"), g = H("el-select");
      return $(), _(l(M), {
        shadow: "hover",
        "body-style": { padding: "20px", minHeight: "300px" }
      }, {
        default: i(() => [
          e[9] || (e[9] = R("h3", { class: "component-title" }, "Token 注入 Cookie 工具", -1)),
          R("div", J, [
            o(l(F), {
              model: a.value,
              rules: q.value,
              ref_key: "formRef",
              ref: x,
              "label-width": "120px",
              class: "form-container"
            }, {
              default: i(() => [
                o(l(v), {
                  label: "目标域名",
                  prop: "targetDomain"
                }, {
                  default: i(() => [
                    o(l(O), {
                      modelValue: a.value.targetDomain,
                      "onUpdate:modelValue": e[0] || (e[0] = (r) => a.value.targetDomain = r),
                      placeholder: "输入目标域名（如 https://xxx.com 或 xxx.com）",
                      clearable: "",
                      onInput: w
                    }, null, 8, ["modelValue"]),
                    o(l(j), {
                      size: "small",
                      type: "info",
                      class: "mt-1 block"
                    }, {
                      default: i(() => [...e[5] || (e[5] = [
                        D(" 支持格式：xxx.com、https://test.xxx.com、http://localhost:8080 ", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                o(l(v), {
                  label: "存储方式",
                  prop: "storageType"
                }, {
                  default: i(() => [
                    o(g, {
                      modelValue: a.value.storageType,
                      "onUpdate:modelValue": e[1] || (e[1] = (r) => a.value.storageType = r),
                      placeholder: "选择存储方式",
                      clearable: ""
                    }, {
                      default: i(() => [
                        o(s, {
                          label: "Cookie",
                          value: "cookie"
                        }),
                        o(s, {
                          label: "LocalStorage",
                          value: "localStorage"
                        }),
                        o(s, {
                          label: "SessionStorage",
                          value: "sessionStorage"
                        })
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                o(l(v), {
                  label: "Token 名称",
                  prop: "tokenName"
                }, {
                  default: i(() => [
                    o(g, {
                      modelValue: a.value.tokenName,
                      "onUpdate:modelValue": e[2] || (e[2] = (r) => a.value.tokenName = r),
                      placeholder: "选择tokenName",
                      clearable: "",
                      filterable: "",
                      "allow-create": ""
                    }, {
                      default: i(() => [
                        o(s, {
                          label: "token",
                          value: "token"
                        }),
                        o(s, {
                          label: "expired",
                          value: "expired"
                        }),
                        o(s, {
                          label: "emmark_platform_authorization",
                          value: "emmark_platform_authorization"
                        })
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                o(l(v), {
                  label: "Token 值",
                  prop: "tokenValue"
                }, {
                  default: i(() => [
                    o(l(O), {
                      modelValue: a.value.tokenValue,
                      "onUpdate:modelValue": e[3] || (e[3] = (r) => a.value.tokenValue = r),
                      placeholder: "输入后端生成的有效 Token 字符串",
                      type: "textarea",
                      rows: 3,
                      clearable: ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                l(V) ? U("", !0) : ($(), _(l(v), {
                  key: 0,
                  label: "过期时间",
                  prop: "expireHours"
                }, {
                  default: i(() => [
                    o(l(P), {
                      modelValue: a.value.expireHours,
                      "onUpdate:modelValue": e[4] || (e[4] = (r) => a.value.expireHours = r),
                      min: 0,
                      step: 1,
                      suffix: "小时",
                      "controls-position": "right"
                    }, null, 8, ["modelValue"]),
                    o(l(j), {
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
                o(l(v), null, {
                  default: i(() => [
                    o(l(L), {
                      type: "primary",
                      onClick: A,
                      loading: E.value
                    }, {
                      default: i(() => [
                        E.value ? ($(), _(l(W), { key: 0 }, {
                          default: i(() => [
                            o(l(K))
                          ]),
                          _: 1
                        })) : U("", !0),
                        e[7] || (e[7] = D(" 注入 Cookie ", -1))
                      ]),
                      _: 1
                    }, 8, ["loading"]),
                    o(l(L), {
                      type: "text",
                      onClick: z,
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
}, X = /* @__PURE__ */ G(Q, [["__scopeId", "data-v-34df004f"]]), oe = {
  install: (y) => {
    y.component("TokenInjector", X);
  }
};
export {
  X as TokenInjector,
  oe as default
};
