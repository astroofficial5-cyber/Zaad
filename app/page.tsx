"use client";

import { useEffect, useState, type ReactElement } from "react";
import { loadUiFont } from "../lib/uiFont.js";
import PrayerTab from "../components/PrayerTab";
import AzkarTab from "../components/AzkarTab";
import QuranTextTab from "../components/QuranTextTab";
import QiblaTab from "../components/QiblaTab";
import SettingsTab from "../components/SettingsTab";
import { loadSettings, saveSettings, loadPlace, DEFAULT_SETTINGS } from "../lib/settings.js";

const TABS = [
  { id: "prayer", label: "الصلاة" },
  { id: "azkar", label: "الأذكار" },
  { id: "quran", label: "القرآن" },
  { id: "qibla", label: "القبلة" },
  { id: "settings", label: "الإعدادات" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ICONS: Record<TabId, ReactElement> = {
  prayer: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  ),
  azkar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  quran: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5V4.5" />
    </svg>
  ),
  qibla: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </svg>
  ),
};

export default function Home() {
  const [tab, setTab] = useState<TabId>("prayer");
  // تغيير التبويب بيتسجل كخطوة في التاريخ، فزر الرجوع يرجع للتبويب السابق بدل ما يطلع من الموقع
  function goTab(id: TabId) {
    if (id === tab) return;
    try {
      window.history.pushState({ zaadTab: id }, "");
    } catch {
      /* التاريخ مش متاح: التبديل بيشتغل عادي */
    }
    setTab(id);
  }
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  // المكان متخزن هنا عشان كل التبويبات (الصلاة والقبلة) تشوف نفس التغيير فوراً
  const [place, setPlace] = useState<any>(null);

  // زر الرجوع في الموبايل: يرجع خطوة داخل الموقع
  useEffect(() => {
    loadUiFont();
  }, []);

  useEffect(() => {
    try {
      window.history.replaceState({ zaadTab: "prayer" }, "");
    } catch {
      /* مفيش تاريخ */
    }
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { zaadTab?: TabId } | null;
      if (st && st.zaadTab) setTab(st.zaadTab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    setSettings(loadSettings());
    setPlace(loadPlace());
    setReady(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // الـ PWA اختياري، والتطبيق يشتغل بدونه
      });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const update = (next: any) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="app">
      <header className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="8" fill="currentColor" />
            <circle cx="15.5" cy="10" r="6.5" fill="var(--accent)" />
          </svg>
        </div>
        <div>
          <h1>زاد</h1>
          <p className="muted" style={{ margin: 0 }}>
            مواقيت الصلاة حسب مكانك، والأذكار، والمصحف للقراءة، والقبلة.
          </p>
        </div>
      </header>

      <nav className="nav" role="tablist" aria-label="أقسام التطبيق">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "tab active" : "tab"}
            onClick={() => goTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">{ICONS[t.id]}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {ready && (
        <>
          <PrayerTab
            settings={settings}
            place={place}
            onPlaceChange={setPlace}
            hidden={tab !== "prayer"}
            onNavigate={(id) => goTab(id as TabId)}
          />
          <AzkarTab hidden={tab !== "azkar"} />
          <QuranTextTab hidden={tab !== "quran"} />
          <QiblaTab place={place} onGoToPrayer={() => goTab("prayer")} hidden={tab !== "qibla"} />
          {tab === "settings" && <SettingsTab settings={settings} onChange={update} />}
        </>
      )}
    </div>
  );
}
