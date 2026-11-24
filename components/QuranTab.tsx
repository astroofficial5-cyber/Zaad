"use client";

import { useEffect, useState } from "react";
import { PAGE_COUNT, SOURCE_URL, pageSrc, parsePage, loadLastPage, saveLastPage } from "../lib/quranPages.js";

const ZOOM_LEVELS = [100, 140, 180];

export default function QuranTab({ hidden }: { hidden: boolean }) {
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  // الصورة بتتحمّل أول مرة بس بعد ما التبويب يتفتح، ومفيش تحميل مسبق
  const [opened, setOpened] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [jumpValue, setJumpValue] = useState("");
  const [jumpError, setJumpError] = useState("");

  useEffect(() => {
    setPage(loadLastPage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!hidden) setOpened(true);
  }, [hidden]);

  useEffect(() => {
    if (ready) saveLastPage(page);
  }, [page, ready]);

  // كل تغيير صفحة أو إعادة محاولة بيرجعنا لحالة التحميل
  useEffect(() => {
    setStatus("loading");
  }, [page, attempt]);

  const goTo = (n: number) => {
    setPage(n);
    setJumpError("");
  };

  const submitJump = () => {
    const n = parsePage(jumpValue);
    if (n === null) {
      setJumpError(`أدخل رقم صفحة من 1 إلى ${PAGE_COUNT}`);
      return;
    }
    setJumpValue("");
    goTo(n);
  };

  const zoom = ZOOM_LEVELS[zoomIdx];
  const src = `${pageSrc(page)}${attempt ? `?r=${attempt}` : ""}`;

  return (
    <section hidden={hidden} aria-label="قراءة المصحف">
      <div className="card">
        <div className="counter-row" style={{ justifyContent: "space-between" }}>
          <button className="ghost" onClick={() => goTo(page + 1)} disabled={page >= PAGE_COUNT}>
            التالي
          </button>
          <strong aria-live="polite">الصفحة {page} من {PAGE_COUNT}</strong>
          <button className="ghost" onClick={() => goTo(page - 1)} disabled={page <= 1}>
            السابق
          </button>
        </div>

        <div className="counter-row">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={PAGE_COUNT}
            dir="ltr"
            placeholder={`1 - ${PAGE_COUNT}`}
            aria-label="رقم الصفحة"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitJump();
            }}
          />
          <button className="primary" onClick={submitJump}>
            انتقال
          </button>
        </div>
        {jumpError && <p className="error" style={{ margin: "6px 0 0" }}>{jumpError}</p>}

        <div className="counter-row">
          <button
            className="ghost"
            onClick={() => setZoomIdx((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))}
            disabled={zoomIdx >= ZOOM_LEVELS.length - 1}
          >
            تكبير
          </button>
          <button className="ghost" onClick={() => setZoomIdx((i) => Math.max(i - 1, 0))} disabled={zoomIdx <= 0}>
            تصغير
          </button>
          <span className="muted">{zoom}%</span>
        </div>
      </div>

      <div className="card quran-frame">
        {!opened && <p className="muted">افتح التبويب لتحميل الصفحة.</p>}
        {opened && status === "loading" && <p className="muted">جاري تحميل الصفحة {page}…</p>}
        {opened && status === "error" && (
          <div>
            <p className="error">تعذر تحميل صورة الصفحة {page}. تأكد من الاتصال ثم حاول تاني.</p>
            <button className="primary" onClick={() => setAttempt((n) => n + 1)}>
              إعادة المحاولة
            </button>
          </div>
        )}
        {opened && (
          <img
            key={`${page}-${attempt}`}
            src={src}
            alt={`صفحة ${page} من المصحف الشريف`}
            decoding="async"
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("error")}
            hidden={status === "error"}
            style={{ width: `${zoom}%` }}
          />
        )}
      </div>

      <details className="card source-note">
        <summary>
          المصدر: <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">مجمع الملك فهد لطباعة المصحف الشريف</a>
        </summary>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          صور الصفحات الأصلية كما طُبعت، بدون بحث نصي أو تفسير أو تلاوة في هذه النسخة.
        </p>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          حسب قسم حقوق الاستخدام في الصفحة الرسمية: الاستخدام مجاناً للمواقع والبرامج والأعمال الشخصية، والمجمع غير مسؤول عن
          الأخطاء الفنية. الصفحة لا تنص صراحة على إعادة توزيع الملفات نفسها.
        </p>
      </details>
    </section>
  );
}
