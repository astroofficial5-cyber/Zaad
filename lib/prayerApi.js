// مواقيت الصلاة والقبلة من Aladhan API.
// كل طلب بيتبعت بتاريخ مدني للمكان (civil) مش تاريخ الجهاز.
// النتيجة بتتخزن محلياً بمفتاح (مكان + تاريخ + طريقة + مذهب) عشان تشتغل أوفلاين لنفس اليوم.
// ملاحظة: الـ endpoints متوقعة من التوثيق؛ التحقق منها يكون من جهاز متصل بالإنترنت.
import { aladhanDate, civilKey } from "./zonedTime.js";
import { PRAYER_KEYS } from "./time.js";

const BASE = "https://api.aladhan.com/v1";
const TIMEOUT_MS = 12000;

export const METHODS = [
  { id: 5, name: "الهيئة المصرية العامة للمساحة" },
  { id: 4, name: "أم القرى (السعودية)" },
  { id: 3, name: "رابطة العالم الإسلامي" },
  { id: 2, name: "ISNA (أمريكا الشمالية)" },
  { id: 1, name: "جامعة العلوم الإسلامية (كراتشي)" },
];

/** خطأ مصنّف عشان الواجهة تعرض رسالة مناسبة. kind: network | bad-response | timeout */
export class PrayerApiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

function readCache(key) {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // التخزين ممتلئ؛ مش هنوقف التطبيق
  }
}

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new PrayerApiError("network", `الخادم رجّع خطأ (${res.status})`);
    return await res.json();
  } catch (err) {
    if (err instanceof PrayerApiError) throw err;
    if (err?.name === "AbortError") throw new PrayerApiError("timeout", "الاتصال أخد وقت طويل");
    throw new PrayerApiError("network", "مفيش اتصال بالإنترنت أو الخدمة مش متاحة");
  } finally {
    clearTimeout(timer);
  }
}

function validateTimings(timings) {
  if (!timings || typeof timings !== "object") return false;
  return PRAYER_KEYS.every((k) => typeof timings[k] === "string" && /^\d{1,2}:\d{2}/.test(timings[k]));
}

/**
 * مواقيت يوم مدني واحد لمكان معين.
 * place: { lat, lon, tz } ، civil: { y, m, d } بتاريخ المكان نفسه.
 * بيرجع { timings, hijri, source: "network"|"cache", fetchedAt, metaTimezone, civil }.
 */
export async function fetchPrayerData({ place, method, school, civil }) {
  const cacheKey = `islamic-app:prayer:${civilKey(civil)}:${place.lat.toFixed(3)}:${place.lon.toFixed(3)}:${method}:${school}`;
  try {
    const url = `${BASE}/timings/${aladhanDate(civil)}?latitude=${place.lat}&longitude=${place.lon}&method=${method}&school=${school}`;
    const json = await getJson(url);
    const timings = json?.data?.timings;
    if (!validateTimings(timings)) throw new PrayerApiError("bad-response", "استجابة الخدمة مش متوقعة");
    const entry = {
      timings,
      hijri: json.data.date?.hijri ?? null,
      fetchedAt: Date.now(),
      metaTimezone: json.data.meta?.timezone ?? null,
      civil,
    };
    writeCache(cacheKey, entry);
    return { ...entry, source: "network" };
  } catch (err) {
    const cached = readCache(cacheKey);
    if (cached && validateTimings(cached.timings)) return { ...cached, source: "cache" };
    throw err instanceof PrayerApiError ? err : new PrayerApiError("network", "تعذر تحميل المواقيت");
  }
}

export async function fetchQiblaDirection(lat, lon) {
  const cacheKey = `islamic-app:qibla:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  try {
    const json = await getJson(`${BASE}/qibla/${lat}/${lon}`);
    const direction = Number(json?.data?.direction);
    if (!Number.isFinite(direction)) throw new PrayerApiError("bad-response", "استجابة القبلة مش متوقعة");
    writeCache(cacheKey, direction);
    return direction;
  } catch (err) {
    const cached = readCache(cacheKey);
    if (typeof cached === "number") return cached;
    throw err instanceof PrayerApiError ? err : new PrayerApiError("network", "تعذر حساب اتجاه القبلة");
  }
}
