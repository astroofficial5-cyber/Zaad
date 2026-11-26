// تقدّم الأذكار: كل قسم (صباح / مساء / بعد الصلاة) له عدّاد مستقل لكل بند، لكل يوم.
// الصيغة الجديدة: azkar:hisn-v2:<اليوم>:<القسم>:<البند>
// المفتاح القديم azkar:hisn-v1:<اليوم>:<البند> بيتقرأ مرة واحدة لو مفيش مفتاح جديد لنفس القسم،
// وبيفضل محفوظ كما هو ولا بيتحذف.

export const PROGRESS_PREFIX = "azkar:hisn-v2";
export const LEGACY_PREFIX = "azkar:hisn-v1";

export function progressKey(day, sectionId, itemId) {
  return `${PROGRESS_PREFIX}:${day}:${sectionId}:${itemId}`;
}

export function legacyKey(day, itemId) {
  return `${LEGACY_PREFIX}:${day}:${itemId}`;
}

function toCount(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// يقرأ عدّاد البند داخل القسم. لو مفيش مفتاح للقسم ده ولقي قيمة قديمة لنفس البند اليوم،
// بينسخها للقسم ده مرة واحدة (والمفتاح القديم بيفضل زي ما هو).
export function readProgress(storage, day, sectionId, itemId) {
  const key = progressKey(day, sectionId, itemId);
  const current = storage.getItem(key);
  if (current !== null) return toCount(current);
  const legacy = storage.getItem(legacyKey(day, itemId));
  if (legacy !== null) {
    storage.setItem(key, legacy);
    return toCount(legacy);
  }
  return 0;
}

export function writeProgress(storage, day, sectionId, itemId, value) {
  storage.setItem(progressKey(day, sectionId, itemId), String(value));
}

// التصفير بيكتب "0" بدل ما يحذف، عشان القيمة القديمة ما ترجعش بعد التصفير.
export function resetProgress(storage, day, sectionId, itemId) {
  storage.setItem(progressKey(day, sectionId, itemId), "0");
}
