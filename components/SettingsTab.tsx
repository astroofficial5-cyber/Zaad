"use client";

import { useState } from "react";
import { METHODS } from "../lib/prayerApi.js";
import { PRAYER_KEYS, PRAYER_NAMES } from "../lib/time.js";
import MuezzinPanel from "./MuezzinPanel";
import { requestNotificationPermission } from "../lib/adhan.js";
import { DEFAULT_SETTINGS } from "../lib/settings.js";
import { isNative, nativeCanUseExact, nativeRequestNotifications } from "../lib/nativeBridge.js";

type Props = { settings: any; onChange: (s: any) => void };

export default function SettingsTab({ settings, onChange }: Props) {
  const [notifNote, setNotifNote] = useState("");

  const set = (patch: any) => onChange({ ...settings, ...patch });

  const setOffset = (key: string, value: string) => {
    const n = Math.max(-60, Math.min(60, Number(value) || 0));
    set({ offsets: { ...settings.offsets, [key]: n } });
  };

  async function toggleNotifications(on: boolean) {
    if (on && isNative()) {
      nativeRequestNotifications();
      setNotifNote(
        nativeCanUseExact()
          ? ""
          : "أندرويد مش مفعّل فيه التنبيه الدقيق للتطبيق. التنبيهات هتتأخر دقايق لحد ما تفعّل الإذن ده من إعدادات الجهاز"
      );
    } else if (on) {
      const perm = await requestNotificationPermission();
      setNotifNote(
        perm === "granted"
          ? ""
          : perm === "unsupported"
          ? "المتصفح ده مش بيدعم الإشعارات"
          : "الإشعارات متقفلة من إعدادات المتصفح. التنبيه بالصوت هيشتغل بس لو الصفحة مفتوحة"
      );
    }
    set({ notifications: on });
  }

  return (
    <section aria-label="الإعدادات">
      <div className="card">
        <h2>طريقة الحساب</h2>
        <select value={settings.method} onChange={(e) => set({ method: Number(e.target.value) })} className="full">
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <h2 style={{ marginTop: 16 }}>حساب العصر</h2>
        <label className="row">
          <span>شافعي / مالكي / حنبلي</span>
          <input type="radio" name="school" checked={settings.school === 0} onChange={() => set({ school: 0 })} />
        </label>
        <label className="row">
          <span>حنفي</span>
          <input type="radio" name="school" checked={settings.school === 1} onChange={() => set({ school: 1 })} />
        </label>
      </div>

      <div className="card">
        <h2>تعديل الدقائق لكل صلاة</h2>
        <p className="muted">من -60 لـ 60 دقيقة. مفيد لو المسجد عندك بيختلف.</p>
        {PRAYER_KEYS.map((key) => (
          <div className="row" key={key}>
            <span>{(PRAYER_NAMES as any)[key]}</span>
            <input
              type="number"
              min={-60}
              max={60}
              value={settings.offsets[key] ?? 0}
              onChange={(e) => setOffset(key, e.target.value)}
              style={{ width: 90 }}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>التنبيهات</h2>
        <label className="row">
          <span>تنبيه عند كل صلاة</span>
          <input type="checkbox" checked={settings.notifications} onChange={(e) => toggleNotifications(e.target.checked)} />
        </label>
        <label className="row">
          <span>تشغيل الصوت</span>
          <input type="checkbox" checked={settings.playAdhan} onChange={(e) => set({ playAdhan: e.target.checked })} />
        </label>
        {notifNote && <p className="warn">{notifNote}</p>}
        <p className="muted">
          على الويب: التنبيه يشتغل والصفحة مفتوحة فقط، ومش مضمون في الخلفية أو مع قفل الشاشة أو إغلاق المتصفح. التنبيه الخلفي على أندرويد متوقف في هذه النسخة.
        </p>
      </div>

      <MuezzinPanel muezzinId={settings.muezzinId} onSelect={(id) => set({ muezzinId: id })} />

      <div className="card">
        <h2>المظهر</h2>
        <select value={settings.theme} onChange={(e) => set({ theme: e.target.value })} className="full">
          <option value="auto">تلقائي حسب الجهاز</option>
          <option value="light">فاتح</option>
          <option value="dark">ليلي</option>
        </select>
        <button className="ghost" style={{ marginTop: 12 }} onClick={() => onChange(structuredClone(DEFAULT_SETTINGS))}>
          استعادة الإعدادات الافتراضية
        </button>
      </div>
    </section>
  );
}
