// الإعدادات والمكان محلياً على جهاز المستخدم فقط، بدون حسابات.
// كل قراءة من التخزين بتتنضف: القيم الغلط بترجع للافتراضي، وما بتوقفش التطبيق.
import { validatePlace } from "./places.js";
import { PRAYER_KEYS } from "./time.js";

const SETTINGS_KEY = "islamic-app:settings:v2";
const PLACE_KEY = "islamic-app:place:v2";
const METHOD_IDS = [5, 4, 3, 2, 1];
const THEMES = ["auto", "light", "dark"];

export const DEFAULT_SETTINGS = {
  method: 5, // الهيئة المصرية العامة (افتراضي مناسب لمصر)
  school: 0, // 0 = شافعي/مالكي/حنبلي، 1 = حنفي (في حساب العصر)
  offsets: { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
  theme: "auto",
  notifications: false,
  playAdhan: true,
  muezzinId: null,
};

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

/** ينضف أي كائن إعدادات ويرجع نسخة صالحة. */
export function sanitizeSettings(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const offsets = { ...DEFAULT_SETTINGS.offsets };
  for (const key of PRAYER_KEYS) {
    const n = Number(r.offsets?.[key]);
    if (Number.isFinite(n)) offsets[key] = Math.max(-60, Math.min(60, Math.round(n)));
  }
  return {
    method: METHOD_IDS.includes(Number(r.method)) ? Number(r.method) : DEFAULT_SETTINGS.method,
    school: Number(r.school) === 1 ? 1 : 0,
    offsets,
    theme: THEMES.includes(r.theme) ? r.theme : DEFAULT_SETTINGS.theme,
    notifications: r.notifications === true,
    playAdhan: r.playAdhan !== false,
    muezzinId: typeof r.muezzinId === "string" ? r.muezzinId : null,
  };
}

export function loadSettings() {
  if (!hasStorage()) return structuredClone(DEFAULT_SETTINGS);
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  if (hasStorage()) localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
}

/** المكان المحفوظ، أو null لو مفيش مكان صالح. */
export function loadPlace() {
  if (!hasStorage()) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(PLACE_KEY) || "null");
    const v = validatePlace(raw);
    return v.ok ? v.place : null;
  } catch {
    return null;
  }
}

export function savePlace(place) {
  if (!hasStorage()) return;
  const v = validatePlace(place);
  if (v.ok) localStorage.setItem(PLACE_KEY, JSON.stringify(v.place));
}

export function clearPlace() {
  if (hasStorage()) localStorage.removeItem(PLACE_KEY);
}
