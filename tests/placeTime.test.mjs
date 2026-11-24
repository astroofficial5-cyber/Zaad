// اختبارات توقيت المكان: المنطقة الزمنية صريحة، ومستقلة عن توقيت الجهاز.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as z from "../lib/zonedTime.js";
import { buildPlaceSchedule, nextUpcoming } from "../lib/schedule.js";
import { validatePlace, placeFromCity, CITIES } from "../lib/places.js";
import { sanitizeSettings, DEFAULT_SETTINGS } from "../lib/settings.js";

test("civilIn بيرجع الوقت المدني للمنطقة مش للجهاز", () => {
  // 2026-11-23 00:00 UTC = 02:00 في القاهرة (UTC+2 بدون توقيت صيفي في نوفمبر)
  const c = z.civilIn("Africa/Cairo", Date.UTC(2026, 10, 23, 0, 0));
  assert.deepEqual([c.y, c.m, c.d, c.hh, c.mm], [2026, 11, 23, 2, 0]);
});

test("zonedToInstant لطوكيو (بدون توقيت صيفي)", () => {
  assert.equal(z.zonedToInstant("Asia/Tokyo", 2026, 1, 1, 9, 0), Date.UTC(2026, 0, 1, 0, 0));
});

test("zonedToInstant لنيويورك: قبل وبعد التوقيت الصيفي (الأحد 8 مارس 2026)", () => {
  // 7 مارس = توقيت شتوي UTC-5: 12:00 محلي = 17:00 UTC
  assert.equal(z.zonedToInstant("America/New_York", 2026, 3, 7, 12, 0), Date.UTC(2026, 2, 7, 17, 0));
  // 8 مارس = توقيت صيفي UTC-4: 12:00 محلي = 16:00 UTC
  assert.equal(z.zonedToInstant("America/New_York", 2026, 3, 8, 12, 0), Date.UTC(2026, 2, 8, 16, 0));
});

test("addDaysCivil بيتعامل مع نهاية السنة والشهر", () => {
  assert.deepEqual(z.addDaysCivil({ y: 2026, m: 12, d: 31 }, 1), { y: 2027, m: 1, d: 1 });
  assert.deepEqual(z.addDaysCivil({ y: 2026, m: 2, d: 28 }, 1), { y: 2026, m: 3, d: 1 });
  assert.deepEqual(z.addDaysCivil({ y: 2026, m: 3, d: 1 }, -1), { y: 2026, m: 2, d: 28 });
});

test("instantForMinutes بتتعامل مع دقائق سالبة وأكبر من يوم", () => {
  const civil = { y: 2026, m: 11, d: 23 };
  // -30 = 23:30 يوم 22 في القاهرة
  const before = z.civilIn("Africa/Cairo", z.instantForMinutes("Africa/Cairo", civil, -30));
  assert.deepEqual([before.d, before.hh, before.mm], [22, 23, 30]);
  // 1500 = 01:00 يوم 24
  const after = z.civilIn("Africa/Cairo", z.instantForMinutes("Africa/Cairo", civil, 1500));
  assert.deepEqual([after.d, after.hh, after.mm], [24, 1, 0]);
});

test("aladhanDate و civilKey بصيغة ثابتة", () => {
  assert.equal(z.aladhanDate({ y: 2026, m: 3, d: 7 }), "07-03-2026");
  assert.equal(z.civilKey({ y: 2026, m: 3, d: 7 }), "2026-03-07");
});

test("isValidTimeZone بيرفض المناطق الغلط", () => {
  assert.equal(z.isValidTimeZone("Africa/Cairo"), true);
  assert.equal(z.isValidTimeZone("Mars/Olympus"), false);
  assert.equal(z.isValidTimeZone(""), false);
  assert.equal(z.isValidTimeZone(null), false);
});

