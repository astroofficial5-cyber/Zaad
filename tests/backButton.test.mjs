// زر الرجوع: يرجع خطوة داخل الموقع (تبويب أو سورة) من غير ما يقفل الموقع من أول ضغطة.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const quran = readFileSync(new URL("../components/QuranTextTab.tsx", import.meta.url), "utf8");

test("تغيير التبويب بيتسجل خطوة في التاريخ", () => {
  assert.ok(page.includes('window.history.pushState({ zaadTab: id }, "")'));
  assert.ok(page.includes("onClick={() => goTab(t.id)}"));
});

test("زر الرجوع بيرجع للتبويب السابق", () => {
  assert.ok(page.includes('window.addEventListener("popstate", onPop)'));
  assert.ok(page.includes("if (st && st.zaadTab) setTab(st.zaadTab);"));
});

test("فتح السورة خطوة، والرجوع يقفلها ويرجع للقائمة", () => {
  assert.ok(quran.includes("window.history.pushState({ zaadTab: \"quran\", zaadQuran: n }, \"\")"));
  assert.ok(quran.includes("window.history.back()"));
  assert.ok(quran.includes("if (!st || !st.zaadQuran) setOpenSura(null);"));
});
