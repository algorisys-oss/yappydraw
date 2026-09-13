async function w(n, a = 2048) {
  const t = await u(n), e = await h(t);
  let r = s(e, a);
  return r.base64.length > 4194304 && a > 1024 && (r = s(e, 1024)), r;
}
function l(n) {
  const a = n.match(/^data:([^;]+);base64,(.+)$/);
  if (!a) throw new Error("Invalid data URL");
  return { mediaType: a[1], base64: a[2] };
}
function u(n) {
  return new Promise((a, t) => {
    const e = new FileReader();
    e.onload = () => a(e.result), e.onerror = () => t(new Error("Failed to read image file")), e.readAsDataURL(n);
  });
}
function h(n) {
  return new Promise((a, t) => {
    const e = new Image();
    e.onload = () => a(e), e.onerror = () => t(new Error("Failed to load image")), e.src = n;
  });
}
function s(n, a) {
  let { naturalWidth: t, naturalHeight: e } = n;
  if (t > a || e > a) {
    const o = a / Math.max(t, e);
    t = Math.round(t * o), e = Math.round(e * o);
  }
  const r = document.createElement("canvas");
  r.width = t, r.height = e, r.getContext("2d").drawImage(n, 0, 0, t, e);
  const i = r.toDataURL("image/jpeg", 0.85), { base64: c, mediaType: d } = l(i);
  return { base64: c, mediaType: d, width: t, height: e };
}
export {
  w as a,
  l as p
};
