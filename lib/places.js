// الأماكن: مدن مدمجة (إحداثيات تقريبية لمركز المدينة) + إدخال يدوي + GPS لو المستخدم وافق.
// كل مكان لازم يكون له منطقة زمنية صريحة. مفيش افتراض صامت لتوقيت الجهاز إلا لو المستخدم اختاره.
import { isValidTimeZone } from "./zonedTime.js";

export const CITIES = [
  { id: "cairo", name: "القاهرة", lat: 30.0444, lon: 31.2357, tz: "Africa/Cairo" },
  { id: "riyadh", name: "الرياض", lat: 24.7136, lon: 46.6753, tz: "Asia/Riyadh" },
  { id: "makkah", name: "مكة المكرمة", lat: 21.4225, lon: 39.8262, tz: "Asia/Riyadh" },
  { id: "madinah", name: "المدينة المنورة", lat: 24.4672, lon: 39.6024, tz: "Asia/Riyadh" },
  { id: "dubai", name: "دبي", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { id: "kuwait", name: "الكويت", lat: 29.3759, lon: 47.9774, tz: "Asia/Kuwait" },
  { id: "amman", name: "عمّان", lat: 31.9454, lon: 35.9284, tz: "Asia/Amman" },
  { id: "rabat", name: "الرباط", lat: 34.0209, lon: -6.8416, tz: "Africa/Casablanca" },
  { id: "algiers", name: "الجزائر", lat: 36.7538, lon: 3.0588, tz: "Africa/Algiers" },
  { id: "tunis", name: "تونس", lat: 36.8065, lon: 10.1815, tz: "Africa/Tunis" },
  { id: "khartoum", name: "الخرطوم", lat: 15.5007, lon: 32.5599, tz: "Africa/Khartoum" },
  { id: "istanbul", name: "إسطنبول", lat: 41.0082, lon: 28.9784, tz: "Europe/Istanbul" },
  { id: "karachi", name: "كراتشي", lat: 24.8607, lon: 67.0011, tz: "Asia/Karachi" },
  { id: "jakarta", name: "جاكرتا", lat: -6.2088, lon: 106.8456, tz: "Asia/Jakarta" },
  { id: "kualalumpur", name: "كوالالمبور", lat: 3.139, lon: 101.6869, tz: "Asia/Kuala_Lumpur" },
  { id: "london", name: "لندن", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  { id: "newyork", name: "نيويورك", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
];

/** يتحقق من مكان ويرجع نسخة نظيفة، أو سبب الرفض بالعربي. */
// الفاضي والمسافات بيتعاملوا كقيمة مفقودة (NaN) مش صفر: Number("") = 0 كان بيحفظ مكان غلط.
function toCoordinate(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v.trim());
  return NaN;
}

export function validatePlace(input) {
  const errors = [];
  const lat = toCoordinate(input?.lat);
  const lon = toCoordinate(input?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push("خط العرض لازم يكون بين -90 و 90");
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) errors.push("خط الطول لازم يكون بين -180 و 180");
  if (!isValidTimeZone(input?.tz)) errors.push("المنطقة الزمنية مش معروفة");
  const name = typeof input?.name === "string" ? input.name.trim().slice(0, 80) : "";
  const source = ["city", "manual", "gps"].includes(input?.source) ? input.source : null;
  if (!source) errors.push("مصدر المكان غير معروف");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    place: {
      name: name || `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
      lat,
      lon,
      tz: input.tz,
      source,
    },
  };
}

export function placeFromCity(cityId) {
  const c = CITIES.find((x) => x.id === cityId);
  if (!c) return null;
  return { ok: true, place: { name: c.name, lat: c.lat, lon: c.lon, tz: c.tz, source: "city" } };
}
