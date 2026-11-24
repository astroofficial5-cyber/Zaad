// يبني نص القرآن للعرض من ملف Tanzil الأصلي (Uthmani v1.1) بدون أي تعديل على النص.
// الملف المصدري: content/quran/tanzil-uthmani-v1.1.xml (لا يُعدَّل أبداً).
// الناتج: public/quran/quran-uthmani.json، ويتحقق كل نص آية أنه موجود حرفياً في الملف الأصلي وبنفس الترتيب.
// التشغيل: node scripts/build-quran.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const SRC = resolve(root, "content/quran/tanzil-uthmani-v1.1.xml");
const OUT = resolve(root, "public/quran/quran-uthmani.json");

export const SOURCE_SHA256 = "c5052534d63d3856ce25413ff464d0b609f90169a202a1615aa8707efec81244";
export const AYA_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

/** يستخرج السور والآيات بالنص الخام كما هو في الملف (بدون فك ترميز أو تطبيع). */
export function parseTanzil(raw) {
  const suraRe = /<sura index="(\d+)" name="([^"]*)">/g;
  const ayaRe = /<aya index="(\d+)" text="([^"]*)"((?: [a-z]+="[^"]*")*) *\/>/g;
  const suras = [];
  let m;
  while ((m = suraRe.exec(raw))) suras.push({ n: Number(m[1]), name: m[2], start: m.index, ayas: [] });
  while ((m = ayaRe.exec(raw))) {
    // الآية تنتمي لآخر سورة بدأت قبلها
    let owner = null;
    for (const s of suras) if (s.start < m.index) owner = s;
    if (!owner) throw new Error(`آية بدون سورة عند ${m.index}`);
    const bm = /bismillah="([^"]*)"/.exec(m[3] || "");
    owner.ayas.push({ n: Number(m[1]), text: m[2], at: m.index, bismillah: bm ? bm[1] : null });
  }
  return suras;
}

export function buildAndVerify(raw) {
  const sha = createHash("sha256").update(Buffer.from(raw, "utf8")).digest("hex");
  if (sha !== SOURCE_SHA256) throw new Error(`بصمة الملف تغيّرت: ${sha}`);

  const suras = parseTanzil(raw);
  const errors = [];
  if (suras.length !== 114) errors.push(`عدد السور ${suras.length} بدل 114`);
  const total = suras.reduce((a, s) => a + s.ayas.length, 0);
  if (total !== 6236) errors.push(`عدد الآيات ${total} بدل 6236`);

  let cursor = 0;
  suras.forEach((s, i) => {
    if (s.n !== i + 1) errors.push(`فهرس السورة ${s.n} في الموضع ${i + 1}`);
    if (s.ayas.length !== AYA_COUNTS[i]) errors.push(`سورة ${s.n}: ${s.ayas.length} آية بدل ${AYA_COUNTS[i]}`);
    s.ayas.forEach((a, j) => {
      if (a.n !== j + 1) errors.push(`فهرس الآية ${s.n}:${a.n} في الموضع ${j + 1}`);
      if (!a.text.trim()) errors.push(`آية فارغة ${s.n}:${a.n}`);
      // نص الآية لازم يكون موجوداً حرفياً في الملف، وبعد الموضع السابق مباشرة
      const pos = raw.indexOf(a.text, cursor);
      if (pos < 0 || pos > a.at + 40) errors.push(`النص لا يطابق الملف عند ${s.n}:${a.n}`);
      else cursor = pos + a.text.length;
    });
  });
  if (errors.length) throw new Error("فشل التحقق:\n" + errors.slice(0, 40).join("\n"));

  return {
    meta: {
      source: "Tanzil Project",
      sourceUrl: "https://tanzil.net",
      text: "Uthmani, Version 1.1 (Hafs)",
      license: "Creative Commons Attribution 3.0 (CC BY 3.0)",
      sourceSha256: sha,
      sura_count: 114,
      aya_count: 6236,
      note: "النص لم يُعدَّل. حقوق النشر الكاملة في content/quran/tanzil-uthmani-v1.1.xml",
    },
    suras: suras.map((s) => ({
      n: s.n,
      name: s.name,
      ayas: s.ayas.map((a) => (a.bismillah ? { n: a.n, text: a.text, bismillah: a.bismillah } : { n: a.n, text: a.text })),
    })),
  };
}

// تشغيل مباشر
if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = readFileSync(SRC, "utf8");
  const data = buildAndVerify(raw);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
  console.log(`quran: ${data.suras.length} سورة، ${data.suras.reduce((a, s) => a + s.ayas.length, 0)} آية -> ${OUT}`);
}
