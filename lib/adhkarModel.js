// نموذج أذكار المرشحين: تعليمة الراوي منفصلة عن المتن، وعدادات المقاطع مستقلة، والبدائل لا تُجمع،
// والمراجع القرآنية لا تعرض نصا. العرض مقفول خلف مراجعة محلية غير منشورة.
// ترجمات العرض هنا فقط؛ الدليل المحفوظ في المصفوفة لا يتغير.

export const TIME_LABELS = [
  "morning", "evening", "morning-and-evening", "after-prayer",
  "after-fajr-salam", "after-maghrib-and-fajr", "daily", "unstated",
];
export const TIME_AR = {
  morning: "الصباح",
  evening: "المساء",
  "morning-and-evening": "الصباح والمساء",
  "after-prayer": "بعد الصلاة",
  "after-fajr-salam": "بعد سلام الفجر",
  "after-maghrib-and-fajr": "بعد المغرب والفجر",
  daily: "يومياً",
  unstated: "غير مطبوع في الكتاب",
};
// ترتيب العرض: كل عنصر في مجموعة واحدة فقط حسب وقته المطبوع
export const TIME_ORDER = [
  "after-prayer", "after-fajr-salam", "after-maghrib-and-fajr",
  "morning", "evening", "morning-and-evening", "daily", "unstated",
];
export const SUPPORT = {
  SUPPORTED: "supported",
  SUPPORTED_NOTE: "supported-with-note",
  SUPPORTED_MISMATCH: "supported-with-mismatch-note",
  QURAN_REF: "quran-reference-pending-mushaf-merge",
  AUTHOR_INTRO: "author-introduction",
  PENDING: "pending",
  PENDING_AUTH: "pending-authenticity",
  PENDING_OPTIONS: "pending-options",
};
const DISPLAYABLE = new Set([SUPPORT.SUPPORTED, SUPPORT.SUPPORTED_NOTE, SUPPORT.SUPPORTED_MISMATCH]);
export const LOCAL_SCOPE = "private-local-review-only";
const LOCAL_CHECKS = ["textMatchesOriginal"];
const INSTRUCTION_PREFIXES = ["وَإِذَا أَمْسَى قَالَ:", "وإذا أمسى قال:", "وَإِذَا أَصْبَحَ قَالَ:", "وإذا أصبح قال:"];

// ترجمة نطاق العدّ للعرض فقط (القيم الأصلية محفوظة في الدليل)
const SCOPE_AR = {
  "closing tahlil only": "التهليل الختامي فقط",
  "first sentence only, the bracketed [ثلاثاً] printed before اللَّهُمَّ لَا مَانِعَ; bracket is an editorial addition per footnote 1":
    "الجملة الأولى فقط؛ «ثلاثاً» بين المعقوفين إضافة تحريرية (الهامش 1)",
  "group of three surahs (112, 113, 114), count printed once after 114":
    "مجموعة السور الثلاث (112، 113، 114)، والعدد مطبوع مرة واحدة بعد 114",
  "group of three surahs, see hisn-b27-003": "مجموعة السور الثلاث، انظر العنصر الأول من المجموعة",
  "group of three surahs; the printed (ثلاث مرات) sits after this item": "مجموعة السور الثلاث؛ «ثلاث مرات» مطبوعة بعد هذا العنصر",
  "no count printed": "لا يوجد عدد مطبوع",
  "no count printed for this segment": "لا يوجد عدد مطبوع لهذا المقطع",
  "quran reference; no count": "مرجع قرآني، بلا عدّ",
  "this phrase only (ثلاثاً وثلاثين as printed)": "هذه العبارة فقط (ثلاثاً وثلاثين كما هي مطبوعة)",
};
const SOURCE_AR = {
  "Muslim 597 (تمام المائة); not printed in Hisn": "مسلم 597 (تمام المائة)؛ غير مطبوع في حصن المسلم",
};
const MISMATCH_AR = {
  "hisn-b27-011": "الرقم المطبوع أبو داود 5071 يشير على sunnah.com إلى حديث آخر (ابن مسعود، المساء). العدد 4 مدعوم من الأدب المفرد 1201 (أنس). الهامش 3 يذكر الصباح والمساء، والوسم المطبوع صباح.",
  "hisn-b27-012": "الرقم المطبوع أبو داود 5071 يشير على sunnah.com إلى حديث آخر. العدد 4 مدعوم من الأدب المفرد 1201. الوسم المطبوع مساء.",
  "hisn-b27-013": "الرقم المطبوع أبو داود 5075؛ الحديث على sunnah.com برقم 5073 (ضعيف عند الألباني)، و5075 هناك حديث آخر.",
  "hisn-b27-014": "الرقم المطبوع أبو داود 5075؛ الحديث على sunnah.com برقم 5073 (ضعيف عند الألباني)، و5075 هناك حديث آخر.",
  "hisn-b27-015": "الرقم المطبوع أبو داود 5092 هو حديث الهلال على sunnah.com، والذكر موجود برقم 5090 (أبو بكرة، حسن عند الألباني) بثلاث مرات صباحًا وثلاث مساءً. الكتاب لا يطبع وقتًا، لذلك يبقى الوقت غير مطبوع.",
  "hisn-b27-020": "الرقم المطبوع أبو داود 1531 هو حديث الصلاة على النبي يوم الجمعة على sunnah.com، وليس هذا الذكر. الرقم المطبوع محفوظ ولم يُستبدل. البديل أبو داود 5072 ضعيف عند الألباني، ولم يثبت أنه النص نفسه.",
  "hisn-b27-028": "الصيغة المطبوعة «إذا أصبح»، والحديث (البخاري 3293، مسلم 2691) يقول «في يوم»، والحماية حتى المساء. الشرط المطبوع محفوظ.",
  "hisn-b27-031": "مسلم 2702 يقول 100 في اليوم، والبخاري 6307 يقول «أكثر من سبعين». المصدران محفوظان كبديل مقارن، والعدد 100 هو رقم مسلم.",
};

