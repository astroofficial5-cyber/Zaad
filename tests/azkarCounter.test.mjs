// عداد الأذكار: اهتزاز، زر كبير، تصفير بالضغط المطوّل، وترتيب الـhooks قبل أي return شرطي.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../components/AzkarTab.tsx", import.meta.url), "utf8");

test("اهتزاز عند الضغط وعند الاكتمال مع حماية لو مش مدعوم", () => {
  assert.ok(src.includes("navigator.vibrate(next >= state.count ? [60, 40, 60] : 15)"));
  assert.ok(src.includes('typeof navigator.vibrate === "function"'));
});

test("التصفير بالضغط المطوّل مش بالضغطة العادية", () => {
  assert.ok(src.includes("onPointerDown={startLongPress}"));
  assert.ok(src.includes("}, 1000);"));
  assert.ok(!/onClick=\{reset\}/.test(src));
});

test("الـhooks قبل if (!approved) return null", () => {
  const body = src.slice(src.indexOf("function AzkarItem"));
  const early = body.indexOf("if (!approved) return null;");
  assert.ok(early > 0);
  assert.ok(body.indexOf("useRef<number | null>") < early);
  assert.ok(body.indexOf("useState(false)") < early);
});

test("النص المعتمد ما اتغيّرش في التبويب", () => {
  assert.ok(src.includes("<p className=\"ayah-text\">{state.text}</p>"));
});
