"use client";

import { useEffect, useState } from "react";

// قارئ نص القرآن (الرسم العثماني، رواية حفص) من ملف Tanzil.
// النص يُعرض كما هو بدون أي تعديل. الملف يُحمَّل أول ما يُفتح التبويب.

type Aya = { n: number; text: string; bismillah?: string };
type Sura = { n: number; name: string; ayas: Aya[] };
type QuranData = { meta: { source: string; sourceUrl: string; license: string }; suras: Sura[] };

const SAJDA = "۩"; // علامة سجدة ۩ كما هي في النص

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function QuranTextTab({ hidden }: { hidden: boolean }) {
  const [data, setData] = useState<QuranData | null>(null);
  const [error, setError] = useState(false);
  const [openSura, setOpenSura] = useState<number | null>(null);

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
          <button type="button" onClick={() => setOpenSura(null)} className="full" style={{ marginBottom: 12 }}>
            رجوع إلى السور
          </button>
          <h2 style={{ textAlign: "center", margin: "4px 0 12px" }}>
            سورة {sura.name} <span className="muted">({toArabicDigits(sura.ayas.length)} آية)</span>
          </h2>
          {sura.ayas[0]?.bismillah && (
            <p className="quran-text quran-verses" style={{ textAlign: "center", margin: "0 0 14px" }}>
              {sura.ayas[0].bismillah}
            </p>
          )}
          <div className="card quran-text quran-verses" style={{ lineHeight: 2.4, fontSize: "1.45rem" }}>
            {sura.ayas.map((a) => (
              <span key={a.n} className="quran-aya">
                {a.text}
                {a.text.includes(SAJDA) && <span className="quran-sajda" aria-label="آية سجدة"> ۩</span>}
                <span className="quran-num" aria-hidden="true"> ﴿{toArabicDigits(a.n)}﴾ </span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: "center", margin: "4px 0 12px" }}>السور</h2>
          <ul className="quran-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {data.suras.map((s) => (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => setOpenSura(s.n)}
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
