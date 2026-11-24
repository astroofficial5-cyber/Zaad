// يفحص مخرجات البناء الثابت (out/) ويفشل لو وُجدت أي علامة مرشح. يُشغَّل بعد البناء الافتراضي.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../out", import.meta.url));
if (!existsSync(ROOT)) {
  console.log("out/ not found: run `npm run build` first (default, without NEXT_PUBLIC_ADHKAR_LOCAL_REVIEW)");
  process.exit(2);
}
const MARKERS = [
  "hisn-b25-", "hisn-b27-", "a4ad8934", "local-review-log",
  "حقوق النشر غير مراجعة", "متابعة القراءة: لا يوجد عدد مطبوع",
  "مرشحون (مراجعة محلية)", "azkar-cand:", "نسخة مراجعة محلية غير منشورة",
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const found = [];
let scanned = 0;
for (const file of walk(ROOT)) {
  if (!/\.(html|js|txt|json|css|map)$/.test(file)) continue;
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const m of MARKERS) if (text.includes(m)) found.push({ file, marker: m });
}
console.log(`scanned ${scanned} files in out/`);
if (found.length) {
  console.log("FOUND candidate markers in default build:");
  for (const f of found) console.log(`  ${f.marker}  ${f.file}`);
  process.exit(1);
}
console.log("no candidate markers found in default build");
