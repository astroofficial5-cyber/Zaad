"use client";

import { useEffect, useState } from "react";
import { fetchQiblaDirection } from "../lib/prayerApi.js";

export default function QiblaTab({
  place,
  onGoToPrayer,
  hidden,
}: {
  place: any;
  onGoToPrayer: () => void;
  hidden: boolean;
}) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ok" | "error"; direction?: number; message?: string }>({
    status: "idle",
  });
  const [attempt, setAttempt] = useState(0);
  // حالة مستشعر الاتجاه (البوصلة): الشاشة بتعرض رسالة إرشادية حسب الحالة
  const [sensor, setSensor] = useState<"checking" | "unsupported" | "no-reading" | "ok">("checking");

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSensor("unsupported");
      return;
    }
    let got = false;
    const onOrientation = (e: Event) => {
      const ev = e as DeviceOrientationEvent;
      if (ev.alpha !== null && ev.alpha !== undefined) {
        got = true;
        setSensor("ok");
      }
    };
    window.addEventListener("deviceorientationabsolute", onOrientation);
    window.addEventListener("deviceorientation", onOrientation);
    // لو مفيش قراءة بعد ثانيتين ونص، بنعرض رسالة المعايرة بدل ما نسيب الشاشة فاضية
    const timer = window.setTimeout(() => {
      if (!got) setSensor("no-reading");
    }, 2500);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
      window.clearTimeout(timer);
    };
  }, []);

  const lat = place?.lat;
  const lon = place?.lon;

  // بيتعاد الحساب لما المكان يتغير من أي تبويب، أو لما المستخدم يضغط إعادة المحاولة
  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    fetchQiblaDirection(lat, lon)
      .then((d: number) => !cancelled && setState({ status: "ok", direction: d }))
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "تعذر حساب اتجاه القبلة. تأكد من الاتصال وحاول تاني." });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, attempt]);

  return (
    <section hidden={hidden} aria-label="القبلة">
      {!place && (
        <div className="card warn-box">
          <p style={{ margin: 0 }}>لازم تختار مكانك الأول، عشان نحسب اتجاه القبلة من إحداثياته.</p>
          <button className="primary" style={{ marginTop: 10 }} onClick={onGoToPrayer}>
            اختيار المكان
          </button>
        </div>
      )}

      {place && state.status === "loading" && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>جاري حساب اتجاه القبلة لـ {place.name}…</p>
        </div>
      )}

      {place && state.status === "error" && (
        <div className="card">
          <p className="error" style={{ margin: 0 }}>{state.message}</p>
          <button className="primary" style={{ marginTop: 10 }} onClick={() => setAttempt((n) => n + 1)}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {place && state.status === "ok" && state.direction !== undefined && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="muted" style={{ margin: "0 0 8px" }}>القبلة من {place.name}</p>
          <div
            aria-label={`السهم يشير إلى ${state.direction.toFixed(1)} درجة من الشمال`}
            style={{ fontSize: 72, transform: `rotate(${state.direction}deg)`, transition: "transform .3s" }}
          >
            ↑
          </div>
          <p>الاتجاه: {state.direction.toFixed(1)}° من الشمال الحقيقي</p>
          <p className="warn">
            السهم بيوضح اتجاه القبلة بالنسبة للشمال فقط. الشاشة مش بتقرأ البوصلة، فلازم تحدد الشمال بنفسك أو بتطبيق بوصلة.
          </p>
          {sensor === "unsupported" && (
            <p className="muted">
              متصفحك ما بيدعمش مستشعر الاتجاه. استخدم بوصلة الجهاز أو تطبيق بوصلة لتحديد الشمال.
            </p>
          )}
          {sensor === "no-reading" && (
            <p className="muted">
              مفيش قراءة من مستشعر الاتجاه على جهازك الآن. تأكد إن إذن الحركة والاتجاه مفعّل، وحرّك الهاتف في شكل رقم 8 لمعايرة البوصلة.
            </p>
          )}
          {sensor === "ok" && (
            <p className="muted">
              لو الاتجاه مش دقيق، حرّك الهاتف في شكل رقم 8 لمعايرة البوصلة، وابعد عن المعادن والمغناطيس.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
