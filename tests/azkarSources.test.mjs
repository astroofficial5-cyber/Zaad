// مصادر الأقسام: للقراءة فقط، ولازم تكون على نطاق متحقق منه، ومفيش نص ذكر داخلها.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTION_SOURCES, AZKAR_SECTIONS } from "../lib/azkarData.js";

test("كل قسم عنده مصدر أو null صريح", () => {
  for (const s of AZKAR_SECTIONS) assert.ok(s.id in SECTION_SOURCES, s.id);
});

test("المصادر المعرّفة على نطاق متحقق منه فقط", () => {
  const allowed = ["risala.prh.gov.sa"];
  for (const src of Object.values(SECTION_SOURCES)) {
    if (!src) continue;
    const host = new URL(src.url).hostname;
    assert.ok(allowed.includes(host), host);
    assert.equal(new URL(src.url).protocol, "https:");
  }
});

test("مفيش نص ذكر داخل مصادر الأقسام، بس وصف ومرجع", () => {
  for (const src of Object.values(SECTION_SOURCES)) {
    if (!src) continue;
    assert.deepEqual(Object.keys(src).sort(), ["note", "sourceId", "title", "url"]);
  }
});
