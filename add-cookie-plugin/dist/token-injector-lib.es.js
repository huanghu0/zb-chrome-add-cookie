import { ref as k, watch as V, onMounted as j, createBlock as y, openBlock as T, unref as o, withCtx as l, createElementVNode as I, createVNode as n, createCommentVNode as H, createTextVNode as C } from "vue";
import { ElCard as L, ElForm as q, ElFormItem as w, ElInput as _, ElInputNumber as B, ElText as O, ElButton as R, ElIcon as F, ElNotification as U } from "element-plus";
import { Loading as M } from "@element-plus/icons-vue";
const P = (c, i) => {
  const d = c.__vccOpts || c;
  for (const [t, E] of i)
    d[t] = E;
  return d;
}, W = { class: "content-container" }, z = {
  __name: "TokenInjector",
  props: {
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
  setup(c) {
    const i = c, d = k(null), t = k({
      tokenName: i.defaultTokenName,
      tokenValue: "",
      expireHours: i.defaultExpireHours
    }), E = k({
      tokenName: [{ required: !0, message: "请输入 Token 名称", trigger: "blur" }],
      tokenValue: [{ required: !0, message: "请输入 Token 值", trigger: "blur" }],
      expireHours: [{ required: !0, message: "请输入过期时间", trigger: "blur" }]
    }), g = k(!1), h = k(""), b = k("success"), { disableExpireInput: x } = i;
    V(
      () => i.defaultTokenName,
      (r) => {
        r && !t.value.tokenName && (t.value.tokenName = r);
      },
      { immediate: !0 }
    ), V(
      () => i.defaultExpireHours,
      (r) => {
        r !== void 0 && !x && (t.value.expireHours = r);
      },
      { immediate: !0 }
    ), j(() => {
      x && (t.value.expireHours = 0);
    });
    const S = () => {
      d.value?.resetFields(), h.value = "";
    }, $ = async () => {
      try {
        await d.value?.validate();
      } catch {
        return;
      }
      g.value = !0, h.value = "";
      try {
        const { tokenName: r, tokenValue: e, expireHours: a } = t.value;
        let u = "";
        if (typeof window < "u" && typeof chrome < "u" && chrome.tabs && chrome.cookies) {
          const [v] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
          if (!v.url)
            throw new Error("无法获取当前页面 URL，请刷新页面后重试");
          const p = new URL(v.url);
          u = p.hostname;
          const s = {
            url: p.origin,
            name: r,
            value: e,
            secure: p.protocol === "https:",
            httpOnly: !1,
            sameSite: "lax",
            path: "/"
          };
          if (a > 0 && !x) {
            const f = /* @__PURE__ */ new Date();
            f.setTime(f.getTime() + a * 60 * 60 * 1e3), s.expirationDate = f.getTime() / 1e3;
          }
          await new Promise((f, m) => {
            chrome.cookies.set(s, (D) => {
              if (chrome.runtime.lastError) {
                const N = chrome.runtime.lastError.message;
                N.includes("No host permissions") ? m(new Error(`注入失败：无 ${p.origin} 的 Cookie 操作权限，请检查插件 manifest 配置`)) : m(new Error(`注入失败：${N}`));
                return;
              }
              if (!D) {
                m(new Error("注入失败：Cookie 设置异常"));
                return;
              }
              f();
            });
          });
        } else {
          if (typeof window > "u")
            throw new Error("当前环境不支持 Cookie 操作");
          const v = new URL(window.location.href);
          u = v.hostname;
          const p = v.protocol === "https:";
          let s = `${encodeURIComponent(r)}=${encodeURIComponent(e)}; path=/;`;
          if (a > 0 && !x) {
            const m = /* @__PURE__ */ new Date();
            m.setTime(m.getTime() + a * 60 * 60 * 1e3), s += ` expires=${m.toUTCString()};`;
          }
          if (p && (s += " secure;"), s += " SameSite=Lax;", u !== "localhost" && !u.startsWith("127.0.0.") && (s += ` domain=${u};`), document.cookie = s, !document.cookie.includes(encodeURIComponent(r)))
            throw new Error("Cookie 注入失败，请检查浏览器 Cookie 设置");
        }
        h.value = `✅ 成功注入 Token 到 ${u}！`, b.value = "success", U({
          title: "Success",
          message: `Cookie 注入成功，可在开发者工具 Application → Cookies → ${u} 中查看`,
          type: "success"
        });
      } catch (r) {
        const e = r instanceof Error ? r.message : "未知错误";
        h.value = `❌ ${e}`, b.value = "error", U({
          title: "Error",
          message: e,
          type: "error"
        });
      } finally {
        g.value = !1;
      }
    };
    return (r, e) => (T(), y(o(L), {
      shadow: "hover",
      "body-style": { padding: "20px", minHeight: "300px" }
    }, {
      default: l(() => [
        e[6] || (e[6] = I("h3", { class: "component-title" }, "Token 注入 Cookie 工具", -1)),
        I("div", W, [
          n(o(q), {
            model: t.value,
            rules: E.value,
            ref_key: "formRef",
            ref: d,
            "label-width": "120px",
            class: "form-container"
          }, {
            default: l(() => [
              n(o(w), {
                label: "Token 名称",
                prop: "tokenName"
              }, {
                default: l(() => [
                  n(o(_), {
                    modelValue: t.value.tokenName,
                    "onUpdate:modelValue": e[0] || (e[0] = (a) => t.value.tokenName = a),
                    placeholder: "输入后端需要的 Cookie 键名（如 auth_token）",
                    clearable: ""
                  }, null, 8, ["modelValue"])
                ]),
                _: 1
              }),
              n(o(w), {
                label: "Token 值",
                prop: "tokenValue"
              }, {
                default: l(() => [
                  n(o(_), {
                    modelValue: t.value.tokenValue,
                    "onUpdate:modelValue": e[1] || (e[1] = (a) => t.value.tokenValue = a),
                    placeholder: "输入后端生成的有效 Token 字符串",
                    type: "textarea",
                    rows: 3,
                    clearable: ""
                  }, null, 8, ["modelValue"])
                ]),
                _: 1
              }),
              o(x) ? H("", !0) : (T(), y(o(w), {
                key: 0,
                label: "过期时间",
                prop: "expireHours"
              }, {
                default: l(() => [
                  n(o(B), {
                    modelValue: t.value.expireHours,
                    "onUpdate:modelValue": e[2] || (e[2] = (a) => t.value.expireHours = a),
                    min: 0,
                    step: 1,
                    suffix: "小时",
                    "controls-position": "right"
                  }, null, 8, ["modelValue"]),
                  n(o(O), {
                    size: "small",
                    type: "info",
                    class: "expire-tip"
                  }, {
                    default: l(() => [...e[3] || (e[3] = [
                      C(" 0 表示会话级 Cookie（关闭浏览器失效） ", -1)
                    ])]),
                    _: 1
                  })
                ]),
                _: 1
              })),
              n(o(w), null, {
                default: l(() => [
                  n(o(R), {
                    type: "primary",
                    onClick: $,
                    loading: g.value
                  }, {
                    default: l(() => [
                      g.value ? (T(), y(o(F), { key: 0 }, {
                        default: l(() => [
                          n(o(M))
                        ]),
                        _: 1
                      })) : H("", !0),
                      e[4] || (e[4] = C(" 注入 Cookie ", -1))
                    ]),
                    _: 1
                  }, 8, ["loading"]),
                  n(o(R), {
                    type: "text",
                    onClick: S,
                    class: "ml-2"
                  }, {
                    default: l(() => [...e[5] || (e[5] = [
                      C("重置", -1)
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
    }));
  }
}, A = /* @__PURE__ */ P(z, [["__scopeId", "data-v-fa6411fd"]]), X = {
  install: (c) => {
    c.component("TokenInjector", A);
  }
};
export {
  A as TokenInjector,
  X as default
};
