import { test } from "node:test";
import assert from "node:assert/strict";
import * as t from "../lib/time.js";
import { AZKAR_SECTIONS, AZKAR_ITEMS } from "../lib/azkarData.js";
import { DEFAULT_SETTINGS, loadSettings } from "../lib/settings.js";

test("parseTimeToMinutes يقرأ الوقت مع أو بدون المنطقة", () => {
  assert.equal(t.parseTimeToMinutes("05:12 (EET)"), 312);
  assert.equal(t.parseTimeToMinutes("18:30"), 1110);
  assert.ok(Number.isNaN(t.parseTimeToMinutes("abc")));
  assert.ok(Number.isNaN(t.parseTimeToMinutes(undefined)));
});

test("formatMinutes يلف حول منتصف الليل", () => {
  assert.equal(t.formatMinutes(312), "05:12");
  assert.equal(t.formatMinutes(1470), "00:30");
  assert.equal(t.formatMinutes(-30), "23:30");
});

test("applyOffsets يطبق تعديلات الدقائق لكل صلاة", () => {
  const r = t.applyOffsets(
    { Fajr: "05:12 (EET)", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "19:30" },
    { Fajr: -2, Asr: 5 }
  );
  assert.equal(r.Fajr, 310);
  assert.equal(r.Dhuhr, 720);
  assert.equal(r.Asr, 935);
  assert.equal(r.Isha, 1170);
});

test("nextPrayer يرجع أول صلاة بعد الوقت الحالي", () => {
  const m = { Fajr: 312, Dhuhr: 720, Asr: 935, Maghrib: 1080, Isha: 1170 };
  assert.equal(t.nextPrayer(m, 800), "Asr");
  assert.equal(t.nextPrayer(m, 2000), null);
});

test("upcomingDelays يحسب الفرق بالملي ثانية ويتجاهل اللي فات", () => {
  const now = new Date(2026, 10, 23, 9, 22, 0, 0); // 09:22
  const delays = t.upcomingDelays({ Fajr: 312, Dhuhr: 720, Asr: null, Maghrib: 1080, Isha: 1170 }, now);
  assert.deepEqual(delays.map((d) => d.key), ["Dhuhr", "Maghrib", "Isha"]);
  assert.equal(delays[0].delay, (720 - 562) * 60000);
});

test("upcomingDelays ما بيجدولش صلاة وقتها فات", () => {
  const now = new Date(2026, 10, 23, 9, 22, 0, 0);
  const delays = t.upcomingDelays({ Dhuhr: 500 }, now); // 08:20 فات
  assert.equal(delays.length, 0);
});

test("hijriLabel بيكوّن التاريخ الهجري", () => {
  assert.equal(
    t.hijriLabel({ day: "05", month: { ar: "جمادى الأولى" }, year: "1448" }),
    "05 جمادى الأولى 1448 هـ"
  );
  assert.equal(t.hijriLabel(null), "");
});

test("formatCountdown", () => {
  assert.equal(t.formatCountdown(45 * 60000), "45 دقيقة");
  assert.equal(t.formatCountdown((2 * 60 + 5) * 60000), "2 ساعتان و 5 دقائق");
});

test("stripDiacritics بيشيل الحركات", () => {
  assert.equal(t.stripDiacritics("بِسْمِ اللَّهِ"), "بسم الله");
});

test("الإعدادات الافتراضية بدون متصفح", () => {
  const s = loadSettings();
  assert.equal(s.method, DEFAULT_SETTINGS.method);
  assert.equal(s.school, 0);
  assert.equal(s.offsets.Fajr, 0);
});

test("الأذكار بدون أي نص قبل الاعتماد من المصدر", () => {
  for (const id of Object.keys(AZKAR_ITEMS)) {
    assert.equal(AZKAR_ITEMS[id].status, "awaiting-source", id);
    assert.equal(AZKAR_ITEMS[id].text, undefined, id);
  }
  for (const section of AZKAR_SECTIONS) {
    for (const id of section.itemIds) assert.ok(AZKAR_ITEMS[id], id);
  }
});
