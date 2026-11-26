// منطق الوقت الخالص: بدون أي اعتماد على المتصفح، عشان نقدر نختبره بسهولة.

export const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const PRAYER_NAMES = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

/** "05:12 (EET)" -> 312. يرجع NaN لو الصيغة غلط. */
export function parseTimeToMinutes(value) {
  if (typeof value !== "string") return NaN;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** يحوّل الدقائق لصيغة HH:MM ويلف حول منتصف الليل. */
export function formatMinutes(total) {
  const n = ((Math.round(total) % 1440) + 1440) % 1440;
  const h = String(Math.floor(n / 60)).padStart(2, "0");
  const m = String(n % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** يطبق تعديلات الدقائق (من المستخدم) على أوقات الصلاة. النتيجة بالدقائق. */
export function applyOffsets(timings, offsets = {}) {
  const out = {};
  for (const key of PRAYER_KEYS) {
    const base = parseTimeToMinutes(timings?.[key]);
    out[key] = Number.isNaN(base) ? null : base + (Number(offsets[key]) || 0);
  }
  return out;
}

/** وقت الشروق من المواقيت المحسوبة (بدون إزاحات الصلوات)، أو null لو مش متاح. الشروق مش صلاة. */
export function sunriseText(timings) {
  const m = parseTimeToMinutes(timings?.Sunrise);
  return Number.isFinite(m) ? formatMinutes(m) : null;
}

/** أول صلاة بعد الوقت الحالي، أو null لو خلصت صلوات اليوم. */
export function nextPrayer(minutesByKey, nowMinutes) {
  for (const key of PRAYER_KEYS) {
    const at = minutesByKey[key];
    if (at !== null && at !== undefined && at > nowMinutes) return key;
  }
  return null;
}

/** مواعيد التنبيه الباقية اليوم، كل واحد بالمدة بالملي ثانية من الآن. */
export function upcomingDelays(minutesByKey, now = new Date()) {
  const result = [];
  for (const key of PRAYER_KEYS) {
    const min = minutesByKey[key];
    if (min === null || min === undefined) continue;
    const delay = atMinutesOn(now, min).getTime() - now.getTime();
    if (delay > 0) result.push({ key, delay });
  }
  return result;
}

/**
 * وقت محلي لليوم اللي فيه `day` (Date)، عند `minutes` من بداية اليوم.
 * بنبني التاريخ بالمكونات (سنة/شهر/يوم) مش بإضافة ms، عشان يفضل صح مع تغير التوقيت الصيفي.
 */
export function atMinutesOn(day, minutes) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes, 0, 0);
}

/** مفتاح اليوم المحلي YYYY-MM-DD. بيتغير عند منتصف الليل بالتوقيت المحلي. */
export function dayKeyOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** اليوم اللي بعد `date` بالتقويم المحلي (بيتعامل مع نهاية الشهر والسنة). */
export function nextDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

/**
 * يجمع تنبيهات أكتر من يوم (مثلاً اليوم والغد) ويرجع اللي لسه ما فاتش فقط، مرتبة بالوقت.
 * days: [{ day: Date, minutes: { Fajr, Dhuhr, ... } }]
 */
export function buildScheduleForDays(days, now = new Date(), limit = 10) {
  const out = [];
  for (const { day, minutes } of days || []) {
    if (!day || !minutes) continue;
    for (const key of PRAYER_KEYS) {
      const min = minutes[key];
      if (min === null || min === undefined) continue;
      const at = atMinutesOn(day, min);
      if (at.getTime() > now.getTime()) out.push({ key, at: at.getTime() });
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out.slice(0, limit);
}

/** التاريخ الهجري من استجابة Aladhan. */
export function hijriLabel(hijri) {
  if (!hijri) return "";
  const month = hijri.month?.ar ?? hijri.month?.en ?? "";
  return `${hijri.day} ${month} ${hijri.year} هـ`;
}

/** مدة باقية بصيغة عربية صحيحة للجمع: ساعة/ساعتان/ساعات، دقيقة/دقيقتان/دقائق. الأرقام بالغربي زي أوقات الصلاة. */
export function formatCountdown(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin === 0) return "أقل من دقيقة";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const hourPart = h > 0 ? `${h} ${arabicHours(h)}` : "";
  const minPart = m > 0 ? `${m} ${arabicMinutes(m)}` : "";
  if (hourPart && minPart) return `${hourPart} و ${minPart}`;
  return hourPart || minPart;
}

function arabicHours(n) {
  if (n === 1) return "ساعة";
  if (n === 2) return "ساعتان";
  if (n <= 10) return "ساعات";
  return "ساعة";
}

function arabicMinutes(n) {
  if (n === 1) return "دقيقة";
  if (n === 2) return "دقيقتان";
  if (n <= 10) return "دقائق";
  return "دقيقة";
}

/**
 * الصلاة "الحالية": آخر صلاة دخل وقتها، بس وقت الفجر بينتهي بالشروق (لو متاح في المواقيت).
 * minutes: مواقيت اليوم بعد الإزاحة، nowMin: الدقيقة الحالية، sunriseMin: الشروق (NaN لو مش متاح).
 * لو الشروق مش متاح: الفجر بيفضل "الحالي" لحد الظهر (السلوك القديم).
 */
export function currentPrayerKey(minutes, nowMin, sunriseMin) {
  let last = null;
  for (const k of PRAYER_KEYS) {
    const m = minutes?.[k];
    if (typeof m === "number" && Number.isFinite(m) && m <= nowMin) last = k;
  }
  if (last === "Fajr" && Number.isFinite(sunriseMin) && nowMin >= sunriseMin) return null;
  return last;
}

/** يزيل التشكيل من النص العربي عشان البحث يلاقي الكلمة حتى بدون حركات. */
export function stripDiacritics(text) {
  return String(text).replace(/[ً-ْٰۖ-ۭ]/g, "");
}
