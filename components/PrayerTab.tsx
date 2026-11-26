"use client";

import { useEffect, useMemo, useState } from "react";
import { PRAYER_KEYS, PRAYER_NAMES, applyOffsets, currentPrayerKey, formatCountdown, formatMinutes, hijriLabel, parseTimeToMinutes } from "../lib/time.js";
import { fetchPrayerData } from "../lib/prayerApi.js";
import { savePlace } from "../lib/settings.js";
import { CITIES, placeFromCity, validatePlace } from "../lib/places.js";
import { civilIn, addDaysCivil } from "../lib/zonedTime.js";
import { buildPlaceSchedule, nextUpcoming } from "../lib/schedule.js";
import { scheduleAdhanAt, notifyPrayer } from "../lib/adhan.js";
import { isNative, nativeScheduleItems, nativeCancel } from "../lib/nativeBridge.js";

const deviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

function messageFor(err: any) {
  if (err?.kind === "timeout") return "الاتصال أخد وقت طويل. جرّب تاني.";
  if (err?.kind === "bad-response") return "الخدمة رجعت بيانات مش متوقعة.";
  return "مفيش اتصال بالإنترنت، ومفيش نسخة محفوظة لليوم ده.";
}

const QUICK = [
  {
    id: "quran",
    label: "القرآن",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5V4.5" /></svg>
    ),
  },
  {
    id: "azkar",
    label: "الأذكار",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /></svg>
    ),
  },
  {
    id: "qibla",
    label: "القبلة",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>
    ),
  },
];

