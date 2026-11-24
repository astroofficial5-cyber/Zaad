// القبلة: رسائل المستشعر والمعايرة، من غير تغيير في حساب الاتجاه.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../components/QiblaTab.tsx", import.meta.url), "utf8");

test("فحص دعم مستشعر الاتجاه وعرض رسالة لو مش مدعوم", () => {
  assert.ok(src.includes('"DeviceOrientationEvent" in window'));
  assert.ok(src.includes('setSensor("unsupported")'));
  assert.ok(src.includes("متصفحك ما بيدعمش مستشعر الاتجاه"));
});

test("رسالة المعايرة لو مفيش قراءة بعد المهلة", () => {
  assert.ok(src.includes("}, 2500);"));
  assert.ok(src.includes('setSensor("no-reading")'));
  assert.ok(src.includes("معايرة البوصلة"));
});

test("حساب الاتجاه وعرض الدرجات كما هو", () => {
  assert.ok(src.includes("fetchQiblaDirection(lat, lon)"));
  assert.ok(src.includes("{state.direction.toFixed(1)}° من الشمال الحقيقي"));
});
