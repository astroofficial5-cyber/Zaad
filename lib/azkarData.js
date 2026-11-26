// هيكل الأذكار فقط. لا يوجد أي نص ذكر هنا.
// كل نص لازم يجي من سجل معتمد في content/records (انظر lib/contentImport.js) بعد نقله من أصل متحقق.
// النصوص القديمة اللي اتكتبت من الذاكرة اتشالت بالكامل ومش بتتعرض.

export const AZKAR_SECTIONS = [
  { id: "after-prayer", title: "أذكار بعد الصلاة", itemIds: ["ap-1", "ap-2", "ap-3", "ap-5", "ap-4", "ap-tasbih-33", "ap-ibnmajah-fajr-925", "ap-muawwidhat", "ap-ayat-kursi", "ap-6"] },
  { id: "morning", title: "أذكار الصباح", itemIds: ["ms-ikhlas-3", "ms-falaq-3", "ms-nas-3", "ms-asbahna-2723", "m-2", "ms-sayyid-1", "m-3", "m-1", "m-4", "ms-ashhadk-4-m", "ms-afini-3", "ms-hasbiya-7", "ms-afw-1", "ms-radeet-3", "ms-tahlil-100-sabah", "ms-khalqihi-3-m", "ms-istighfar-100"] },
  { id: "evening", title: "أذكار المساء", itemIds: ["ms-ikhlas-3", "ms-falaq-3", "ms-nas-3", "e-2", "ms-sayyid-1", "e-3", "e-1", "e-4", "ms-afini-3", "ms-hasbiya-7", "ms-afw-1", "ms-radeet-3", "ms-istighfar-100"] },
];

// كل عنصر: الحالة "awaiting-source" لحد ما يتضاف سجل معتمد له.
export const AZKAR_ITEMS = {
  "ap-1": { id: "ap-1", status: "awaiting-source" },
  "ap-2": { id: "ap-2", status: "awaiting-source" },
  "ap-3": { id: "ap-3", status: "awaiting-source" },
  "ap-4": { id: "ap-4", status: "awaiting-source" },
  "ap-5": { id: "ap-5", status: "awaiting-source" },
  "ap-6": { id: "ap-6", status: "awaiting-source" },
  "m-1": { id: "m-1", status: "awaiting-source" },
  "m-2": { id: "m-2", status: "awaiting-source" },
  "m-3": { id: "m-3", status: "awaiting-source" },
  "m-4": { id: "m-4", status: "awaiting-source" },
  "ms-ashhadk-4-m": { id: "ms-ashhadk-4-m", status: "awaiting-source" },
  "ms-afini-3": { id: "ms-afini-3", status: "awaiting-source" },
  "ms-khalqihi-3-m": { id: "ms-khalqihi-3-m", status: "awaiting-source" },
  "ms-ikhlas-3": { id: "ms-ikhlas-3", status: "awaiting-source" },
  "ms-falaq-3": { id: "ms-falaq-3", status: "awaiting-source" },
  "ms-nas-3": { id: "ms-nas-3", status: "awaiting-source" },
  "ms-afw-1": { id: "ms-afw-1", status: "awaiting-source" },
  "ap-tasbih-33": { id: "ap-tasbih-33", status: "awaiting-source" },
  "ap-muawwidhat": { id: "ap-muawwidhat", status: "awaiting-source" },
  "ap-ayat-kursi": { id: "ap-ayat-kursi", status: "awaiting-source" },
  "ap-ibnmajah-fajr-925": { id: "ap-ibnmajah-fajr-925", status: "awaiting-source" },
  "ms-sayyid-1": { id: "ms-sayyid-1", status: "awaiting-source" },
  "ms-asbahna-2723": { id: "ms-asbahna-2723", status: "awaiting-source" },
  "ms-hasbiya-7": { id: "ms-hasbiya-7", status: "awaiting-source" },
  "ms-radeet-3": { id: "ms-radeet-3", status: "awaiting-source" },
  "ms-tahlil-100-sabah": { id: "ms-tahlil-100-sabah", status: "awaiting-source" },
  "ms-istighfar-100": { id: "ms-istighfar-100", status: "awaiting-source" },
  "e-1": { id: "e-1", status: "awaiting-source" },
  "e-2": { id: "e-2", status: "awaiting-source" },
  "e-3": { id: "e-3", status: "awaiting-source" },
  "e-4": { id: "e-4", status: "awaiting-source" },
};

// مصدر كل قسم للقراءة فقط. ده مش معناه إن النص منقول؛ النصوص بتتضاف بس من سجلات معتمدة.
const HISN_SOURCE = {
  sourceId: "hisn-risala",
  title: "حصن المسلم من أذكار الكتاب والسنة، سعيد بن علي بن وهف القحطاني، نسخة رسالة الحرمين",
  url: "https://risala.prh.gov.sa/ar/content/51",
  note: "مجموعة محدودة من الكتاب، مع رقم الباب والصفحة عند كل ذكر. عداد القراءة الواحد ليس ادعاء بتكرار زائد. لا تمثل هذه النسخة اعتمادا أو رعاية من الناشر.",
};
export const SECTION_SOURCES = {
  "after-prayer": { ...HISN_SOURCE, note: "مختارات من باب 25. قُسّم الاستغفار والدعاء، والتهليل والدعاء التالي، إلى بطاقات مستقلة لبيان العدد. ليست جميع أذكار ما بعد الصلاة." },
  morning: { ...HISN_SOURCE },
  evening: { ...HISN_SOURCE },
};
