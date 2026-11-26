import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPrayerKey, formatCountdown } from '../lib/time.js';

const T = { Fajr: 5 * 60 + 40, Dhuhr: 12 * 60 + 10, Asr: 15 * 60, Maghrib: 17 * 60 + 40, Isha: 19 * 60 };
const SUN = 7 * 60 + 16; // 07:16

test('الفجر بعد الشروق ما يبقاش "الحالي"', () => {
  assert.equal(currentPrayerKey(T, 7 * 60 + 20, SUN), null);
  assert.equal(currentPrayerKey(T, 7 * 60 + 16, SUN), null);
});

test('بين الفجر والشروق الفجر هو الحالي', () => {
  assert.equal(currentPrayerKey(T, 6 * 60, SUN), 'Fajr');
  assert.equal(currentPrayerKey(T, 7 * 60 + 15, SUN), 'Fajr');
});

test('بين الشروق والظهر ما فيش صلاة حالية، والقادمة تبقى الظهر (منطق القادمة منفصل)', () => {
  assert.equal(currentPrayerKey(T, 10 * 60, SUN), null);
});

test('بعد الظهر الحالي هو الظهر، وبعد العشاء العشاء', () => {
  assert.equal(currentPrayerKey(T, 13 * 60, SUN), 'Dhuhr');
  assert.equal(currentPrayerKey(T, 20 * 60, SUN), 'Isha');
});

test('قبل الفجر ما فيش حالي', () => {
  assert.equal(currentPrayerKey(T, 3 * 60, SUN), null);
});

test('لو الشروق مش متاح: الفجر بيفضل حالي لحد الظهر (السلوك القديم)', () => {
  assert.equal(currentPrayerKey(T, 9 * 60, NaN), 'Fajr');
  assert.equal(currentPrayerKey(T, 13 * 60, NaN), 'Dhuhr');
});

test('العدّ التنازلي بالعربي الصحيح للجمع والواو مفصولة', () => {
  const min = (n) => n * 60000;
  assert.equal(formatCountdown(min(45)), '45 دقيقة');
  assert.equal(formatCountdown(min(1)), '1 دقيقة');
  assert.equal(formatCountdown(min(2)), '2 دقيقتان');
  assert.equal(formatCountdown(min(3)), '3 دقائق');
  assert.equal(formatCountdown(min(10)), '10 دقائق');
  assert.equal(formatCountdown(min(11)), '11 دقيقة');
  assert.equal(formatCountdown(min(60)), '1 ساعة');
  assert.equal(formatCountdown(min(120)), '2 ساعتان');
  assert.equal(formatCountdown(min(4 * 60 + 25)), '4 ساعات و 25 دقيقة');
  assert.equal(formatCountdown(min(2 * 60 + 5)), '2 ساعتان و 5 دقائق');
  assert.equal(formatCountdown(min(1 * 60 + 1)), '1 ساعة و 1 دقيقة');
  assert.equal(formatCountdown(min(12 * 60 + 30)), '12 ساعة و 30 دقيقة');
  assert.equal(formatCountdown(0), 'أقل من دقيقة');
});
