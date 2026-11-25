// خط الواجهة Cairo (OFL 1.1) مستضاف مع الموقع في public/fonts.
// بيتحمّل زي خط المصحف بالضبط: مسار نسبي ./fonts عشان يشتغل مع assetPrefix "./" وGitHub Pages والغلاف الأندرويد.
// لو الخط ما اتحمّلش، الصفحة بتفضل تعرض الاحتياطي من النظام.
export function loadUiFont() {
  if (typeof FontFace === "undefined" || typeof document === "undefined") return;
  try {
    const face = new FontFace("Cairo", "url(./fonts/Cairo-VF.woff)", { weight: "400 700", style: "normal", display: "swap" });
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => {});
  } catch {
    // المتصفح القديم: الاحتياطي كفاية
  }
}
