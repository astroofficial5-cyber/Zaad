import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtimeSource } from '../scripts/select-candidates.mjs';
import {
  scopeLabelAr, countStateOf, TIME_ORDER, splitInstruction, validateAdhkarEntry, displayPolicy, sumSegmentCounts, countAlternativeLabel,
  localReviewFor, buildAdhkarView, SUPPORT, LOCAL_SCOPE,
} from '../lib/adhkarModel.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const matrix = read('../content/candidates/hisn-ch25-27-matrix-v7.json');
const localLog = read('../content/candidates/local-review-log.json');
const records = read('../content/records/index.json');
const base = { id: 'hisn-b27-007', enabled: false, timeCondition: 'evening', supportStatus: SUPPORT.SUPPORTED, recitedText: 'x' };

test('تعليمة الراوي تنفصل عن المتن المقروء', () => {
  const r = splitInstruction('وَإِذَا أَمْسَى قَالَ: أَمْسَيْنَا وَأَمْسَى المُلْكُ لِلَّهِ');
  assert.equal(r.instructionText, 'وَإِذَا أَمْسَى قَالَ:');
  assert.ok(r.recitedText.startsWith('أَمْسَيْنَا'));
});

test('مدخل فيه تعليمة داخل المتن يُرفض', () => {
  assert.equal(validateAdhkarEntry({ ...base, recitedText: 'وَإِذَا أَمْسَى قَالَ: أَمْسَيْنَا' }).ok, false);
});

test('افتتاح المؤلف لا ينسب للنبي ولا يُقرأ كمتن', () => {
  const bad = { id: 'hisn-b27-001', enabled: false, timeCondition: 'unstated', supportStatus: SUPPORT.AUTHOR_INTRO, recitedText: null, attribution: 'النبي ﷺ' };
  assert.equal(validateAdhkarEntry(bad).ok, false);
  assert.equal(validateAdhkarEntry({ ...bad, attribution: undefined }).ok, true);
});

test('مجموع المقاطع ليس عدادا للذكر: مقاطع 25 مستقلة', () => {
  const segs = [
    { text: 'سُبْحَانَ اللهِ', count: 33, countScope: 'phrase' },
    { text: 'وَالحَمْدُ لِلَّهِ', count: 33, countScope: 'phrase' },
    { text: 'وَاللهُ أَكْبَرُ', count: 33, countScope: 'phrase' },
    { text: 'لَا إِلَهَ إِلَّا اللهُ', count: 1, countScope: 'closing tahlil' },
  ];
  assert.equal(sumSegmentCounts(segs), 100);
  assert.equal(validateAdhkarEntry({ ...base, id: 'hisn-b25-005', segments: segs, timeCondition: 'after-prayer' }).ok, true);
});

test('أكثر من سبعين (البخاري 6307) مقارنة وليست عدد 70', () => {
  assert.equal(countAlternativeLabel({ relation: 'more-than', value: 70, source: 'البخاري 6307' }), 'أكثر من 70');
  assert.equal(countAlternativeLabel({ count: 10, source: 'النسائي 24' }), '10');
  assert.equal(validateAdhkarEntry({ ...base, id: 'hisn-b27-031', countAlternatives: [{ relation: 'more-than', value: 70, source: 'البخاري 6307' }] }).ok, true);
  assert.equal(validateAdhkarEntry({ ...base, countAlternatives: [{ source: 'x' }] }).ok, false);
});

test('المعلّق والمرجع القرآني لا يتعرضان أبدا', () => {
  assert.equal(displayPolicy({ supportStatus: SUPPORT.PENDING }), 'hidden-pending');
  assert.equal(displayPolicy({ supportStatus: SUPPORT.PENDING_AUTH }), 'hidden-pending');
  assert.equal(displayPolicy({ supportStatus: SUPPORT.QURAN_REF }), 'hidden-pending');
  assert.equal(displayPolicy({ supportStatus: SUPPORT.SUPPORTED_MISMATCH }), 'display-with-notes');
});

test('الإعداد الافتراضي لا يعرض أي عنصر، والملخص يبقى صادقا', () => {
  const v = buildAdhkarView(matrix, localLog);
  assert.equal(v.enabled, false);
  assert.equal(v.items.length, 0);
  assert.equal(v.summary.complete, false);
});

test('مع تفعيل المراجعة المحلية: 26 عنصرا ظاهرا، 8 قرآن، 1 افتتاح، 9 معلّقة، ولا اكتمال', () => {
  const v = buildAdhkarView(matrix, localLog, { enabled: true });
  assert.equal(v.items.length, 26);
  assert.equal(v.summary.reviewedShown, 26);
  assert.equal(v.summary.quranReference, 8);
  assert.equal(v.summary.authorIntro, 1);
  assert.equal(v.summary.pending, 9);
  assert.equal(v.summary.unreviewed, 0);
  assert.equal(v.summary.complete, false);
  assert.ok(v.items.every((i) => !/Quran/i.test(JSON.stringify(i.recitedText))));
});

