"use client";

import { useEffect, useState } from "react";
import PrayerTab from "../components/PrayerTab";
import AzkarTab from "../components/AzkarTab";
import QuranTab from "../components/QuranTab";
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

export default function Home() {
  const [tab, setTab] = useState<TabId>("prayer");
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  // المكان متخزن هنا عشان كل التبويبات (الصلاة والقبلة) تشوف نفس التغيير فوراً
  const [place, setPlace] = useState<any>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setPlace(loadPlace());
    setReady(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
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
            onClick={() => setTab(t.id)}
          >
            {t.label}
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
          />
          <AzkarTab hidden={tab !== "azkar"} />
          <QuranTab hidden={tab !== "quran"} />
          <QiblaTab place={place} onGoToPrayer={() => setTab("prayer")} hidden={tab !== "qibla"} />
          {tab === "settings" && <SettingsTab settings={settings} onChange={update} />}
        </>
      )}
    </div>
  );
}
