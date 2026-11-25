import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecord, partitionRecords } from "../lib/contentImport.js";
import sources from "../content/sources.json" with { type: "json" };
import records from "../content/records/index.json" with { type: "json" };
import reviewLog from "../content/review-log.json" with { type: "json" };

// نص تجريبي غير ديني، لاختبار منطق الاستيراد فقط. ما بيتعرضش أبداً.
const SAMPLE = "نص تجريبي للاختبار فقط";
const NOW = new Date("2026-11-23T07:00:00Z");

const mockSources = [
  { id: "test-src", name: "مصدر تجريبي", domain: "example-test.org", domainStatus: "verified-by-fetch" },
];

const good = {
  id: "r1",
  targetId: "ap-1",
  kind: "dhikr",
  arabicText: SAMPLE,
  count: 1,
  reference: "مرجع تجريبي",
  sourceId: "test-src",
  sourceUrl: "https://www.example-test.org/page",
  method: "manual-copy",
  fetchedAt: "2026-11-22T10:00:00Z",
  importedBy: "المستورد",
};

const fullReview = {
  recordId: "r1",
  reviewer: "المراجع",
  reviewedAt: "2026-11-22T12:00:00Z",
  checks: { textMatchesOriginal: true, referenceConfirmed: true, sourceUrlOpened: true, rightsReviewed: true },
};

test("سجل صالح مع مراجعة كاملة يتقبل", () => {
  assert.deepEqual(validateRecord(good, mockSources, [fullReview], NOW), { ok: true, reasons: [] });
});

test("verified:true وحده ما بيكفيش بدون مراجعة", () => {
  const r = validateRecord({ ...good, verified: true }, mockSources, [], NOW);
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(" "), /مفيش مراجعة/);
});

test("المستورد ما يقدرش يراجع سجله بنفسه", () => {
  const selfReview = { ...fullReview, reviewer: "المستورد" };
  const r = validateRecord(good, mockSources, [selfReview], NOW);
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(" "), /نفس اللي نقل/);
});

test("أي فحص مش true يمنع القبول", () => {
  for (const check of Object.keys(fullReview.checks)) {
    const review = { ...fullReview, checks: { ...fullReview.checks, [check]: false } };
    const r = validateRecord(good, mockSources, [review], NOW);
    assert.equal(r.ok, false, check);
  }
});

test("نطاق مرشح غير مفتوح يتم رفضه حتى لو فيه domain", () => {
  const src = [{ id: "test-src", name: "مصدر", domain: "example-test.org", domainStatus: "candidate-not-fetched" }];
  const r = validateRecord(good, src, [fullReview], NOW);
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(" "), /ما اتحققش بفتح صفحة/);
});

test("رابط خارج النطاق المعتمد يتم رفضه", () => {
  const r = validateRecord({ ...good, sourceUrl: "https://evil.example.net/x" }, mockSources, [fullReview], NOW);
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(" "), /خارج نطاق/);
});

test("رابط http غير آمن يتم رفضه", () => {
  const r = validateRecord({ ...good, sourceUrl: "http://example-test.org/x" }, mockSources, [fullReview], NOW);
  assert.equal(r.ok, false);
});

test("النقل لازم يكون manual-copy", () => {
  const r = validateRecord({ ...good, method: "auto-scrape" }, mockSources, [fullReview], NOW);
  assert.equal(r.ok, false);
});

test("النص الفاضي أو وقت جلب في المستقبل يتم رفضهم", () => {
  assert.equal(validateRecord({ ...good, arabicText: "   " }, mockSources, [fullReview], NOW).ok, false);
  assert.equal(validateRecord({ ...good, fetchedAt: "2030-01-01T00:00:00Z" }, mockSources, [fullReview], NOW).ok, false);
});

test("partitionRecords يفصل المقبول عن المرفوض", () => {
  const { approved, rejected } = partitionRecords(
    [good, { ...good, id: "r2", targetId: "ap-2", sourceUrl: "https://bad.org" }],
    mockSources,
    [fullReview],
    NOW
  );
  assert.equal(approved.size, 1);
  assert.equal(approved.get("ap-1").id, "r1");
  assert.equal(rejected.length, 1);
});

test("مصدر الحكومة (مجمع الملك فهد) متحقق منه بالجلب فعلاً", () => {
  const q = sources.approvedSources.find((s) => s.id === "qurancomplex");
  assert.equal(q.domain, "qurancomplex.gov.sa");
  assert.equal(q.domainStatus, "verified-by-fetch");
  assert.ok(q.evidence.length >= 1);
});

test("حقوق نسخة المجمع: الصفحة تسمح بالمواقع والبرامج، ومفيش إعادة توزيع صريحة", () => {
  const q = sources.approvedSources.find((s) => s.id === "qurancomplex");
  assert.equal(q.rightsStatus, "page-permits-websites-and-software");
});

test("الدرر السنية مرشحة فقط، ومش متحققة (الصفحات فشلت)", () => {
  const d = sources.approvedSources.find((s) => s.id === "dorar");
  assert.equal(d.domain, null);
  assert.equal(d.domainStatus, "candidate-not-fetched");
  assert.equal(d.fetched, false);
});

test("alquran.cloud مش موجود في المصادر المعتمدة", () => {
  assert.equal(sources.approvedSources.some((s) => /alquran/i.test(s.name + (s.domain || ""))), false);
});

test("السجلات المنقولة لها مراجعات مستقلة", () => {
  assert.equal(records.length, 24);
  assert.equal(reviewLog.length, 24);
});
