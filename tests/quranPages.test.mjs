// قارئ المصحف: أسماء الملفات والحدود وحفظ آخر صفحة. الصور نفسها مش بتتفحص هنا.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGE_COUNT, pageFileName, pageSrc, parsePage, loadLastPage, SOURCE_URL } from "../lib/quranPages.js";

test("عدد الصفحات 604 وأسماء الملفات بثلاث خانات", () => {
  assert.equal(PAGE_COUNT, 604);
  assert.equal(pageFileName(1), "001.webp");
  assert.equal(pageFileName(604), "604.webp");
  assert.equal(pageSrc(12), "./quran-pages/012.webp");
});

test("parsePage بيقبل 1 و604 ويرفض ما بعدهم والنصوص الغلط", () => {
  assert.equal(parsePage(1), 1);
  assert.equal(parsePage("604"), 604);
  assert.equal(parsePage(" 42 "), 42);
  assert.equal(parsePage(0), null);
  assert.equal(parsePage(605), null);
  assert.equal(parsePage("3.5"), null);
  assert.equal(parsePage(""), null);
  assert.equal(parsePage("abc"), null);
  assert.equal(parsePage(null), null);
});

test("loadLastPage بيرجع 1 لما التخزين مش متاح", () => {
  assert.equal(loadLastPage(), 1);
});

test("رابط المصدر هو الصفحة الرسمية للمجمع", () => {
  assert.equal(new URL(SOURCE_URL).hostname, "qurancomplex.gov.sa");
});
