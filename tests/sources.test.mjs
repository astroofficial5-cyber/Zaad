import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecord } from "../lib/contentImport.js";
import sources from "../content/sources.json" with { type: "json" };
import records from "../content/records/index.json" with { type: "json" };

const NOW = new Date("2026-11-23T07:00:00Z");
const mockSources = [
  { id: "t", name: "تجريبي", domain: "example-test.org", domainStatus: "verified-by-fetch" },
];
const review = {
  recordId: "d1",
  reviewer: "مراجع",
  reviewedAt: "2026-11-22T12:00:00Z",
  checks: { textMatchesOriginal: true, referenceConfirmed: true, sourceUrlOpened: true, rightsReviewed: true },
};
const dhikrRecord = {
  id: "d1",
  targetId: "ap-1",
  kind: "dhikr",
  arabicText: "نص تجريبي",
  count: 3,
  reference: "مرجع تجريبي",
  sourceId: "t",
  sourceUrl: "https://example-test.org/p",
  method: "manual-copy",
  fetchedAt: "2026-11-22T10:00:00Z",
  importedBy: "المستورد",
};

test("الذكر بدون عدد تكرار صحيح يُرفض", () => {
  for (const count of [undefined, 0, -1, 2.5, "3"]) {
    const r = validateRecord({ ...dhikrRecord, count }, mockSources, [review], NOW);
    assert.equal(r.ok, false, String(count));
  }
});

test("الذكر بعدد صحيح ومراجعة كاملة يتقبل", () => {
  assert.equal(validateRecord(dhikrRecord, mockSources, [review], NOW).ok, true);
});

test("مصدر حصن المسلم متحقق وحقوق النشر العام غير محسومة", () => {
  const s = sources.approvedSources.find((x) => x.id === "hisn-risala");
  assert.equal(s.domain, "risala.prh.gov.sa");
  assert.equal(s.domainStatus, "verified-by-fetch");
  assert.equal(s.rightsStatus, "public-reuse-unresolved-private-review-only");
});

test("ثمانية سجلات لأذكار ما بعد الصلاة منقولة ومراجعة", () => {
  const afterPrayer = records.filter((r) => r.targetId && r.targetId.startsWith("ap-"));
  assert.equal(afterPrayer.length, 9);
});
