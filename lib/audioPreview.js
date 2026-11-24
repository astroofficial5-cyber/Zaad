// One preview session at a time. A generation token cancels pending storage reads too.
import { getMuezzinObjectUrl } from './audioStore.js';
let active = null;
let generation = 0;
export function stopPreview() {
  generation++;
  if (!active) return;
  const old = active;
  active = null;
  old.audio.onended = null;
  old.audio.onerror = null;
  try { old.audio.pause(); } catch {}
  URL.revokeObjectURL(old.url);
}
export function previewingId() { return active ? active.id : null; }
/** @param {string} id @param {(state: string, text?: string) => void} onState */
export async function previewMuezzin(id, onState = () => {}) {
  stopPreview();
  const token = generation;
  let url;
  try { url = await getMuezzinObjectUrl(id); }
  catch {
    if (token === generation) onState('error', 'تعذر قراءة الملف المحفوظ على الجهاز');
    return;
  }
  if (token !== generation) { URL.revokeObjectURL(url); return; }
  const audio = new Audio(url);
  const session = { id, audio, url };
  active = session;
  const finish = () => {
    if (active !== session) return false;
    active = null;
    audio.onended = null;
    audio.onerror = null;
    URL.revokeObjectURL(url);
    return true;
  };
  audio.onended = () => { if (finish()) onState('stopped'); };
  audio.onerror = () => { if (finish()) onState('error', 'المتصفح ما قدرش يشغل الملف. ممكن الصيغة مش مدعومة أو الملف تالف'); };
  try {
    await audio.play();
    if (active === session && token === generation) onState('playing');
  } catch {
    if (finish()) onState('error', 'تعذر تشغيل الملف. جرب المعاينة مرة أخرى أو اختر ملفا بصيغة مدعومة');
  }
}
