// التحقق من السجلات الدينية قبل عرضها. أي سجل ما يستوفيش الشروط بيتعزل ومايظهرش.
//
// نموذج الثقة:
// - الثقة مش في حقل يكتبه المستورد (زي verified: true). الحقل ده بيتجاهل تماماً.
// - الثقة في سجل مراجعة مستقل (content/review-log.json) بيسجل فيه مراجع غير المستورد،
//   وبيأكد: النص مطابق للأصل، المرجع مؤكد، رابط الأصل اتفتح فعلاً، وحقوق الاستخدام اتراجعت.
// - النطاق بيُقبل بس لو domainStatus = "verified-by-fetch" (فتح فعلي مسجل).

const METHODS = ["manual-copy"];
const KINDS = ["quran", "hadith", "dhikr"];
const REQUIRED_CHECKS = ["textMatchesOriginal", "referenceConfirmed", "sourceUrlOpened", "rightsReviewed"];

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function findReview(reviewLog, recordId) {
  return (reviewLog || []).find((r) => r && r.recordId === recordId) || null;
}

/** يرجع { ok, reasons } لسجل واحد. */
export function validateRecord(record, sources, reviewLog = [], now = new Date()) {
  const reasons = [];
  if (!record || typeof record !== "object") return { ok: false, reasons: ["السجل فاضي أو مش كائن"] };

  if (!record.id) reasons.push("مفيش معرّف للسجل");
  if (!record.targetId) reasons.push("مفيش targetId (العنصر اللي هيتعرض فيه النص)");
  if (!KINDS.includes(record.kind)) reasons.push("نوع المحتوى مش معروف");
  if (typeof record.arabicText !== "string" || record.arabicText.trim().length === 0) {
    reasons.push("النص العربي فاضي");
  }
  if (!record.reference || typeof record.reference !== "string") reasons.push("مفيش مرجع مكتوب");
  // count = null يعني «بدون عدد»: البطاقة بتظهر بزر واحد «تمت القراءة»
  if (record.kind === "dhikr" && record.count !== null && (!Number.isInteger(record.count) || record.count < 1)) {
    reasons.push("عدد التكرار لازم يكون رقم صحيح أكبر من صفر، أو null لو مفيش عدد");
  }
  if (!METHODS.includes(record.method)) reasons.push("طريقة النقل لازم تكون manual-copy");
  if (!record.importedBy || typeof record.importedBy !== "string") reasons.push("مفيش اسم اللي نقل السجل");

  const fetched = new Date(record.fetchedAt);
  if (Number.isNaN(fetched.getTime())) reasons.push("وقت الجلب مش صحيح");
  else if (fetched > now) reasons.push("وقت الجلب في المستقبل");

  const source = (sources || []).find((s) => s.id === record.sourceId);
  if (!source) {
    reasons.push("المصدر مش موجود في القائمة المعتمدة");
  } else if (source.domainStatus !== "verified-by-fetch" || !source.domain) {
    reasons.push(`نطاق "${source.name}" لسه ما اتحققش بفتح صفحة فعلية`);
  } else {
    let url = null;
    try {
      url = new URL(record.sourceUrl);
    } catch {
      reasons.push("رابط الأصل مش صحيح");
    }
    if (url && url.protocol !== "https:") reasons.push("رابط الأصل لازم يكون https");
    if (url && !hostMatches(url.hostname, source.domain)) reasons.push("الرابط خارج نطاق المصدر المعتمد");
  }

  // المراجعة: لازم تكون من شخص غير اللي نقل، وكل الفحوص true
  const review = findReview(reviewLog, record.id);
  if (!review) {
    reasons.push("مفيش مراجعة مسجلة لهذا السجل");
  } else {
    if (!review.reviewer || typeof review.reviewer !== "string") reasons.push("المراجعة مفيهاش اسم المراجع");
    else if (review.reviewer === record.importedBy) reasons.push("المراجع هو نفس اللي نقل السجل");
    if (Number.isNaN(new Date(review.reviewedAt).getTime())) reasons.push("وقت المراجعة مش صحيح");
    for (const check of REQUIRED_CHECKS) {
      if (!review.checks || review.checks[check] !== true) reasons.push(`فحص غير مكتمل: ${check}`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

/** يفصل السجلات المقبولة عن المرفوضة. */
export function partitionRecords(records, sources, reviewLog = [], now = new Date()) {
  const approved = new Map();
  const rejected = [];
  for (const record of records || []) {
    const { ok, reasons } = validateRecord(record, sources, reviewLog, now);
    if (ok) approved.set(record.targetId, record);
    else rejected.push({ id: record?.id ?? "(بدون معرّف)", reasons });
  }
  return { approved, rejected };
}
