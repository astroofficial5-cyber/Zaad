import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sunriseText, PRAYER_KEYS, currentPrayerKey, nextPrayer } from '../lib/time.js';

test('الشروق بيتقري من المواقيت المحسوبة بدون إزاحة، وبيرجع null لو مش متاح', () => {
  assert.equal(sunriseText({ Sunrise: '06:29 (EET)' }), '06:29');
  assert.equal(sunriseText({ Sunrise: '07:16' }), '07:16');
  assert.equal(sunriseText({}), null);
  assert.equal(sunriseText(undefined), null);
});

test('الشروق مش صلاة: مش داخل قائمة الصلوات ولا في العد أو الحالية', () => {
  assert.deepEqual(PRAYER_KEYS, ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
  const minutes = { Fajr: 330, Dhuhr: 730, Asr: 900, Maghrib: 1060, Isha: 1140 };
  assert.equal(nextPrayer(minutes, 400), 'Dhuhr');
  assert.equal(currentPrayerKey(minutes, 400, 389), null);
});

test('الصف في الكود بيتحط بين الفجر والظهر، وبدون علامة القادمة/الحالية', () => {
  const ui = fs.readFileSync(new URL('../components/PrayerTab.tsx', import.meta.url), 'utf8');
  assert.match(ui, /sunrise-row/);
  assert.match(ui, /key === "Dhuhr" && sunrise/);
  assert.doesNotMatch(ui, /sunrise-row[^]*?badge/);
});
