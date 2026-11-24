// تصحيحات المراجعة: البوصلة الحية بإذن من المستخدم، وحفظ آخر آية في القرآن.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const qibla = readFileSync(new URL("../components/QiblaTab.tsx", import.meta.url), "utf8");
const quran = readFileSync(new URL("../components/QuranTextTab.tsx", import.meta.url), "utf8");

test("البوصلة: الاتجاه من الشمال = 360 - alpha، واللف بالفرق", () => {
  assert.ok(qibla.includes("const h = (360 - ev.alpha) % 360;"));
  assert.ok(qibla.includes("state.direction - heading"));
});

test("البوصلة: تفعيلها بضغطة المستخدم وطلب الإذن على iOS", () => {
  assert.ok(qibla.includes("async function enableCompass()"));
  assert.ok(qibla.includes('typeof DOE.requestPermission === "function"'));
  assert.ok(qibla.includes('onClick={enableCompass}'));
});

test("القرآن: حفظ آخر آية وإرجاع المستخدم لها", () => {
  assert.ok(quran.includes('"zaad:quran:lastaya"'));
  assert.ok(quran.includes("data-aya={a.n}"));
  assert.ok(quran.includes("pendingScroll"));
  assert.ok(quran.includes("onClick={continueReading}"));
});

test("نص الآيات والأرقام ما اتغيّروش في القارئ", () => {
  assert.ok(quran.includes('<span className="quran-num" aria-hidden="true"> ﴿{toArabicDigits(a.n)}﴾ </span>'));
  assert.ok(quran.includes("{a.text}"));
});
