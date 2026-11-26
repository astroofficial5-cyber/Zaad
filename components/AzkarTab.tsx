"use client";

import { useEffect, useRef, useState } from "react";
import { readProgress, resetProgress, writeProgress } from "../lib/azkarProgress.js";
import { AZKAR_SECTIONS, SECTION_SOURCES } from "../lib/azkarData.js";
import { getAzkarState } from "../lib/approvedContent.js";
import AzkarCandidates, { CANDIDATES_ENABLED, CANDIDATES_TAB_LABEL } from "./AzkarCandidatesRuntime";

// أرقام عربية عشان العدّاد يتقري صح في الاتجاه العربي
function toArDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

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
                <AzkarItem key={id} itemId={id} sectionId={section.id} />
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

function AzkarItem({ itemId, sectionId }: { itemId: string; sectionId: string }) {
  const state = getAzkarState(itemId);
  const [count, setCount] = useState(0);
  const approved = state.status === "approved";

  useEffect(() => {
    if (!approved) return;
    try {
      setCount(readProgress(localStorage, todayKey(), sectionId, itemId));
    } catch {
      setCount(0);
    }
  }, [itemId, sectionId, approved]);

  // التصفير بالضغط المطوّل (ثانية) عشان ما يحصلش بالخطأ.
  // الـhooks لازم تتعرّف قبل أي return شرطي.
  const resetTimer = useRef<number | null>(null);
  const [resetHint, setResetHint] = useState(false);

  if (!approved) return null;

  // بدون عدد (count = null): زر واحد «تمت القراءة» يتبدّل بين تم ولم يتم
  const noCount = state.count === null;

  const bump = () => {
    const next = noCount ? (count >= 1 ? 0 : 1) : Math.min(count + 1, state.count);
    setCount(next);
    try {
      writeProgress(localStorage, todayKey(), sectionId, itemId, next);
    } catch {
      // التخزين مش متاح؛ العداد بيفضل شغال لحد ما الصفحة تتقفل
    }
    if (noCount) return; // بدون عدد: مفيش اهتزاز اكتمال مرتبط بعدد
    // اهتزاز خفيف عند كل ضغطة، واهتزاز مميز عند الاكتمال (لو الجهاز بيدعمه)
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(next >= state.count ? [60, 40, 60] : 15);
      }
    } catch {
      /* الاهتزاز مش مدعوم */
    }
  };

  const reset = () => {
    setCount(0);
    try {
      resetProgress(localStorage, todayKey(), sectionId, itemId);
    } catch {
      // مفيش تخزين متاح
    }
  };

  const startLongPress = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      reset();
      resetTimer.current = null;
      setResetHint(false);
    }, 1000);
  };
  const cancelLongPress = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = null;
  };

  return (
    <div className="card">
      <p className="ayah-text">{state.text}</p>
      <p className="muted">{state.countNote}</p>
      {state.primaryNote && <p className="muted">{state.primaryNote}</p>}
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
      <div className="counter-row" style={{ flexDirection: "column", gap: 8 }}>
        {noCount ? (
          <button
            className="primary"
            onClick={bump}
            aria-pressed={count >= 1}
            style={{ width: "100%", minHeight: 96, fontSize: "1.5rem", fontWeight: 700 }}
          >
            {count >= 1 ? "✓ تمت القراءة" : "تمت القراءة"}
          </button>
        ) : (
        <button
          className="primary"
          onClick={bump}
          disabled={count >= state.count}
          aria-label={count >= state.count ? `تم الذكر، ${count} من ${state.count}` : `عدّ، أتممت ${count} من ${state.count}`}
          style={{ width: "100%", minHeight: 96, fontSize: "1.5rem", fontWeight: 700 }}
        >
          {count >= state.count
            ? `✓ تم الذكر ${toArDigits(state.count)} مرة`
            : `أتممت ${toArDigits(count)} من ${toArDigits(state.count)}`}
          {count < state.count && (
            <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 400, opacity: 0.85, marginTop: 4 }}>
              اضغط للعدّ
            </span>
          )}
        </button>
        )}
        <button
          className="ghost"
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onClick={() => setResetHint(true)}
          style={{ width: "100%", minHeight: 44 }}
        >
          {resetHint ? "اضغط مطولاً لثانية للتصفير" : "إعادة (اضغط مطولاً)"}
        </button>
      </div>
    </div>
  );
}
