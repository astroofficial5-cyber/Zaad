"use client";

import { useEffect, useState } from "react";
import { listMuezzins, addMuezzinFile, addMuezzinFromUrl, removeMuezzin } from "../lib/audioStore.js";
import { previewMuezzin, stopPreview, previewingId } from "../lib/audioPreview.js";
import { isNative, nativeListFiles, nativeDeleteFile, nativePickFile } from "../lib/nativeBridge.js";

type Props = { muezzinId: string | null; onSelect: (id: string | null) => void };

function sizeLabel(bytes: number) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} م.ب` : `${Math.round(bytes / 1024)} ك.ب`;
}

export default function MuezzinPanel({ muezzinId, onSelect }: Props) {
  const native = isNative();
  const [items, setItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewErr, setPreviewErr] = useState<{ id: string; text: string } | null>(null);

  const refresh = async () => {
    if (native) {
      setItems(nativeListFiles());
      setLoaded(true);
      return;
    }
    try {
      setItems(await listMuezzins());
      setLoadError("");
    } catch (e: any) {
      setLoadError(e?.message || "تعذر قراءة الملفات المحفوظة على جهازك");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    // إيقاف أي معاينة لما الصفحة تتقفل أو المبوّب يتغير
    return () => stopPreview();
  }, []);

  const selectedMissing = !!muezzinId && loaded && !items.some((i) => i.id === muezzinId);

  async function togglePreview(id: string) {
    if (previewingId() === id) {
      stopPreview();
      setPreviewing(null);
      return;
    }
    setPreviewErr(null);
    setPreviewing(id);
    await previewMuezzin(id, (state: string, text?: string) => {
      if (state === "playing") return;
      setPreviewing(null);
      if (state === "error") setPreviewErr({ id, text: text || "تعذر تشغيل الملف" });
    });
  }

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMsg("");
    const saved: string[] = [];
    const failed: string[] = [];
    let lastId: string | null = null;
    for (const file of Array.from(files)) {
      try {
        const rec = await addMuezzinFile(file);
        saved.push(file.name);
        lastId = rec.id;
      } catch (err: any) {
        failed.push(`${file.name}: ${err?.message || "فشل"}`);
      }
    }
    await refresh();
    if (lastId && muezzinId === null) onSelect(lastId);
    const parts = [];
    if (saved.length) parts.push(`اتحفظ ${saved.length} ملف على جهازك.`);
    if (failed.length) parts.push(`ما اتحفظش: ${failed.join("، ")}`);
    setMsg(parts.join(" "));
    setBusy(false);
  }

  async function importUrl() {
    setBusy(true);
    setMsg("");
    try {
      const rec = await addMuezzinFromUrl(url.trim());
      await refresh();
      onSelect(rec.id);
      setUrl("");
      setMsg("اتنزل الملف واتحفظ على جهازك.");
    } catch (err: any) {
      setMsg(err?.message || "الاستيراد فشل، والملف ما اتحفظش.");
    } finally {
      setBusy(false);
    }
  }

  async function pickNative() {
    setBusy(true);
    setMsg("");
    try {
      const id = await nativePickFile();
      await refresh();
      if (id) {
        onSelect(id);
        setMsg("اتحفظ الملف على جهازك.");
      } else {
        setMsg("ما اتخترش ملف، أو الملف ما اتنسخش (ممكن يكون أكبر من 20 ميجا).");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (previewingId() === id) {
      stopPreview();
      setPreviewing(null);
    }
    if (native) nativeDeleteFile(id);
    else await removeMuezzin(id);
    if (muezzinId === id) onSelect(null);
    setPreviewErr(null);
    await refresh();
  }

  return (
    <div className="card">
      <h2>صوت الأذان</h2>
      <p className="warn">
        مكتبة مؤذنين مدمجة لسه غير متوفرة. التطبيق ما فيهوش أي تسجيل أذان. أضف ملفات صوت أصلية تملك حق استخدامها، وهتتحفظ
        على جهازك بس ومش بتترفع لأي خادم.
      </p>

      {selectedMissing && (
        <p className="warn">
          الصوت المختار مش موجود على جهازك دلوقتي، والتنبيه هيستخدم نغمة التنبيه لحد ما تختار صوت تاني.
        </p>
      )}

      <label className="row">
        <span>نغمة تنبيه (مش أذان)</span>
        <input type="radio" name="muezzin" checked={muezzinId === null} onChange={() => onSelect(null)} />
      </label>

      {loadError && <p className="error">{loadError}</p>}
      {loaded && !loadError && items.length === 0 && (
        <p className="muted">ما أضفتش أي ملف صوت بعد.</p>
      )}

      {items.map((m) => (
        <div key={m.id} style={{ borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
          <div className="row" style={{ borderBottom: 0, padding: 0 }}>
            <label style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
              <input type="radio" name="muezzin" checked={muezzinId === m.id} onChange={() => onSelect(m.id)} />{" "}
              {m.name}
              {m.size ? <span className="muted"> ({sizeLabel(m.size)})</span> : null}
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {!native && (
                <button className="ghost" onClick={() => togglePreview(m.id)} aria-pressed={previewing === m.id}>
                  {previewing === m.id ? "إيقاف" : "معاينة"}
                </button>
              )}
              <button className="ghost" onClick={() => remove(m.id)}>
                حذف
              </button>
            </div>
          </div>
          {previewErr?.id === m.id && <p className="error" style={{ margin: "4px 0 0" }}>{previewErr.text}</p>}
        </div>
      ))}

      {native ? (
        <button className="btn-like" onClick={pickNative} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "جاري…" : "اختيار ملف صوت من الجهاز"}
        </button>
      ) : (
        <>
          <label className="btn-like" style={{ marginTop: 12, display: "inline-block" }}>
            {busy ? "جاري…" : "إضافة ملفات صوت من جهازك"}
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.wav"
              multiple
              hidden
              disabled={busy}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          <div style={{ marginTop: 14 }}>
            <p className="muted">أو تنزيل من رابط https لملف صوت مباشر. لو الموقع بيمنع التنزيل من المتصفح، الرابط ده مش هيشتغل، ونزّل الملف واختاره من جهازك:</p>
            <input className="full" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" />
            <button className="primary" onClick={importUrl} disabled={busy || !url.trim()} style={{ marginTop: 8 }}>
              تنزيل وحفظ
            </button>
          </div>
        </>
      )}

      {msg && <p className="muted" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
