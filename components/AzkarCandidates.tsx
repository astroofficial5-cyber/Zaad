"use client";

import { useState } from "react";
import matrix from "../content/candidates/hisn-ch25-27-matrix-v7.json";
import reviewLog from "../content/candidates/local-review-log.json";
import { buildAdhkarView, TIME_ORDER, TIME_AR } from "../lib/adhkarModel.js";

// هذا الملف يُستورد فقط من components/AzkarCandidatesRuntime.tsx، وهذا الأخير يُولَّد عند البناء.
// في البناء الافتراضي لا يُستورد هذا الملف إطلاقا، فلا تدخل نصوصه ولا بياناته إلى الحزمة.
export const CANDIDATES_ENABLED = true;
export const CANDIDATES_TAB_LABEL = "مرشحون (مراجعة محلية)";

type Seg = {
  label: string;
  text: string;
  count: number | null;
  countState: "counter" | "alternatives" | "read-through";
  scopeAr: string | null;
  sourceAr: string | null;
};
type View = {
  id: string;
  printedTime: string;
  printedTimeAr: string;
  verifiedPrimaryTime: { valueAr: string; source: string } | null;
  instructionText: string | null;
  recitedText: string | null;
  segments: Seg[];
  count: number | null;
  countState: "counter" | "alternatives" | "read-through" | null;
  countAlternatives: { labelAr: string | null; sourceAr: string | null; conditionAr: string | null }[];
  mismatchNotesAr: string[];
  printedCitations: string[];
  verifiedCitations: { ref: string; url: string }[];
  rightsNote: string | null;
};

const todayKey = () => new Date().toDateString();
const storeKey = (id: string, label: string) => `azkar-cand:v1:${todayKey()}:${id}:${label}`;

function readCount(key: string): number {
  try {
    return Number(localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}
function writeCount(key: string, n: number) {
  try {
    localStorage.setItem(key, String(n));
  } catch {
    // التخزين غير متاح: العداد يفضل شغال لحد ما الصفحة تتقفل
  }
}

// عداد مستقل لكل مقطع أو لكل عنصر له عدد مطبوع. لا يوجد مجموع.
function Counter({ storage, target }: { storage: string; target: number }) {
  const [n, setN] = useState<number>(() => readCount(storage));
  const done = n >= target;
  return (
    <div className="counter-row">
      <button
        className="primary"
        disabled={done}
        onClick={() => {
          const next = Math.min(n + 1, target);
          setN(next);
          writeCount(storage, next);
        }}
      >
        {done ? `تم (${n} من ${target})` : `عدّ (${n} من ${target})`}
      </button>
      <button
        className="ghost"
        onClick={() => {
          setN(0);
          try {
            localStorage.removeItem(storage);
          } catch {
            // لا تخزين
          }
        }}
      >
        إعادة
      </button>
    </div>
  );
}

function CountBlock({ state, storage, count, scopeAr }: { state: string; storage: string; count: number | null; scopeAr: string | null }) {
  if (state === "counter" && count !== null) {
    return (
      <>
        {scopeAr && <p className="muted" style={{ margin: "4px 0" }}>{scopeAr}</p>}
        <Counter storage={storage} target={count} />
      </>
    );
  }
  if (state === "alternatives") return null;
  return <p className="muted" style={{ margin: "4px 0" }}>متابعة القراءة: لا يوجد عدد مطبوع</p>;
}

function CandidateItem({ v }: { v: View }) {
  return (
    <div className="card">
      <p className="muted" style={{ margin: "0 0 6px" }}>الوقت المطبوع: {v.printedTimeAr}</p>
      {v.verifiedPrimaryTime && (
        <p className="muted" style={{ margin: "0 0 6px" }}>
          الوقت الموثق من المصدر: {v.verifiedPrimaryTime.valueAr} ({v.verifiedPrimaryTime.source})
        </p>
      )}
      {v.instructionText && <p className="muted" style={{ margin: "0 0 6px" }}>{v.instructionText}</p>}
      {v.segments.length > 0 ? (
        v.segments.map((s) => (
          <div key={s.label} style={{ marginBottom: 10 }}>
            <p className="ayah-text">{s.text}</p>
            <CountBlock state={s.countState} storage={storeKey(v.id, s.label)} count={s.count} scopeAr={s.scopeAr} />
            {s.sourceAr && <p className="muted" style={{ margin: "2px 0" }}>المصدر: {s.sourceAr}</p>}
          </div>
        ))
      ) : (
        <>
          <p className="ayah-text">{v.recitedText}</p>
          {v.countState && (
            <CountBlock state={v.countState} storage={storeKey(v.id, "main")} count={v.count} scopeAr={null} />
          )}
        </>
      )}
      {v.countAlternatives.length > 0 && (
        <div className="muted" style={{ margin: "6px 0" }}>
          <strong>بدائل العدد (لا تُجمع):</strong>
          <ul style={{ margin: "4px 0" }}>
            {v.countAlternatives.map((a, i) => (
              <li key={i}>
                {a.labelAr} — {a.sourceAr}
                {a.conditionAr ? ` (${a.conditionAr})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {v.mismatchNotesAr.map((m, i) => (
        <p key={i} className="muted" style={{ margin: "4px 0" }}>ملاحظة عدم تطابق: {m}</p>
      ))}
      <p className="muted" style={{ margin: "6px 0 0" }}>
        المرجع المطبوع: {v.printedCitations.join("؛ ") || "—"}
      </p>
      {v.verifiedCitations.length > 0 && (
        <p className="muted" style={{ margin: "4px 0 0" }}>
          تحقق مستقل:{" "}
          {v.verifiedCitations.map((c, i) => (
            <span key={c.url}>
              {i > 0 && "، "}
              <a href={c.url} target="_blank" rel="noopener noreferrer">{c.ref}</a>
            </span>
          ))}
        </p>
      )}
      {v.rightsNote && <p className="muted" style={{ margin: "4px 0 0" }}>{v.rightsNote}</p>}
    </div>
  );
}

export default function AzkarCandidates() {
  const view = buildAdhkarView(matrix, reviewLog, { enabled: true });
  const s = view.summary;
  const groups = TIME_ORDER.map((k) => ({ k, items: view.items.filter((i) => i.printedTime === k) })).filter((g) => g.items.length > 0);
  return (
    <section aria-label="مرشحون بمراجعة محلية">
      <div className="card">
        <p style={{ margin: 0 }}>
          <strong>نسخة مراجعة محلية غير منشورة.</strong> معروض {s.reviewedShown} من {s.total}. معلّق: {s.pending}،
          مراجع قرآني بانتظار الدمج من المصحف: {s.quranReference}، افتتاح المؤلف: {s.authorIntro}.
          الاكتمال: {s.complete ? "مكتمل" : "غير مكتمل"}.
        </p>
        <p className="muted" style={{ margin: "6px 0 0" }}>كل ذكر يظهر مرة واحدة تحت وقته المطبوع.</p>
      </div>
      {groups.map((g) => (
        <div key={g.k}>
          <h3 style={{ margin: "14px 0 6px" }}>{TIME_AR[g.k]}</h3>
          {g.items.map((v) => (
            <CandidateItem key={v.id} v={v as View} />
          ))}
        </div>
      ))}
    </section>
  );
}
