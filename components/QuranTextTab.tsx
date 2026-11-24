"use client";

import { useEffect, useRef, useState } from "react";

// قارئ نص القرآن (الرسم العثماني، رواية حفص) من ملف Tanzil.
// النص يُعرض كما هو بدون أي تعديل. الملف يُحمَّل أول ما يُفتح التبويب.

type Aya = { n: number; text: string; bismillah?: string };
type Sura = { n: number; name: string; ayas: Aya[] };
type QuranData = { meta: { source: string; sourceUrl: string; license: string }; suras: Sura[] };

const SAJDA = "۩"; // علامة سجدة ۩ كما هي في النص

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

// مفاتيح التخزين المحلي، ومعظمها اختياري: لو التخزين مش متاح، القارئ بيشتغل عادي.
const FONT_KEY = "zaad:quran:font";
const LAST_KEY = "zaad:quran:last";
const LAST_AYA_KEY = "zaad:quran:lastaya"; // بصيغة "سورة:آية"
const FONT_MIN = 1.0;
const FONT_MAX = 2.2;
const FONT_STEP = 0.15;
const FONT_DEFAULT = 1.45;

function readStored(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStored(key: string, value: string) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    /* التخزين مش متاح: مفيش مشكلة */
  }
}

// تطبيع الاسم للبحث: بيشيل التشكيل وبيوحّد الألف والتاء المربوطة والياء
function normalizeAr(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export default function QuranTextTab({ hidden }: { hidden: boolean }) {
  const [data, setData] = useState<QuranData | null>(null);
  const [error, setError] = useState(false);
  const [openSura, setOpenSura] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(FONT_DEFAULT);
  const [lastSura, setLastSura] = useState<number | null>(null);
  const [lastAya, setLastAya] = useState<{ sura: number; aya: number } | null>(null);
  // الآية اللي المستخدم هيرجع لها بعد "متابعة": بتتطبق بعد ما السورة تتعرض
  const pendingScroll = useRef<{ sura: number; aya: number } | null>(null);

  useEffect(() => {
    const f = Number(readStored(FONT_KEY));
    if (f >= FONT_MIN && f <= FONT_MAX) setFontSize(f);
    const l = Number(readStored(LAST_KEY));
    if (Number.isInteger(l) && l >= 1 && l <= 114) setLastSura(l);
    const la = /^(\d+):(\d+)$/.exec(readStored(LAST_AYA_KEY) || "");
    if (la) setLastAya({ sura: Number(la[1]), aya: Number(la[2]) });
  }, []);

  // حفظ آخر آية ظاهرة أثناء القراءة، وإرجاع المستخدم لها عند "متابعة"
  useEffect(() => {
    if (openSura === null || typeof window === "undefined") return;
    const pending = pendingScroll.current;
    if (pending && pending.sura === openSura) {
      const el = document.querySelector(`[data-aya="${pending.aya}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "start" });
      pendingScroll.current = null;
    }
    let timer: number | null = null;
    const save = () => {
      timer = null;
      const nodes = document.querySelectorAll<HTMLElement>(`[data-sura="${openSura}"][data-aya]`);
      let found: number | null = null;
      nodes.forEach((el) => {
        if (el.getBoundingClientRect().top <= 140) found = Number(el.dataset.aya);
      });
      if (found !== null) {
        const value = { sura: openSura, aya: found };
        setLastAya(value);
        writeStored(LAST_AYA_KEY, `${openSura}:${found}`);
      }
    };
    const onScroll = () => {
      if (timer === null) timer = window.setTimeout(save, 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [openSura]);

  function continueReading() {
    if (lastAya) {
      pendingScroll.current = lastAya;
      openSuraAt(lastAya.sura);
    } else if (lastSura !== null) {
      openSuraAt(lastSura);
    }
  }

  function changeFont(delta: number) {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round((prev + delta) * 100) / 100));
      writeStored(FONT_KEY, String(next));
      return next;
    });
  }

  function openSuraAt(n: number) {
    setOpenSura(n);
    setLastSura(n);
    writeStored(LAST_KEY, String(n));
  }

  // خط Amiri Quran (OFL 1.1) لنص الآيات فقط. الملف جنب الموقع في public/fonts.
  useEffect(() => {
    if (typeof FontFace === "undefined" || typeof document === "undefined") return;
    const face = new FontFace("AmiriQuranTanzil", "url(./fonts/AmiriQuran-Regular.ttf)");
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => {
        /* لو الخط ما اتحملش، النص بيتعرض بالخط الاحتياطي */
      });
  }, []);

  useEffect(() => {
    if (hidden || data || error) return;
    fetch("./quran/quran-uthmani.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: QuranData) => setData(d))
      .catch(() => setError(true));
  }, [hidden, data, error]);

  if (hidden) return null;

  if (error) {
    return (
      <section className="card">
        <p className="muted">تعذّر تحميل نص القرآن. حاول تحديث الصفحة.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <p className="muted">جاري تحميل النص…</p>
      </section>
    );
  }

  const sura = openSura === null ? null : data.suras.find((s) => s.n === openSura) ?? null;

  return (
    <section>
      {sura ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setOpenSura(null)} className="full" style={{ flex: 2 }}>
              رجوع إلى السور
            </button>
            <button
              type="button"
              onClick={() => changeFont(-FONT_STEP)}
              disabled={fontSize <= FONT_MIN}
              aria-label="تصغير الخط"
              style={{ flex: 1 }}
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => changeFont(FONT_STEP)}
              disabled={fontSize >= FONT_MAX}
              aria-label="تكبير الخط"
              style={{ flex: 1 }}
            >
              A+
            </button>
          </div>
          <h2 style={{ textAlign: "center", margin: "4px 0 12px" }}>
            سورة {sura.name} <span className="muted">({toArabicDigits(sura.ayas.length)} آية)</span>
          </h2>
          {sura.ayas[0]?.bismillah && (
            <p className="quran-text quran-verses" style={{ textAlign: "center", margin: "0 0 14px" }}>
              {sura.ayas[0].bismillah}
            </p>
          )}
          <div className="card quran-text quran-verses" style={{ lineHeight: 2.4, fontSize: `${fontSize}rem` }}>
            {sura.ayas.map((a) => (
              <span key={a.n} className="quran-aya" data-sura={sura.n} data-aya={a.n}>
                {a.text}
                <span className="quran-num" aria-hidden="true"> ﴿{toArabicDigits(a.n)}﴾ </span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: "center", margin: "4px 0 12px" }}>السور</h2>
          {lastSura !== null && (
            <button
              type="button"
              className="full"
              onClick={continueReading}
              style={{ marginBottom: 10 }}
            >
              متابعة من آخر موضع: سورة {data.suras[(lastAya ? lastAya.sura : lastSura) - 1]?.name}
              {lastAya ? ` (آية ${toArabicDigits(lastAya.aya)})` : ""}
            </button>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها"
            aria-label="بحث في السور"
            className="full"
            style={{ marginBottom: 10 }}
          />
          <ul className="quran-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {data.suras
              .filter((s) => {
                const q = normalizeAr(query);
                if (!q) return true;
                if (/^\d+$/.test(q)) return String(s.n) === q;
                return normalizeAr(s.name).includes(q);
              })
              .map((s) => (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => openSuraAt(s.n)}
                  className="full"
                  style={{ display: "flex", justifyContent: "space-between", margin: "0 0 8px" }}
                >
                  <span>
                    {toArabicDigits(s.n)}. سورة {s.name}
                  </span>
                  <span className="muted">{toArabicDigits(s.ayas.length)} آية</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 16, textAlign: "center" }}>
        نص القرآن: {data.meta.source} —{" "}
        <a href={data.meta.sourceUrl} target="_blank" rel="noopener noreferrer">
          tanzil.net
        </a>
        <br />
        الرسم العثماني، رواية حفص. الترخيص: {data.meta.license}.
        <br />
        الخط: Amiri Quran (
        <a href="./fonts/OFL-AmiriQuran.txt" target="_blank" rel="noopener noreferrer">
          SIL OFL 1.1
        </a>
        ).
      </p>
    </section>
  );
}
