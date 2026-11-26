import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, writeProgress, resetProgress, legacyKey, progressKey } from '../lib/azkarProgress.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _m: m,
  };
}

test('إكمال بند في الصباح لا يكمله في المساء ولا بعد الصلاة', () => {
  const s = fakeStorage();
  writeProgress(s, '2026-11-26', 'morning', 'ms-sayyid-1', 1);
  assert.equal(readProgress(s, '2026-11-26', 'morning', 'ms-sayyid-1'), 1);
  assert.equal(readProgress(s, '2026-11-26', 'evening', 'ms-sayyid-1'), 0);
  assert.equal(readProgress(s, '2026-11-26', 'after-prayer', 'ms-sayyid-1'), 0);
});

test('البند المشترك (الإخلاص) بيكتمل في كل قسم بشكل مستقل', () => {
  const s = fakeStorage();
  writeProgress(s, '2026-11-26', 'evening', 'ms-ikhlas-3', 3);
  assert.equal(readProgress(s, '2026-11-26', 'morning', 'ms-ikhlas-3'), 0);
  assert.equal(readProgress(s, '2026-11-26', 'evening', 'ms-ikhlas-3'), 3);
});

test('التصفير في قسم بيفضل مصفّر بعد إعادة القراءة، والقيمة القديمة ما ترجعش', () => {
  const s = fakeStorage();
  s.setItem(legacyKey('2026-11-26', 'm-2'), '1');
  assert.equal(readProgress(s, '2026-11-26', 'morning', 'm-2'), 1);
  resetProgress(s, '2026-11-26', 'morning', 'm-2');
  assert.equal(readProgress(s, '2026-11-26', 'morning', 'm-2'), 0);
});

test('القيمة القديمة ما بتتحذفش، وبتتنسخ مرة واحدة لكل قسم عند أول قراءة', () => {
  const s = fakeStorage();
  s.setItem(legacyKey('2026-11-26', 'e-2'), '2');
  assert.equal(readProgress(s, '2026-11-26', 'evening', 'e-2'), 2);
  assert.equal(s.getItem(legacyKey('2026-11-26', 'e-2')), '2', 'المفتاح القديم لازم يفضل');
  writeProgress(s, '2026-11-26', 'evening', 'e-2', 0);
  assert.equal(readProgress(s, '2026-11-26', 'evening', 'e-2'), 0, 'التحديث الجديد له الأولوية');
});

test('يوم جديد يبدأ من صفر، والعدّاد بيتخزن بمفتاح v2', () => {
  const s = fakeStorage();
  writeProgress(s, '2026-11-26', 'morning', 'm-1', 5);
  assert.equal(readProgress(s, '2026-11-27', 'morning', 'm-1'), 0);
  assert.ok(progressKey('2026-11-26', 'morning', 'm-1').startsWith('azkar:hisn-v2:'));
});

test('قيم غير صالحة تُعامل كصفر', () => {
  const s = fakeStorage();
  s.setItem(progressKey('2026-11-26', 'morning', 'm-1'), 'abc');
  assert.equal(readProgress(s, '2026-11-26', 'morning', 'm-1'), 0);
});
