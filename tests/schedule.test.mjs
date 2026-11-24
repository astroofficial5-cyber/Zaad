import { test } from "node:test";
import assert from "node:assert/strict";
import {
  atMinutesOn,
  buildScheduleForDays,
  dayKeyOf,
  nextDay,
  upcomingDelays,
} from "../lib/time.js";

const MIN = 60000;

// نفس المواقيت لأي يوم في الاختبار (الترتيب الزمني هو المهم)
const TIMES = { Fajr: 312, Dhuhr: 720, Asr: 935, Maghrib: 1080, Isha: 1170 };

test("الغد: بعد منتصف الليل الجدولة بتكمل بمواقيت الغد", () => {
  const now = new Date(2026, 10, 23, 23, 50, 0, 0); // 23:50
  const schedule = buildScheduleForDays(
    [{ day: now, minutes: TIMES }, { day: nextDay(now), minutes: TIMES }],
    now
  );
  // اليوم كله خلص إلا لو عنده أوقات بعد 23:50 (Isha 19:30 فات)
  assert.equal(schedule[0].key, "Fajr");
  const fajrTomorrow = new Date(2026, 10, 24, 5, 12).getTime();
  assert.equal(schedule[0].at, fajrTomorrow);
  assert.equal(schedule.length, 5);
});

test("اليوم بيتفلتر: اللي فات ما بيتجدولش", () => {
  const now = new Date(2026, 10, 23, 13, 0, 0, 0); // 13:00
  const schedule = buildScheduleForDays([{ day: now, minutes: TIMES }], now);
  assert.deepEqual(schedule.map((s) => s.key), ["Asr", "Maghrib", "Isha"]);
});

test("نهاية الشهر والسنة: الغد بيتحسب صح", () => {
  const lastDayOfYear = new Date(2026, 11, 31, 22, 0, 0, 0);
  const tomorrow = nextDay(lastDayOfYear);
  assert.equal(tomorrow.getFullYear(), 2027);
  assert.equal(tomorrow.getMonth(), 0);
  assert.equal(tomorrow.getDate(), 1);
});

test("تغير اليوم: مفتاح اليوم بيتغير عند منتصف الليل", () => {
  assert.notEqual(dayKeyOf(new Date(2026, 10, 23, 23, 59)), dayKeyOf(new Date(2026, 10, 24, 0, 1)));
  assert.equal(dayKeyOf(new Date(2026, 10, 23, 0, 0)), "2026-11-23");
});

test("حد أقصى للتنبيهات مع الترتيب الزمني", () => {
  const now = new Date(2026, 10, 23, 0, 0, 0, 0);
  const days = [0, 1, 2, 3].map((i) => ({ day: new Date(2026, 10, 23 + i), minutes: TIMES }));
  const schedule = buildScheduleForDays(days, now, 10);
  assert.equal(schedule.length, 10);
  for (let i = 1; i < schedule.length; i++) assert.ok(schedule[i].at >= schedule[i - 1].at);
});

test("وقت الصلاة بيتحسب بالتقويم المحلي (عبر تغير التوقيت الصيفي)", () => {
  // 2026-03-28 يوم تغيير الساعة في أوروبا؛ السنة المحلية بتتحسب بالمكونات فـ 05:12 دايماً 05:12
  const d = atMinutesOn(new Date(2026, 2, 28), 312);
  assert.equal(d.getHours(), 5);
  assert.equal(d.getMinutes(), 12);
});

test("الفرق الزمني ما يتغيرش بتغير المنطقة الزمنية المحلية", () => {
  const zones = ["Africa/Cairo", "UTC", "America/New_York", "Asia/Tokyo"];
  const original = process.env.TZ;
  try {
    for (const tz of zones) {
      process.env.TZ = tz;
      const now = new Date(2026, 10, 23, 9, 22, 0, 0); // 09:22 بتوقيت الجهاز
      const delays = upcomingDelays({ Dhuhr: 720 }, now);
      assert.equal(delays.length, 1, tz);
      assert.equal(delays[0].delay, 158 * MIN, tz);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
