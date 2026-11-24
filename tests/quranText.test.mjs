// نص القرآن (Tanzil Uthmani v1.1): التحقق من الملف المصدري، والناتج المعروض، وعدم وجود قارئ الصور القديم.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildAndVerify, AYA_COUNTS, SOURCE_SHA256 } from "../scripts/build-quran.mjs";

const RAW = readFileSync(new URL("../content/quran/tanzil-uthmani-v1.1.xml", import.meta.url), "utf8");
const DATA = JSON.parse(readFileSync(new URL("../public/quran/quran-uthmani.json", import.meta.url), "utf8"));

test("الملف المصدري بنفس البصمة ولم يُعدَّل", () => {
  const sha = createHash("sha256").update(Buffer.from(RAW, "utf8")).digest("hex");
  assert.equal(sha, SOURCE_SHA256);
  assert.ok(RAW.includes("Tanzil Quran Text (Uthmani, Version 1.1)"));
  assert.ok(RAW.includes("CHANGING IT IS NOT ALLOWED"));
});

test("114 سورة و6236 آية وعدد كل سورة صحيح", () => {
  assert.equal(DATA.suras.length, 114);
  assert.equal(DATA.suras.reduce((a, s) => a + s.ayas.length, 0), 6236);
  DATA.suras.forEach((s, i) => {
    assert.equal(s.n, i + 1);
    assert.equal(s.ayas.length, AYA_COUNTS[i], `سورة ${s.n}`);
    s.ayas.forEach((a, j) => assert.equal(a.n, j + 1));
  });
});

test("كل آية موجودة حرفياً في الملف المصدري (بدون تعديل)", () => {
  for (const s of DATA.suras) for (const a of s.ayas) {
    assert.ok(RAW.includes(a.text), `آية ${s.n}:${a.n}`);
    assert.equal(a.text, a.text.trim(), `مسافات ${s.n}:${a.n}`);
  }
});

test("البسملة المنفصلة محفوظة كما هي في الملف", () => {
  const withBism = DATA.suras.filter((s) => s.ayas[0].bismillah);
  assert.ok(withBism.length >= 100);
  for (const s of withBism) assert.ok(RAW.includes(s.ayas[0].bismillah));
});

test("علامات السجدة موجودة في النص", () => {
  const sajda = DATA.suras.flatMap((s) => s.ayas).filter((a) => a.text.includes("۩"));
  assert.ok(sajda.length >= 10, `عدد آيات السجدة ${sajda.length}`);
});

test("بيانات المصدر والترخيص والبصمة موجودة", () => {
  assert.equal(DATA.meta.source, "Tanzil Project");
  assert.equal(DATA.meta.sourceUrl, "https://tanzil.net");
  assert.match(DATA.meta.license, /CC BY 3\.0/);
  assert.equal(DATA.meta.sourceSha256, SOURCE_SHA256);
});

test("البناء يرفض ملفاً مختلفاً", () => {
  assert.throws(() => buildAndVerify(RAW + " "), /بصمة الملف/);
});

test("قارئ الصور القديم اتشال من المشروع", () => {
  assert.equal(existsSync(new URL("../components/QuranTab.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../lib/quranPages.js", import.meta.url)), false);
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("QuranTextTab"));
  assert.ok(!page.includes("quran-pages"));
});

test("الخط والترخيص موجودين ومطابقين للمصدر", () => {
  const fontSha = createHash("sha256").update(readFileSync(new URL("../public/fonts/AmiriQuran-Regular.ttf", import.meta.url))).digest("hex");
  assert.equal(fontSha, "e2a47644762d16bdfb6d33e0d8db8c6ff30beae84150ef5a705316bbd829455c");
  const lic = readFileSync(new URL("../public/fonts/OFL-AmiriQuran.txt", import.meta.url), "utf8");
  assert.ok(lic.includes("SIL OPEN FONT LICENSE Version 1.1"));
  assert.ok(lic.includes("Amiri Quran Project Authors"));
});

test("القارئ: مفاتيح التخزين وحدود الخط والبحث موجودين", () => {
  const src = readFileSync(new URL("../components/QuranTextTab.tsx", import.meta.url), "utf8");
  assert.ok(src.includes('"zaad:quran:font"'));
  assert.ok(src.includes('"zaad:quran:last"'));
  assert.ok(src.includes("const FONT_MIN = 1.0;") && src.includes("const FONT_MAX = 2.2;"));
  assert.ok(src.includes('placeholder="ابحث باسم السورة أو رقمها"'));
});
