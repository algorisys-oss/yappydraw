const i = "yappy:rocket:config";
function p(e) {
  try {
    return atob(e);
  } catch {
    return e;
  }
}
function u() {
  try {
    const e = localStorage.getItem(i);
    if (e) {
      const t = JSON.parse(e);
      return {
        url: t.url || "",
        email: t.email || "",
        password: t.password ? p(t.password) : "",
        appName: t.appName || ""
      };
    }
  } catch {
  }
  return { url: "", email: "", password: "", appName: "" };
}
function l() {
  const e = u();
  return !!(e.url && e.email && e.password && e.appName);
}
async function m(e) {
  try {
    const t = await fetch(`${e.url.replace(/\/$/, "")}/api/_platform/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e.email, password: e.password })
    });
    if (!t.ok) {
      const s = await t.text().catch(() => "");
      return { success: !1, error: `Login failed (${t.status}): ${s.slice(0, 200)}` };
    }
    const r = await t.json();
    return { success: !0, accessToken: r.data?.access_token || r.access_token };
  } catch (t) {
    return { success: !1, error: `Connection failed: ${t.message}` };
  }
}
async function d(e, t) {
  const r = e.url.replace(/\/$/, "");
  try {
    const s = await fetch(`${r}/api/_platform/apps`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    if (s.ok) {
      const o = await s.json(), c = o.data || o;
      if (Array.isArray(c) && c.some((n) => n.name === e.appName))
        return { success: !0 };
    }
    const a = await fetch(`${r}/api/_platform/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`
      },
      body: JSON.stringify({ name: e.appName })
    });
    if (!a.ok) {
      const o = await a.text().catch(() => "");
      return { success: !1, error: `Failed to create app (${a.status}): ${o.slice(0, 200)}` };
    }
    return { success: !0 };
  } catch (s) {
    return { success: !1, error: `App setup failed: ${s.message}` };
  }
}
async function f(e, t, r) {
  const s = e.url.replace(/\/$/, "");
  try {
    const a = await fetch(`${s}/api/${encodeURIComponent(e.appName)}/_admin/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`
      },
      body: JSON.stringify(r)
    });
    if (!a.ok) {
      const c = await a.text().catch(() => "");
      return { success: !1, error: `Import failed (${a.status}): ${c.slice(0, 200)}` };
    }
    return { success: !0, summary: (await a.json()).data?.summary };
  } catch (a) {
    return { success: !1, error: `Import failed: ${a.message}` };
  }
}
export {
  l as hasRocketConfig,
  u as loadRocketConfig,
  d as rocketEnsureApp,
  f as rocketImportSchema,
  m as rocketLogin
};
