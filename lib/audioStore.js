// تخزين ملفات الأذان على جهاز المستخدم (IndexedDB). مفيش أي ملف صوت مضمّن بالتطبيق.

const DB_NAME = "islamic-app-audio";
const STORE = "muezzins";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(mp3|m4a|aac|ogg|oga|wav)$/i;

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("التخزين المحلي مش متاح في المتصفح ده"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => {
      req.result.onversionchange = () => req.result.close();
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req?.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** يرجع رسالة الخطأ بالعربي، أو null لو الملف مقبول. دالة خالصة عشان تتختبر. */
export function checkAudioFile({ name, type, size }) {
  if (!(size > 0)) return "الملف فاضي";
  if (size > MAX_BYTES) return "الملف أكبر من 20 ميجا";
  const looksAudio = (type || "").startsWith("audio/") || ALLOWED_EXT.test(name || "");
  if (!looksAudio) return "الملف مش صوت (mp3 أو m4a أو ogg أو wav)";
  return null;
}

function validate(name, type, size) {
  const err = checkAudioFile({ name, type, size });
  if (err) throw new Error(err);
}

async function save(fields) {
  const record = { id: randomId(), addedAt: Date.now(), ...fields };
  await withStore("readwrite", (s) => s.put(record));
  return { id: record.id, name: record.name, size: record.size, addedAt: record.addedAt, origin: record.origin };
}

export async function listMuezzins() {
  const all = (await withStore("readonly", (s) => s.getAll())) || [];
  return all
    .map(({ id, name, size, addedAt, origin }) => ({ id, name, size, addedAt, origin }))
    .sort((a, b) => a.addedAt - b.addedAt);
}

export async function addMuezzinFile(file) {
  validate(file.name, file.type, file.size);
  return save({ name: file.name, type: file.type || "audio/mpeg", size: file.size, blob: file, origin: "file" });
}

// تنزيل من رابط يختاره المستخدم بنفسه. ممكن يفشل بسبب CORS أو سياسة الموقع (مش مجرب مع مصدر حقيقي).
export async function addMuezzinFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("الرابط مش صحيح");
  }
  if (parsed.protocol !== "https:") throw new Error("لازم الرابط يكون https");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(parsed.href, { signal: controller.signal });
  } catch {
    throw new Error("تعذر التنزيل. الموقع ممكن يمنع التنزيل من المتصفح، أو الاتصال ضعيف. الملف ما اتحفظش");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`الملف ما اتنزلش (HTTP ${res.status}). الملف ما اتحفظش`);

  const type = res.headers.get("content-type") || "";
  // صفحة HTML أو JSON باسم .mp3 مش ملف صوت
  if (/^(text\/|application\/(json|xhtml))/i.test(type)) {
    throw new Error("الرابط ده صفحة مش ملف صوت مباشر. الملف ما اتحفظش");
  }
  const blob = await res.blob();
  const name = decodeURIComponent(parsed.pathname.split("/").pop() || "") || "audio";
  validate(name, type, blob.size);
  return save({ name, type: type || "audio/mpeg", size: blob.size, blob, origin: "url", host: parsed.hostname });
}

export async function removeMuezzin(id) {
  await withStore("readwrite", (s) => s.delete(id));
}

export async function getMuezzinObjectUrl(id) {
  const record = await withStore("readonly", (s) => s.get(id));
  if (!record) throw new Error("الملف ما لقيتوش على الجهاز");
  return URL.createObjectURL(record.blob);
}