test("buildPlaceSchedule بيعدي منتصف الليل ويرتب ويتخطى اللي فات", () => {
  const tz = "Africa/Cairo";
  const today = { y: 2026, m: 11, d: 23 };
  const tomorrow = { y: 2026, m: 11, d: 24 };
  const minutes = { Fajr: 312, Dhuhr: 720, Asr: 900, Maghrib: 1050, Isha: 1140 };
  const days = [
    { civil: today, minutes },
    { civil: tomorrow, minutes },
  ];
  // 18:20 في القاهرة: المتبقي = العشاء (19:00) ثم فجر الغد
  const before = z.instantForMinutes(tz, today, 1100);
  const list = buildPlaceSchedule({ tz, days, nowMs: before, limit: 10 });
  assert.equal(list[0].key, "Isha");
  assert.equal(list[1].key, "Fajr");
  assert.ok(list.every((it) => it.at > before));
  assert.ok(list.every((it, i) => i === 0 || list[i - 1].at <= it.at));
  assert.equal(nextUpcoming(list, before).key, "Isha");

  // بعد العشاء (20:00): الصلاة القادمة فجر الغد بتوقيت المكان
  const afterIsha = z.instantForMinutes(tz, today, 1200);
  const later = buildPlaceSchedule({ tz, days, nowMs: afterIsha, limit: 10 });
  const nxt = nextUpcoming(later, afterIsha);
  assert.equal(nxt.key, "Fajr");
  const local = z.civilIn(tz, nxt.at);
  assert.deepEqual([local.d, local.hh, local.mm], [24, 5, 12]);
});

test("buildPlaceSchedule بيتخطى يوم مش محمّل ومواقيت ناقصة", () => {
  const tz = "Asia/Riyadh";
  const days = [{}, { civil: { y: 2026, m: 11, d: 24 }, minutes: { Fajr: 300, Dhuhr: null, Asr: NaN } }];
  const list = buildPlaceSchedule({ tz, days, nowMs: 0, limit: 10 });
  assert.deepEqual(list.map((x) => x.key), ["Fajr"]);
});

test("validatePlace بيرفض إحداثيات وتوقيت غلط، وبيقبل مكان صح", () => {
  assert.equal(validatePlace({ lat: 91, lon: 0, tz: "Africa/Cairo", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: 0, lon: 181, tz: "Africa/Cairo", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: 30, lon: 31, tz: "Nope/Zone", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: "abc", lon: 31, tz: "Africa/Cairo", source: "manual" }).ok, false);
  const good = validatePlace({ lat: 30.04, lon: 31.24, tz: "Africa/Cairo", source: "manual" });
  assert.equal(good.ok, true);
  assert.equal(good.place.tz, "Africa/Cairo");
});

test("كل مدينة جاهزة لها منطقة زمنية صالحة وإحداثيات مقبولة", () => {
  for (const c of CITIES) {
    const v = placeFromCity(c.id);
    assert.equal(v.ok, true, c.id);
    assert.equal(z.isValidTimeZone(c.tz), true, c.id);
  }
});

test("sanitizeSettings بيصلّح القيم الغلط بدون ما يكسر", () => {
  const s = sanitizeSettings({
    method: 99,
    school: "x",
    offsets: { Fajr: 500, Dhuhr: "abc", Asr: -3.6 },
    theme: "neon",
    notifications: "yes",
    muezzinId: 5,
  });
  assert.equal(s.method, DEFAULT_SETTINGS.method);
  assert.equal(s.school, 0);
  assert.equal(s.offsets.Fajr, 60);
  assert.equal(s.offsets.Dhuhr, 0);
  assert.equal(s.offsets.Asr, -4);
  assert.equal(s.theme, "auto");
  assert.equal(s.notifications, false);
  assert.equal(s.muezzinId, null);
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
});

test("الإحداثيات الفاضية أو المسافات بتترفض (مش بتتحول لصفر)", () => {
  assert.equal(validatePlace({ lat: "", lon: "31.2", tz: "Africa/Cairo", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: "30", lon: "   ", tz: "Africa/Cairo", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: null, lon: 31, tz: "Africa/Cairo", source: "manual" }).ok, false);
  assert.equal(validatePlace({ lat: "30.04", lon: "31.24", tz: "Africa/Cairo", source: "manual" }).ok, true);
});
