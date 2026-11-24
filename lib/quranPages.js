// قارئ صفحات المصحف: صور الصفحات الأصلية من مجمع الملك فهد، مرقمة 001 إلى 604 داخل public/quran-pages.
// مفيش بحث نصي ولا تفسير ولا تلاوة هنا، والصور بتتحمّل صفحة صفحة بس.

export const PAGE_COUNT = 604;
export const SOURCE_URL = "https://qurancomplex.gov.sa/mushaf-printing";
const LAST_PAGE_KEY = "islamic-app:quran:last-page";

/** اسم ملف الصفحة بثلاث خانات: 1 -> 001. */
export function pageFileName(n) {
  return `${String(n).padStart(3, "0")}.webp`;
}

/** المسار النسبي للصورة (نفس قاعدة assetPrefix "./"). */
export function pageSrc(n) {
  return `./quran-pages/${pageFileName(n)}`;
}

/** يرجع رقم الصفحة لو صحيح بين 1 و604، وإلا null. */
export function parsePage(value) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value.trim()) : value;
  return Number.isInteger(n) && n >= 1 && n <= PAGE_COUNT ? n : null;
}

/** آخر صفحة مقروءة من التخزين المحلي، أو 1 لو مفيش أو التخزين مش متاح. */
export function loadLastPage() {
  try {
    if (typeof localStorage === "undefined") return 1;
    return parsePage(localStorage.getItem(LAST_PAGE_KEY)) ?? 1;
  } catch {
    return 1;
  }
}

export function saveLastPage(n) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LAST_PAGE_KEY, String(n));
  } catch {
    // التخزين مش متاح؛ القراءة شغالة من غيره
  }
}