/** ترجمة نطاق العدّ للعرض. أي قيمة إنجليزية غير معروفة تُستبدل بعبارة عامة. */
export function scopeLabelAr(scope) {
  if (!scope) return null;
  if (SCOPE_AR[scope]) return SCOPE_AR[scope];
  if (/[A-Za-z]/.test(scope)) return "نطاق العدّ محفوظ في الدليل";
  return scope;
}
export function sourceLabelAr(src) {
  if (!src) return null;
  return SOURCE_AR[src] || (/[A-Za-z]/.test(src) && !/^[؀-ۿ\s\d()؛،.-]+$/.test(src) ? "المصدر محفوظ في الدليل" : src);
}
export function mismatchLabelAr(item) {
  if (!item.mismatchNotes || item.mismatchNotes.length === 0) return [];
  return [MISMATCH_AR[item.id] || "ملاحظة عدم تطابق في الأرقام محفوظة في الدليل"];
}

/** يفصل تعليمة الراوي عن المتن المقروء. */
export function splitInstruction(text) {
  for (const p of INSTRUCTION_PREFIXES) {
    if (text.startsWith(p)) return { instructionText: p, recitedText: text.slice(p.length).trim() };
  }
  return { instructionText: null, recitedText: text };
}

export function isQuranRef(item) {
  return item.supportStatus === SUPPORT.QURAN_REF || item.type === "quran-reference";
}

/** بديل العدد: عدد مضبوط أو مقارنة من المصدر. لا يُجمع أبدا مع غيره. */
export function countAlternativeLabel(alt) {
  if (alt.relation === "more-than" && Number.isInteger(alt.value)) return `أكثر من ${alt.value}`;
  if (Number.isInteger(alt.count) && alt.count >= 1) return String(alt.count);
  return null;
}

/** حالة العدّاد: عدّاد، أو بدائل بلا عدّاد، أو متابعة قراءة لأن العدد غير مطبوع. */
export function countStateOf(obj) {
  if (Number.isInteger(obj.count)) return "counter";
  if ((obj.countAlternatives || []).length > 0) return "alternatives";
  return "read-through";
}

/** يتحقق من مدخل ذكر. يرجع { ok, reasons }. */
export function validateAdhkarEntry(entry) {
  const reasons = [];
  if (!entry || typeof entry !== "object") return { ok: false, reasons: ["مدخل فاضي"] };
  if (!/^hisn-(b25|b27)-\d{3}$/.test(entry.id || "")) reasons.push("معرّف داخلي غير صالح");
  if (entry.enabled !== false) reasons.push("المرشح لازم يبقى enabled=false قبل المراجعة");
  if (!TIME_LABELS.includes(entry.timeCondition)) reasons.push("وقت غير معروف");
  if (!Object.values(SUPPORT).includes(entry.supportStatus)) reasons.push("حالة الدعم غير معروفة");

  if (entry.supportStatus === SUPPORT.AUTHOR_INTRO) {
    if (entry.recitedText !== null && entry.recitedText !== undefined) reasons.push("افتتاح المؤلف ماينفعش يتقري كمتن نبوي");
    if (entry.attribution) reasons.push("افتتاح المؤلف ماينفعش ينسب لحديث");
  }
  if (Array.isArray(entry.segments)) {
    entry.segments.forEach((s, i) => {
      if (s.type !== "quran-reference" && (!s.text || !s.text.trim())) reasons.push(`مقطع ${i + 1}: النص فاضي`);
      if (!(s.count === null || (Number.isInteger(s.count) && s.count >= 1))) reasons.push(`مقطع ${i + 1}: العدد لازم يبقى رقم أو null`);
      if (!s.countScope) reasons.push(`مقطع ${i + 1}: نطاق العدد لازم يكون مكتوب`);
    });
  }
  if (Array.isArray(entry.countAlternatives)) {
    for (const alt of entry.countAlternatives) {
      if (!countAlternativeLabel(alt)) reasons.push("بديل العدد لازم يكون رقما صحيحا أو مقارنة بقيمة");
      if (!alt.source) reasons.push("بديل العدد لازم يكون له مصدر");
    }
  }
  if (entry.recitedText && INSTRUCTION_PREFIXES.some((p) => entry.recitedText.startsWith(p))) {
    reasons.push("تعليمة الراوي داخل المتن المقروء");
  }
  return { ok: reasons.length === 0, reasons };
}

