"use client";

import { useEffect, useState } from "react";
import { AZKAR_SECTIONS, SECTION_SOURCES } from "../lib/azkarData.js";
import { getAzkarState } from "../lib/approvedContent.js";
import AzkarCandidates, { CANDIDATES_ENABLED, CANDIDATES_TAB_LABEL } from "./AzkarCandidatesRuntime";

// العدّاد بيتخزن لكل يوم، وبيشتغل بس على نص معتمد
function todayKey() {
  return new Date().toDateString();
}

const CANDIDATES_TAB = "candidates";

export default function AzkarTab({ hidden }: { hidden: boolean }) {
  const [sectionId, setSectionId] = useState<string>(AZKAR_SECTIONS[0].id);
  const showCandidates = CANDIDATES_ENABLED && sectionId === CANDIDATES_TAB;
  const section = AZKAR_SECTIONS.find((s) => s.id === sectionId) ?? AZKAR_SECTIONS[0];
  const source = SECTION_SOURCES[section.id];
  const approvedIds = section.itemIds.filter((id) => getAzkarState(id).status === "approved");

  return (
    <section hidden={hidden} aria-label="الأذكار">
      <div className="nav-sub">
        {AZKAR_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={!showCandidates && s.id === sectionId ? "chip active" : "chip"}
            onClick={() => setSectionId(s.id)}
          >
            {s.title}
          </button>
        ))}
        {CANDIDATES_ENABLED && (
          <button
            className={showCandidates ? "chip active" : "chip"}
            onClick={() => setSectionId(CANDIDATES_TAB)}
          >
            {CANDIDATES_TAB_LABEL}
          </button>
        )}
      </div>

      {showCandidates ? (
        <AzkarCandidates />
      ) : (
        <>
          {approvedIds.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>
                أذكار هذا القسم لم تُضف بعد من مصدر معتمد. سيظهر هنا فور اعتماد نصوصه.
              </p>
            </div>
          ) : (
            <>
              <p className="muted" style={{ margin: "0 0 10px" }}>
                مختارات من الأذكار، وليست كل أذكار القسم. المرجع أسفل كل ذكر هو كتاب الحديث ورقمه.
              </p>
              {approvedIds.map((id) => (
                <AzkarItem key={id} itemId={id} />
              ))}
            </>
          )}

          {source && (
            <details className="card">
              <summary>تفاصيل الجمع والتحقق</summary>
              <p className="muted" style={{ margin: "8px 0 6px" }}>
                <strong>المصدر:</strong> {source.title}
              </p>
              <p className="muted" style={{ margin: "0 0 6px" }}>{source.note}</p>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                فتح الصفحة الأصلية
              </a>
              <p className="muted">المؤلف: سعيد بن علي بن وهف القحطاني. المرجع هو الكتاب، والنسخة الرقمية من رسالة الحرمين.</p>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function AzkarItem({ itemId }: { itemId: string }) {
  const state = getAzkarState(itemId);
  const [count, setCount] = useState(0);
  const approved = state.status === "approved";

  useEffect(() => {
    if (!approved) return;
    try {
      setCount(Number(localStorage.getItem(`azkar:hisn-v1:${todayKey()}:${itemId}`) || 0));
    } catch {
      setCount(0);
    }
  }, [itemId, approved]);

  if (!approved) return null;

  const bump = () => {
    const next = Math.min(count + 1, state.count);
    setCount(next);
    try {
      localStorage.setItem(`azkar:hisn-v1:${todayKey()}:${itemId}`, String(next));
    } catch {
      // التخزين مش متاح؛ العداد بيفضل شغال لحد ما الصفحة تتقفل
    }
  };

  const reset = () => {
    setCount(0);
    try {
      localStorage.removeItem(`azkar:hisn-v1:${todayKey()}:${itemId}`);
    } catch {
      // مفيش تخزين متاح
    }
  };

  return (
    <div className="card">
      <p className="ayah-text">{state.text}</p>
      <p className="muted">{state.countNote}</p>
      {itemId === "ap-1" && <p className="muted">لفظ الاستغفار مبيَّن في شرح الأوزاعي داخل الرواية.</p>}
      {itemId === "ap-3" && <p className="muted">ورد التهليل مع الدعاء التالي في صحيح مسلم، 593، دون عدد؛ فُصلا هنا للعدّ فقط.</p>}
      <p className="muted">
        المرجع: {state.reference}
        {state.primaryUrl && (
          <>
            {"، "}
            <a href={state.primaryUrl} target="_blank" rel="noopener noreferrer">
              قراءة الحديث
            </a>
          </>
        )}
      </p>
      <div className="counter-row">
        <button className="primary" onClick={bump} disabled={count >= state.count}>
          {count >= state.count ? `تم (${count} من ${state.count})` : `عدّ (${count} من ${state.count})`}
        </button>
        <button className="ghost" onClick={reset}>
          إعادة
        </button>
      </div>
    </div>
  );
}