test('b27-015: الوقت المطبوع والوقت الموثق من المصدر منفصلان', () => {
  const it = buildAdhkarView(matrix, localLog, { enabled: true }).items.find((i) => i.id === 'hisn-b27-015');
  assert.equal(it.printedTime, 'unstated');
  assert.equal(it.verifiedPrimaryTime.valueAr, 'الصباح والمساء');
  assert.equal(it.printedTimeAr, 'غير مطبوع في الكتاب');
});

test('b27-027 معلّق والبديلان لا يُجمعان', () => {
  const v = buildAdhkarView(matrix, localLog, { enabled: true });
  assert.equal(v.items.find((i) => i.id === 'hisn-b27-027'), undefined);
});

test('مراجعة بنشر مُفعّل أو بغير نطاق محلي لا تعتمد', () => {
  const entry = localLog[0];
  assert.ok(localReviewFor(entry.recordId, localLog));
  assert.equal(localReviewFor(entry.recordId, [{ ...entry, publicationCleared: true }]), null);
  assert.equal(localReviewFor(entry.recordId, [{ ...entry, scope: 'public' }]), null);
  assert.equal(localReviewFor(entry.recordId, [{ ...entry, checks: { textMatchesOriginal: false } }]), null);
});

test('الملف: كل العناصر معطلة، ولا يوجد نشر، والسجلات الـ11 الأصلية كما هي، والدفعتان الثانية والثالثة مضافتان بعدها', () => {
  assert.equal(matrix.enabled, false);
  assert.ok(matrix.items.length === 44 && matrix.items.every((i) => i.enabled === false));
  assert.equal(records.length, 28);
  assert.ok(localLog.every((e) => e.publicationCleared === false && e.scope === LOCAL_SCOPE));
});

const allSegs = matrix.items.flatMap((i) => i.segments || []);
const shown = buildAdhkarView(matrix, localLog, { enabled: true }).items;

test('نطاق العدّ معروض بالعربية لكل قيمة في الدليل', () => {
  for (const seg of allSegs) {
    const ar = scopeLabelAr(seg.countScope);
    assert.ok(ar && !/[A-Za-z]/.test(ar), `scope not translated: ${seg.countScope}`);
  }
});

test('كل ذكر معروض يظهر في مجموعة زمنية واحدة فقط', () => {
  const buckets = TIME_ORDER.map((k) => shown.filter((i) => i.printedTime === k).length);
  assert.equal(buckets.reduce((a, b) => a + b, 0), shown.length);
  const ids = shown.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('العدّ غير المطبوع يظهر كمتابعة قراءة وليس كعدد مفروض', () => {
  const b25 = shown.find((i) => i.id === 'hisn-b25-003');
  assert.equal(b25.segments[1].countState, 'read-through');
  assert.equal(b25.segments[1].count, null);
  assert.equal(countStateOf({ count: null, countAlternatives: [{ count: 10, source: 'x' }] }), 'alternatives');
  const b27_027 = matrix.items.find((i) => i.id === 'hisn-b27-027');
  assert.equal(b27_027.count, null);
});

test('البدائل المعروضة لا تُجمع وتحمل مصدرها', () => {
  const v = buildAdhkarView(matrix, localLog, { enabled: true });
  const it = v.items.find((i) => i.id === 'hisn-b27-031');
  assert.ok(it, 'b27-031 is a mismatch item and must be displayed');
  assert.equal(it.count, null);
  assert.equal(it.countState, 'alternatives');
  assert.equal(it.countAlternatives.length, 2);
  assert.equal(it.countAlternatives[0].labelAr, '100');
  assert.equal(it.countAlternatives[0].sourceAr, 'مسلم 2702');
  assert.equal(it.countAlternatives[1].labelAr, 'أكثر من 70');
  assert.equal(it.countAlternatives[1].sourceAr, 'البخاري 6307');
});

test('ملاحظات عدم التطابق معروضة بالعربية (بدون حروف إنجليزية)', () => {
  for (const it of shown) {
    for (const note of it.mismatchNotesAr) {
      assert.ok(!/[A-Za-z]{4,}/.test(note.replace(/sunnah\.com/g, '')), `english note: ${note.slice(0, 40)}`);
    }
  }
});

test('مولّد المكوّن: البناء الافتراضي لا يستورد بيانات المرشحين', () => {
  const off = runtimeSource(false);
  assert.ok(!off.includes('AzkarCandidates"') && !off.includes('./AzkarCandidates') && !off.includes('content/candidates'));
  assert.ok(off.includes('CANDIDATES_ENABLED = false'));
  const on = runtimeSource(true);
  assert.ok(on.includes('from "./AzkarCandidates"'));
});
