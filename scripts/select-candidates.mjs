// يختار مكوّن المرشحين عند البناء. الافتراضي (بدون NEXT_PUBLIC_ADHKAR_LOCAL_REVIEW=1)
// يكتب ملفا فارغا لا يستورد أي بيانات مرشحة، فلا تدخل الحزمة المنشورة.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../components/AzkarCandidatesRuntime.tsx", import.meta.url));

export function runtimeSource(enabled) {
  if (enabled) {
    return `// يُولَّد بواسطة scripts/select-candidates.mjs (مراجعة محلية)\nexport { CANDIDATES_ENABLED, CANDIDATES_TAB_LABEL, default } from "./AzkarCandidates";\n`;
  }
  return `// يُولَّد بواسطة scripts/select-candidates.mjs (بدون مراجعة محلية)\nexport const CANDIDATES_ENABLED = false;\nexport const CANDIDATES_TAB_LABEL = "";\nexport default function AzkarCandidates() {\n  return null;\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const enabled = process.env.NEXT_PUBLIC_ADHKAR_LOCAL_REVIEW === "1";
  writeFileSync(OUT, runtimeSource(enabled));
  console.log(`candidates: ${enabled ? "local review build" : "default build, candidates excluded"}`);
}
