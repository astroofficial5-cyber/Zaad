// جسر اختياري: لو التطبيق شغّال داخل غلاف أندرويد (MainActivity)، window.AndroidAdhan بيكون متاح.
// في الحالة دي التنبيهات بتتجدول في AlarmManager، وملفات الأذان بتتخزن في مساحة التطبيق.
// في المتصفح العادي الدوال دي بترجع قيم آمنة وما بتعملش حاجة.

import { PRAYER_NAMES } from "./time.js";

export function isNative() {
  return typeof window !== "undefined" && typeof window.AndroidAdhan !== "undefined";
}

function parseOr(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function nativeListFiles() {
  if (!isNative()) return [];
  return parseOr(window.AndroidAdhan.listAdhanFiles(), []);
}

export function nativeDeleteFile(id) {
  if (isNative()) window.AndroidAdhan.deleteAdhanFile(id);
}

/** يفتح منتقي الملفات، ويرجع Promise بالـ id للملف الجديد (أو null لو فشل). */
export function nativePickFile() {
  return new Promise((resolve) => {
    if (!isNative()) return resolve(null);
    const before = new Set(nativeListFiles().map((f) => f.id));
    const onChange = () => {
      window.removeEventListener("adhan-files-changed", onChange);
      const added = nativeListFiles().find((f) => !before.has(f.id));
      resolve(added ? added.id : null);
    };
    window.addEventListener("adhan-files-changed", onChange);
    window.AndroidAdhan.pickAdhanFile();
  });
}

export function nativeCanUseExact() {
  return isNative() ? window.AndroidAdhan.canUseExactAlarms() : true;
}

export function nativeRequestNotifications() {
  if (isNative()) window.AndroidAdhan.requestNotificationPermission();
}

/**
 * items: [{ key, at }] بلحظات حقيقية (ms) محسوبة بتوقيت المكان. الحد 10 لأن AndroidAdhan بيعيد الجدولة كاملة.
 */
export function nativeScheduleItems({ items, playAudio, fileId }) {
  if (!isNative()) return { ok: false };
  const list = (items || []).slice(0, 10).map(({ key, at }) => ({ key, label: PRAYER_NAMES[key], at }));
  const payload = JSON.stringify({ playAudio, fileId: fileId ?? null, items: list });
  return parseOr(window.AndroidAdhan.scheduleAdhan(payload), { ok: false });
}

export function nativeCancel() {
  if (isNative()) window.AndroidAdhan.cancelAdhan();
}
