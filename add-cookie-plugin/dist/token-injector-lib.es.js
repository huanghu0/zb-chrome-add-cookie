import { ref as v, watch as S, onMounted as O, resolveComponent as I, createBlock as V, openBlock as _, unref as a, withCtx as i, createElementVNode as H, createVNode as n, createCommentVNode as U, createTextVNode as N } from "vue";
import { ElCard as F, ElForm as K, ElFormItem as x, ElInput as R, ElInputNumber as M, ElText as P, ElButton as D, ElIcon as W, ElNotification as T } from "element-plus";
import { Loading as z } from "@element-plus/icons-vue";
const G = (f, c) => {
  const k = f.__vccOpts || f;
  for (const [t, C] of c)
    k[t] = C;
  return k;
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
  setup(f) {
    const c = f, k = v(null), t = v({
      storageType: c.defaultStorageType,
      tokenName: c.defaultTokenName,
      tokenValue: "",
      expireHours: c.defaultExpireHours
    }), C = v({
      storageType: [{ required: !0, message: "请选择存储方式", trigger: "change" }],
      tokenName: [{ required: !0, message: "请输入 Token 名称", trigger: "blur" }],
      tokenValue: [{ required: !0, message: "请输入 Token 值", trigger: "blur" }],
      expireHours: [{ required: !0, message: "请输入过期时间", trigger: "blur" }]
    }), E = v(!1), w = v(""), b = v("success"), { disableExpireInput: h } = c;
    S(
      () => c.defaultStorageType,
      (o) => {
        o && !t.value.storageType && (t.value.storageType = o);
      },
      { immediate: !0 }
    ), S(
      () => c.defaultTokenName,
      (o) => {
        o && !t.value.tokenName && (t.value.tokenName = o);
      },
      { immediate: !0 }
    ), S(
      () => c.defaultExpireHours,
      (o) => {
        o !== void 0 && !h && (t.value.expireHours = o);
      },
      { immediate: !0 }
    ), O(() => {
      h && (t.value.expireHours = 0);
    });
    const L = () => {
      k.value?.resetFields(), w.value = "";
    }, j = async () => {
      try {
        await k.value?.validate();
      } catch {
        return;
      }
      E.value = !0, w.value = "";
      try {
        const { storageType: o, tokenName: e, tokenValue: s, expireHours: u } = t.value;
        if (typeof window < "u" && typeof chrome < "u" && chrome.tabs && chrome.cookies)
          if (o == "cookie") {
            let r = "";
            const [m] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
            if (!m.url)
              throw new Error("无法获取当前页面 URL，请刷新页面后重试");
            const g = new URL(m.url);
            r = g.hostname;
            const p = {
              url: g.origin,
              name: e,
              value: s,
              secure: g.protocol === "https:",
              httpOnly: !1,
              sameSite: "lax",
              path: "/"
            };
            if (u > 0 && !h) {
              const y = /* @__PURE__ */ new Date();
              y.setTime(y.getTime() + u * 60 * 60 * 1e3), p.expirationDate = y.getTime() / 1e3;
            }
            await new Promise((y, d) => {
              chrome.cookies.set(p, (B) => {
                if (chrome.runtime.lastError) {
                  const $ = chrome.runtime.lastError.message;
                  $.includes("No host permissions") ? d(new Error(`注入失败：无 ${g.origin} 的 Cookie 操作权限，请检查插件 manifest 配置`)) : d(new Error(`注入失败：${$}`));
                  return;
                }
                if (!B) {
                  d(new Error("注入失败：Cookie 设置异常"));
                  return;
                }
                y();
              });
            }), w.value = `✅ 成功注入 Token 到 ${r}！`, b.value = "success", T({
              title: "Success",
              message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${r} 中查看`,
              type: "success"
            });
          } else {
            const [r] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
            if (!r.url)
              throw new Error("无法获取当前页面 URL，请刷新页面后重试");
            let m = new URL(r.url).origin;
            await A(o, e, s, m);
          }
        else if (o == "cookie") {
          if (typeof window > "u")
            throw new Error("当前环境不支持 Cookie 操作");
          let r = "";
          const m = new URL(window.location.href);
          r = m.hostname;
          const g = m.protocol === "https:";
          let p = `${encodeURIComponent(e)}=${encodeURIComponent(s)}; path=/;`;
          if (u > 0 && !h) {
            const d = /* @__PURE__ */ new Date();
            d.setTime(d.getTime() + u * 60 * 60 * 1e3), p += ` expires=${d.toUTCString()};`;
          }
          if (g && (p += " secure;"), p += " SameSite=Lax;", r !== "localhost" && !r.startsWith("127.0.0.") && (p += ` domain=${r};`), document.cookie = p, !document.cookie.includes(encodeURIComponent(e)))
            throw new Error("Cookie 注入失败，请检查浏览器 Cookie 设置");
          w.value = `✅ 成功注入 Token 到 ${r}！`, b.value = "success", T({
            title: "Success",
            message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${r} 中查看`,
            type: "success"
          });
        } else
          q(o, e, s);
      } catch (o) {
        const e = o instanceof Error ? o.message : "未知错误";
        w.value = `❌ ${e}`, b.value = "error", T({
          title: "Error",
          message: e,
          type: "error"
        });
      } finally {
        E.value = !1;
      }
    }, q = (o, e, s) => {
      try {
        const u = escape(e), l = escape(s);
        window[o].setItem(u, l), T({
          title: "Success",
          message: `Cookie 注入成功，可在开发者工具 Application → ${o} 中查看`,
          type: "success"
        });
      } catch (u) {
        throw new Error(`存储操作失败：${u.message}`);
      }
    }, A = async (o, e, s, u) => new Promise((l, r) => {
      chrome.tabs.executeScript(
        {
          code: `
          try {
            const safeKey = escape('${escape(e)}');
            const safeValue = escape('${escape(s)}');
            ${o}.setItem(safeKey, safeValue);
            console.log('Token 注入成功（Chrome 插件）：', '${e}');
          } catch (err) {
            console.error('存储注入失败（Chrome 插件）：', err);
            throw err;
          }
        `,
          runAt: "document_idle"
        },
        (m) => {
          if (chrome.runtime.lastError) {
            r(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (m?.[0] === !1) {
            r(new Error("无法访问当前页面的存储，请检查页面权限或刷新页面"));
            return;
          }
          T({
            title: "Success",
            message: `Cookie 注入成功，可在开发者工具 Application → ${o} 中查看`,
            type: "success"
          }), l();
        }
      );
    });
    return (o, e) => {
      const s = I("el-option"), u = I("el-select");
      return _(), V(a(F), {
        shadow: "hover",
        "body-style": { padding: "20px", minHeight: "300px" }
      }, {
        default: i(() => [
          e[7] || (e[7] = H("h3", { class: "component-title" }, "Token 注入 Cookie 工具", -1)),
          H("div", J, [
            n(a(K), {
              model: t.value,
              rules: C.value,
              ref_key: "formRef",
              ref: k,
              "label-width": "120px",
              class: "form-container"
            }, {
              default: i(() => [
                n(a(x), {
                  label: "存储方式",
                  prop: "storageType"
                }, {
                  default: i(() => [
                    n(u, {
                      modelValue: t.value.storageType,
                      "onUpdate:modelValue": e[0] || (e[0] = (l) => t.value.storageType = l),
                      placeholder: "选择存储方式",
                      clearable: ""
                    }, {
                      default: i(() => [
                        n(s, {
                          label: "Cookie",
                          value: "cookie"
                        }),
                        n(s, {
                          label: "LocalStorage",
                          value: "localStorage"
                        }),
                        n(s, {
                          label: "SessionStorage",
                          value: "sessionStorage"
                        })
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                n(a(x), {
                  label: "Token 名称",
                  prop: "tokenName"
                }, {
                  default: i(() => [
                    n(a(R), {
                      modelValue: t.value.tokenName,
                      "onUpdate:modelValue": e[1] || (e[1] = (l) => t.value.tokenName = l),
                      placeholder: "输入后端需要的 Cookie 键名（如 auth_token）",
                      clearable: ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                n(a(x), {
                  label: "Token 值",
                  prop: "tokenValue"
                }, {
                  default: i(() => [
                    n(a(R), {
                      modelValue: t.value.tokenValue,
                      "onUpdate:modelValue": e[2] || (e[2] = (l) => t.value.tokenValue = l),
                      placeholder: "输入后端生成的有效 Token 字符串",
                      type: "textarea",
                      rows: 3,
                      clearable: ""
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                }),
                a(h) ? U("", !0) : (_(), V(a(x), {
                  key: 0,
                  label: "过期时间",
                  prop: "expireHours"
                }, {
                  default: i(() => [
                    n(a(M), {
                      modelValue: t.value.expireHours,
                      "onUpdate:modelValue": e[3] || (e[3] = (l) => t.value.expireHours = l),
                      min: 0,
                      step: 1,
                      suffix: "小时",
                      "controls-position": "right"
                    }, null, 8, ["modelValue"]),
                    n(a(P), {
                      size: "small",
                      type: "info",
                      class: "expire-tip"
                    }, {
                      default: i(() => [...e[4] || (e[4] = [
                        N(" 0 表示会话级 Cookie（关闭浏览器失效） ", -1)
                      ])]),
                      _: 1
                    })
                  ]),
                  _: 1
                })),
                n(a(x), null, {
                  default: i(() => [
                    n(a(D), {
                      type: "primary",
                      onClick: j,
                      loading: E.value
                    }, {
                      default: i(() => [
                        E.value ? (_(), V(a(W), { key: 0 }, {
                          default: i(() => [
                            n(a(z))
                          ]),
                          _: 1
                        })) : U("", !0),
                        e[5] || (e[5] = N(" 注入 Cookie ", -1))
                      ]),
                      _: 1
                    }, 8, ["loading"]),
                    n(a(D), {
                      type: "text",
                      onClick: L,
                      class: "ml-2"
                    }, {
                      default: i(() => [...e[6] || (e[6] = [
                        N("重置", -1)
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
}, X = /* @__PURE__ */ G(Q, [["__scopeId", "data-v-6c440bba"]]), oe = {
  install: (f) => {
    f.component("TokenInjector", X);
  }
};
export {
  X as TokenInjector,
  oe as default
};
