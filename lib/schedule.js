// جدولة الصلوات بلحظات حقيقية (instants) لمنطقة المكان، مش لتوقيت الجهاز.
import { PRAYER_KEYS } from "./time.js";
import { instantForMinutes } from "./zonedTime.js";

/**
 * days: [{ civil: {y,m,d}, minutes: {Fajr,...} }] بالدقائق من بداية اليوم في المكان.
 * بيرجع الصلوات اللي لسه ما فاتتش (بعد nowMs) مرتبة، بحد أقصى limit.
 */
export function buildPlaceSchedule({ tz, days, nowMs = Date.now(), limit = 10 }) {
  const out = [];
  for (const { civil, minutes } of days || []) {
    if (!civil || !minutes) continue;
    for (const key of PRAYER_KEYS) {
      const m = minutes[key];
      if (m === null || m === undefined || !Number.isFinite(m)) continue;
      const at = instantForMinutes(tz, civil, m);
      if (at > nowMs) out.push({ key, at });
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out.slice(0, limit);
}

/** أول صلاة لحظتها بعد nowMs من الجدول الكامل (اليوم والغد)، أو null. */
export function nextUpcoming(items, nowMs) {
  return items.find((it) => it.at > nowMs) || null;
}

/** فجر الغد (أول صلاة فجر بعد الوقت الحالي بعد العشاء). */
export function tomorrowFajr(days, tz, nowMs) {
  const tomorrow = days?.[1];
  if (!tomorrow?.minutes || !Number.isFinite(tomorrow.minutes.Fajr)) return null;
  const at = instantForMinutes(tz, tomorrow.civil, tomorrow.minutes.Fajr);
  return at > nowMs ? { key: "Fajr", at } : null;
}
