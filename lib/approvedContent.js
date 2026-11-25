// الربط بين ملفات المحتوى المعتمد والواجهة.
// السجلات لا تعرض إلا بعد اكتمال مراجعتها المستقلة.
import { partitionRecords } from "./contentImport.js";
import { AZKAR_ITEMS } from "./azkarData.js";
import recordsIndex from "../content/records/index.json";
import sourcesFile from "../content/sources.json";
import reviewLog from "../content/review-log.json";
import primaryReferences from "../content/primary-references.json";

const { approved, rejected } = partitionRecords(recordsIndex, sourcesFile.approvedSources, reviewLog);

/** حالة عنصر ذكر: إما نص معتمد بمراجعة، أو بانتظار المصدر. */
export function getAzkarState(itemId) {
  const record = approved.get(itemId);
  if (record) {
    return {
      status: "approved",
      text: record.arabicText,
      reference: primaryReferences[itemId]?.label || record.reference,
      provenanceReference: record.reference,
      primaryUrl: primaryReferences[itemId]?.url,
      primaryNote: primaryReferences[itemId]?.note,
      sourceUrl: record.sourceUrl,
      count: record.count,
      countNote: record.countNote,
    };
  }
  return { status: "awaiting-source", text: null, reference: null, sourceUrl: null, base: AZKAR_ITEMS[itemId] };
}

export const contentReview = { approvedCount: approved.size, rejected };
