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
const D = '2026-11-26';
const SHARED = ['morning', 'evening'];

test('إكمال بند في الصباح لا يكمله في المساء ولا بعد الصلاة', () => {
  const s = fakeStorage();
  writeProgress(s, D, 'morning', 'ms-sayyid-1', 1);
  assert.equal(readProgress(s, D, 'morning', 'ms-sayyid-1', SHARED), 1);
  assert.equal(readProgress(s, D, 'evening', 'ms-sayyid-1', SHARED), 0);
  assert.equal(readProgress(s, D, 'after-prayer', 'ms-sayyid-1', ['after-prayer']), 0);
});

test('التصفير في قسم بيفضل مصفّر، والقيمة القديمة ما ترجعش', () => {
  const s = fakeStorage();
  s.setItem(legacyKey(D, 'm-2'), '1');
  assert.equal(readProgress(s, D, 'morning', 'm-2', ['morning']), 1);
  resetProgress(s, D, 'morning', 'm-2');
  assert.equal(readProgress(s, D, 'morning', 'm-2', ['morning']), 0);
});

test('قيمة قديمة لبند في قسم واحد بتتنسخ للقسم ده، والقديم ما بيتحذفش', () => {
  const s = fakeStorage();
  s.setItem(legacyKey(D, 'e-2'), '2');
  assert.equal(readProgress(s, D, 'evening', 'e-2', ['evening']), 2);
  assert.equal(s.getItem(legacyKey(D, 'e-2')), '2');
  writeProgress(s, D, 'evening', 'e-2', 0);
  assert.equal(readProgress(s, D, 'evening', 'e-2', ['evening']), 0);
});

test('قيمة قديمة لبند مشترك ما بتتنسخش لأي قسم، وتفضل محفوظة', () => {
  const s = fakeStorage();
  s.setItem(legacyKey(D, 'ms-ikhlas-3'), '3');
  assert.equal(readProgress(s, D, 'morning', 'ms-ikhlas-3', SHARED), 0, 'الصباح ما يرثش قيمة غامضة');
  assert.equal(readProgress(s, D, 'evening', 'ms-ikhlas-3', SHARED), 0, 'المساء ما يرثش قيمة غامضة');
  assert.equal(s.getItem(progressKey(D, 'morning', 'ms-ikhlas-3')), null, 'ما اتكتبش مفتاح جديد');
  assert.equal(s.getItem(legacyKey(D, 'ms-ikhlas-3')), '3', 'القيمة القديمة محفوظة');
});

test('بعد إكمال البند المشترك في قسم، القسم الآخر يفضل صفر والقديم محفوظ', () => {
  const s = fakeStorage();
  s.setItem(legacyKey(D, 'ms-afw-1'), '1');
  writeProgress(s, D, 'morning', 'ms-afw-1', 1);
  assert.equal(readProgress(s, D, 'morning', 'ms-afw-1', SHARED), 1);
  assert.equal(readProgress(s, D, 'evening', 'ms-afw-1', SHARED), 0);
  assert.equal(s.getItem(legacyKey(D, 'ms-afw-1')), '1');
});

test('يوم جديد يبدأ من صفر، والعدّاد بمفتاح v2', () => {
  const s = fakeStorage();
  writeProgress(s, D, 'morning', 'm-1', 5);
  assert.equal(readProgress(s, '2026-11-27', 'morning', 'm-1', ['morning']), 0);
  assert.ok(progressKey(D, 'morning', 'm-1').startsWith('azkar:hisn-v2:'));
});

test('قيم غير صالحة تُعامل كصفر', () => {
  const s = fakeStorage();
  s.setItem(progressKey(D, 'morning', 'm-1'), 'abc');
  assert.equal(readProgress(s, D, 'morning', 'm-1', ['morning']), 0);
});