function dayTitle(c: any): string {
  return new Date(Date.UTC(c.y, c.m - 1, c.d, 12)).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default function PrayerTab({
  settings,
  place,
  onPlaceChange,
  hidden,
  onNavigate,
}: {
  settings: any;
  place: any;
  onPlaceChange: (p: any) => void;
  hidden: boolean;
  onNavigate?: (id: string) => void;
}) {
  const [view, setView] = useState<"today" | "days">("today");
  const [week, setWeek] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [today, setToday] = useState<any>({ status: "idle" });
  const [tomorrow, setTomorrow] = useState<any>({ status: "idle" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // تاريخ المكان نفسه (مش الجهاز): بيتغير لما اليوم في المكان يتغير
  const dayKey = place ? `${civilIn(place.tz, now).y}-${civilIn(place.tz, now).m}-${civilIn(place.tz, now).d}` : "";

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    const civil = civilIn(place.tz, Date.now());
    const tom = addDaysCivil(civil, 1);
    setToday({ status: "loading" });
    setTomorrow({ status: "loading" });
    fetchPrayerData({ place, method: settings.method, school: settings.school, civil })
      .then((data: any) => !cancelled && setToday({ status: "ok", data }))
      .catch((err: any) => !cancelled && setToday({ status: "error", message: messageFor(err) }));
    fetchPrayerData({ place, method: settings.method, school: settings.school, civil: tom })
      .then((data: any) => !cancelled && setTomorrow({ status: "ok", data }))
      .catch((err: any) => !cancelled && setTomorrow({ status: "error", message: messageFor(err) }));
    return () => {
      cancelled = true;
    };
  }, [place, dayKey, settings.method, settings.school, retry]);

  const tz: string | null = place?.tz ?? null;

  // أيام الأسبوع القادم: بتتحمّل بس لما المستخدم يفتح شاشة الأيام، ومش بتدخل في التنبيهات
  useEffect(() => {
    if (view !== "days" || !place) return;
    let cancelled = false;
    const base = civilIn(place.tz, Date.now());
    setWeek(Array.from({ length: 6 }, () => ({ status: "loading" })));
    for (let k = 1; k <= 6; k++) {
      const civil = addDaysCivil(base, k);
      fetchPrayerData({ place, method: settings.method, school: settings.school, civil })
        .then((data: any) => !cancelled && setWeek((prev) => prev.map((x, i) => (i === k - 1 ? { status: "ok", data } : x))))
        .catch((err: any) => !cancelled && setWeek((prev) => prev.map((x, i) => (i === k - 1 ? { status: "error", message: messageFor(err) } : x))));
    }
    return () => {
      cancelled = true;
    };
  }, [view, place, settings.method, settings.school, retry]);

  // أيام الجدول: اليوم والغد، كل يوم بمواقيته بعد الإزاحات. يوم ما اتحمّلش بيبقى {} والدالة بتتخطاه.
  const days = useMemo(() => {
    const toDay = (s: any) =>
      s.status === "ok"
        ? { civil: s.data.civil, minutes: applyOffsets(s.data.timings, settings.offsets) }
        : {};
    return [toDay(today), toDay(tomorrow)];
  }, [today, tomorrow, settings.offsets]);

  // الجدولة للتنبيهات: لحظات حقيقية بتوقيت المكان
  useEffect(() => {
    if (isNative() && !settings.notifications) {
      nativeCancel();
      return;
    }
    if (!tz || !settings.notifications) return;
    const list = buildPlaceSchedule({ tz, days, nowMs: Date.now(), limit: 10 });
    if (isNative()) {
      nativeScheduleItems({ items: list, playAudio: settings.playAdhan, fileId: settings.muezzinId });
      return;
    }
    return scheduleAdhanAt(list, (key: string) =>
      notifyPrayer({
        key,
        name: (PRAYER_NAMES as any)[key],
        playAudio: settings.playAdhan,
        muezzinId: settings.muezzinId,
      })
    );
  }, [tz, days, settings.notifications, settings.playAdhan, settings.muezzinId]);

  // العرض: الصلوات الباقية لليوم والغد، بعد العشاء بيظهر فجر الغد تلقائياً
  const upcoming = useMemo(
    () => (tz ? buildPlaceSchedule({ tz, days, nowMs: now, limit: 20 }) : []),
    [tz, days, now]
  );
  const next = nextUpcoming(upcoming, now);
  const todayMinutes = today.status === "ok" ? applyOffsets(today.data.timings, settings.offsets) : null;
  const tomorrowMinutes = tomorrow.status === "ok" ? applyOffsets(tomorrow.data.timings, settings.offsets) : null;
  // علامات اليوم: الصلاة الحالية (آخر صلاة دخل وقتها) والقادمة من مواقيت اليوم
  const nowParts = tz ? civilIn(tz, now) : null;
  const nowMin = nowParts ? nowParts.hh * 60 + nowParts.mm : null;
  const todayMarks: Record<string, string> = {};
  if (todayMinutes && nowMin !== null) {
    const sunriseMin = today.status === "ok" ? parseTimeToMinutes(today.data.timings?.Sunrise) : NaN;
    const last = currentPrayerKey(todayMinutes, nowMin, sunriseMin);
    if (last) todayMarks[last] = "الحالية";
    if (next && todayMinutes[next.key] !== null && todayMinutes[next.key] !== undefined && todayMinutes[next.key] > nowMin) {
      todayMarks[next.key] = "القادمة";
    }
  }
  const devTz = deviceTimeZone();
  const tzDiffers = !!tz && !!devTz && tz !== devTz;

  if (!place || editing) {
    return (
      <section hidden={hidden} aria-label="تحديد المكان">
        <PlaceSetup
          current={place}
          onCancel={place ? () => setEditing(false) : undefined}
          onSave={(p: any) => {
            savePlace(p);
            onPlaceChange(p);
            setEditing(false);
          }}
        />
      </section>
    );
  }

  const todayDate = today.status === "ok" ? today.data : null;
  const sourceLabel = (s: any) =>
    s.status === "ok"
      ? s.data.source === "cache"
        ? `نسخة محفوظة على جهازك (آخر تحديث ${new Date(s.data.fetchedAt).toLocaleTimeString("ar-EG", { timeZone: tz!, hour: "2-digit", minute: "2-digit" })} بتوقيت المكان)`
        : `محمّلة من الإنترنت (${new Date(s.data.fetchedAt).toLocaleTimeString("ar-EG", { timeZone: tz!, hour: "2-digit", minute: "2-digit" })} بتوقيت المكان)`
      : "";

  return (
    <section hidden={hidden} aria-label="مواقيت الصلاة">
      <div className="card">
        <div className="place-line">
          <strong>{place.name}</strong>
          <button className="ghost" onClick={() => setEditing(true)}>
            تغيير المكان
          </button>
        </div>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          منطقة المكان: <span dir="ltr">{tz}</span>
        </p>
        {tzDiffers && (
          <p className="warn" style={{ margin: "4px 0 0" }}>
            المواقيت محسوبة بتوقيت المكان المختار ({tz})، مش توقيت جهازك ({devTz}).
          </p>
        )}
        {todayDate && (
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {new Date(now).toLocaleDateString("ar-EG", {
              timeZone: tz!,
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {todayDate.hijri ? ` — ${hijriLabel(todayDate.hijri)}` : ""}
          </p>
        )}
        {today.status === "ok" && <p className="muted" style={{ margin: "4px 0 0" }}>{sourceLabel(today)}</p>}
      </div>

      {settings.notifications && (
        <p className="muted" style={{ margin: "0 0 12px" }}>
          التنبيهات مفعّلة. على الويب بتشتغل والصفحة مفتوحة فقط، ومش مضمونة في الخلفية أو مع قفل الشاشة.
        </p>
      )}

      {view === "today" ? (
        <>
          {next ? (
            <div className="card hero">
              <p style={{ margin: 0 }}>الصلاة القادمة</p>
              <p className="hero-name">{(PRAYER_NAMES as any)[next.key]}</p>
              <p className="hero-time" dir="ltr">
                {(() => {
                  const c = civilIn(tz!, next.at);
                  return formatMinutes(c.hh * 60 + c.mm);
                })()}
              </p>
              <p className="hero-count">باقي {formatCountdown(next.at - now)}</p>
            </div>
          ) : today.status === "loading" ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>جاري تحميل المواقيت…</p>
            </div>
          ) : (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>مش متاح عرض الصلاة القادمة الآن.</p>
            </div>
          )}

          <DayCard
            title="مواقيت اليوم"
            state={today}
            minutes={todayMinutes}
            marks={todayMarks}
            onRetry={() => setRetry((n) => n + 1)}
          />

          {onNavigate && (
            <div className="quick-grid" role="group" aria-label="أقسام التطبيق">
              {QUICK.map((q) => (
                <button key={q.id} type="button" className="quick-tile" onClick={() => onNavigate(q.id)}>
                  <span className="quick-icon" aria-hidden="true">{q.icon}</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          <button type="button" className="ghost full" onClick={() => setView("days")}>
            مواقيت الأيام القادمة ‹
          </button>
        </>
      ) : (
        <>
          <button type="button" className="ghost full" onClick={() => setView("today")}>
            › رجوع لمواقيت اليوم
          </button>
          <h2 style={{ textAlign: "center", margin: "12px 0" }}>الأيام القادمة</h2>
          {week.map((w: any, i: number) => {
            const civil = w.status === "ok" ? w.data.civil : tz ? addDaysCivil(civilIn(tz, now), i + 1) : null;
            const title = civil ? dayTitle(civil) : `اليوم +${i + 1}`;
            return (
              <DayCard
                title={title}
                state={w}
                minutes={w.status === "ok" ? applyOffsets(w.data.timings, settings.offsets) : null}
                onRetry={() => setRetry((n) => n + 1)}
              />
            );
          })}
        </>
      )}
    </section>
  );
}

function DayCard({
  title,
  state,
  minutes,
  marks,
  onRetry,
}: {
  title: string;
  state: any;
  minutes: any;
  marks?: Record<string, string>;
  onRetry: () => void;
}) {
  return (
    <div className="card day-card">
      <h2>{title}</h2>
      {state.status === "loading" && <p className="muted">جاري التحميل…</p>}
      {state.status === "error" && (
        <div>
          <p className="error">{state.message}</p>
          <button className="primary" onClick={onRetry}>
            إعادة المحاولة
          </button>
        </div>
      )}
      {state.status === "idle" && <p className="muted">—</p>}
      {minutes &&
        PRAYER_KEYS.map((key) => {
          const mark = marks?.[key];
          return (
            <div className={`row prayer-row${mark === "القادمة" ? " is-next" : ""}${mark === "الحالية" ? " is-current" : ""}`} key={key}>
              <span className="prayer-name">
                {(PRAYER_NAMES as any)[key]}
                {mark && <span className={`badge ${mark === "القادمة" ? "badge-next" : "badge-current"}`}>{mark}</span>}
              </span>
              <span className="prayer-time" dir="ltr">{minutes[key] === null ? "—" : formatMinutes(minutes[key])}</span>
            </div>
          );
        })}
    </div>
  );
}

function PlaceSetup({ current, onSave, onCancel }: { current: any; onSave: (p: any) => void; onCancel?: () => void }) {
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [name, setName] = useState(current?.name ?? "");
  const [lat, setLat] = useState(current ? String(current.lat) : "");
  const [lon, setLon] = useState(current ? String(current.lon) : "");
  const [tz, setTz] = useState(current?.tz ?? deviceTimeZone());
  const [errors, setErrors] = useState<string[]>([]);
  const [gpsMsg, setGpsMsg] = useState("");
  const [showManual, setShowManual] = useState(false);

  const pickCity = () => {
    const r = placeFromCity(cityId);
    if (r?.ok) onSave(r.place);
  };

  const askGps = () => {
    if (!navigator.geolocation) {
      setGpsMsg("المتصفح مش بيدعم تحديد الموقع. اختار مدينة أو أدخل الإحداثيات يدوياً.");
      return;
    }
    setGpsMsg("جاري طلب الموقع…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setName(name || "موقعي الحالي");
        setShowManual(true);
        setGpsMsg("تم تحديد الإحداثيات. راجع المنطقة الزمنية ثم احفظ.");
      },
      () => {
        setGpsMsg("الموقع مش متاح أو اترفض. ممكن تختار مدينة أو تدخل الإحداثيات يدوياً.");
      },
      { timeout: 15000 }
    );
  };

  const saveManual = () => {
    // بنبعت النصوص كما هي: validatePlace بيرفض الفاضي بدل ما يحوله لصفر
    const v = validatePlace({ name, lat, lon, tz, source: "manual" });
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    onSave(v.place);
  };

  return (
    <div className="card">
      <h2>اختار مكان المواقيت</h2>
      <p className="muted">المواقيت بتتحسب بتوقيت المكان اللي تختاره، مش توقيت جهازك.</p>

      <div className="field">
        <label htmlFor="city">مدينة جاهزة</label>
        <div className="counter-row">
          <select id="city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="primary" onClick={pickCity}>
            حفظ المدينة
          </button>
        </div>
      </div>

      <details className="privacy">
        <summary>الموقع والخصوصية</summary>
        <p style={{ margin: "8px 0 0" }}>
          لو تحب، نقدر نحدد موقعك التقريبي تلقائياً. مش هنطلب الموقع غير لما تضغط الزر ده. الإحداثيات بتتحفظ على جهازك،
          وبتتبعت لخدمة Aladhan عشان تحسب المواقيت، ومفيش حساب أو تسجيل.
        </p>
        <button className="ghost" style={{ marginTop: 8 }} onClick={askGps}>
          استخدم موقعي الحالي
        </button>
        {gpsMsg && <p className="muted" style={{ margin: "6px 0 0" }}>{gpsMsg}</p>}
      </details>

      <button className="ghost full" style={{ marginTop: 12 }} onClick={() => setShowManual((s) => !s)}>
        {showManual ? "إخفاء الإدخال اليدوي" : "إدخال الإحداثيات يدوياً"}
      </button>

      {showManual && (
        <div className="field">
          <label htmlFor="pname">اسم المكان (اختياري)</label>
          <input id="pname" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="plat">خط العرض (-90 إلى 90)</label>
          <input id="plat" type="number" dir="ltr" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
          <label htmlFor="plon">خط الطول (-180 إلى 180)</label>
          <input id="plon" type="number" dir="ltr" step="any" value={lon} onChange={(e) => setLon(e.target.value)} />
          <label htmlFor="ptz">المنطقة الزمنية (مثال: Africa/Cairo)</label>
          <input id="ptz" type="text" dir="ltr" value={tz} onChange={(e) => setTz(e.target.value)} />
          {errors.map((e) => (
            <p className="error" key={e}>{e}</p>
          ))}
          <button className="primary full" style={{ marginTop: 8 }} onClick={saveManual}>
            حفظ المكان
          </button>
        </div>
      )}

      {onCancel && (
        <button className="ghost full" style={{ marginTop: 10 }} onClick={onCancel}>
          رجوع
        </button>
      )}
    </div>
  );
}