/** هل العنصر يقدر يتعرض أصلا؟ المعلّق والمرجع القرآني لا يتعرضان أبدا. */
export function displayPolicy(entry) {
  if (!entry || !DISPLAYABLE.has(entry.supportStatus)) return "hidden-pending";
  return "display-with-notes";
}

/** المراجعة المحلية المقبولة لعنصر: نطاق محلي فقط، وبدون نشر، ونص مطابق. */
export function localReviewFor(itemId, reviewLog) {
  const r = (reviewLog || []).find((e) => e && e.recordId === itemId && e.scope === LOCAL_SCOPE);
  if (!r || r.publicationCleared !== false) return null;
  if (!LOCAL_CHECKS.every((c) => r.checks && r.checks[c] === true)) return null;
  return r;
}

function toView(item, review) {
  const split = item.instructionText
    ? { instructionText: item.instructionText, recitedText: item.recitedText }
    : splitInstruction(item.recitedText || "");
  const segments = (item.segments || []).map((s) => ({
    label: s.segment,
    text: s.text,
    count: Number.isInteger(s.count) ? s.count : null,
    countState: countStateOf({ count: s.count }),
    scopeAr: scopeLabelAr(s.countScope),
    sourceAr: sourceLabelAr(s.countSource),
  }));
  return {
    id: item.id,
    printedTime: item.timeCondition,
    printedTimeAr: TIME_AR[item.timeCondition] || item.timeCondition,
    verifiedPrimaryTime: item.verifiedPrimaryTime
      ? { valueAr: TIME_AR[item.verifiedPrimaryTime.value] || item.verifiedPrimaryTime.value, source: item.verifiedPrimaryTime.source }
      : null,
    instructionText: split.instructionText,
    recitedText: split.recitedText,
    // كل مقطع له عدّاد مستقل، ولا يوجد مجموع للعناصر
    segments,
    count: Number.isInteger(item.count) ? item.count : null,
    countState: segments.length ? null : countStateOf(item),
    countAlternatives: (item.countAlternatives || []).map((a) => ({
      labelAr: countAlternativeLabel(a),
      sourceAr: sourceLabelAr(a.source),
      conditionAr: a.condition || null,
    })),
    mismatchNotesAr: mismatchLabelAr(item),
    printedCitations: (item.footnoteCitations || []).map((f) => f.printedCitation).filter(Boolean),
    verifiedCitations: (item.verifiedCitations || []).map((v) => ({ ref: v.ref, url: v.url })),
    rightsNote: review.checks && review.checks.usageRightsAssessed === true ? null : "حقوق النشر غير مراجعة؛ العرض محلي فقط ولا يُنشر",
  };
}

/**
 * يبني نموذج العرض. العناصر لا تُعاد إلا مع enabled=true (مراجعة محلية).
 * summary تُحسب دائما، وcomplete تبقى false ما لم تُحل كل المراجع القرآنية والمعلّقة.
 */
export function buildAdhkarView(matrix, reviewLog, { enabled = false } = {}) {
  const items = matrix.items || [];
  const summary = { total: items.length, reviewedShown: 0, unreviewed: 0, pending: 0, quranReference: 0, authorIntro: 0 };
  const views = [];
  for (const item of items) {
    if (isQuranRef(item)) { summary.quranReference++; continue; }
    if (item.supportStatus === SUPPORT.AUTHOR_INTRO) { summary.authorIntro++; continue; }
    if (displayPolicy(item) === "hidden-pending") { summary.pending++; continue; }
    const review = localReviewFor(item.id, reviewLog);
    if (!review) { summary.unreviewed++; continue; }
    summary.reviewedShown++;
    views.push(toView(item, review));
  }
  // الاكتمال: لا يُعلن إلا لو كل العناصر ظاهرة بمراجعة، وهذا غير متحقق الآن
  const complete = summary.reviewedShown === summary.total && summary.quranReference === 0 && summary.pending === 0 && summary.authorIntro === 0;
  return { enabled: enabled === true, summary: { ...summary, complete }, items: enabled === true ? views : [] };
}

/** مجموع أعداد المقاطع للعرض فقط، مع تسميته ليس عدادا للذكر. */
export function sumSegmentCounts(segments) {
  return segments.reduce((total, s) => total + (Number.isInteger(s.count) ? s.count : 0), 0);
}
