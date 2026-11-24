// توقيت المكان المختار، مش توقيت الجهاز.
// كل الحسابات هنا بتاخد منطقة زمنية IANA صريحة (مثلاً Africa/Cairo) وبتعتمد على Intl، مش على Date المحلي للجهاز.
// الفكرة: الوقت "5:12 صباحاً في القاهرة" له لحظة محددة (instant) مستقلة عن منطقة الجهاز.

const formatters = new Map();

function formatterFor(tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz) {
  if (typeof tz !== "string" || tz.length === 0) return false;
  try {
    formatterFor(tz);
    return true;
  } catch {
    return false;
  }
}

const pad = (n) => String(n).padStart(2, "0");

/** التاريخ والوقت المدني (wall clock) في منطقة زمنية معينة عند لحظة معينة. */
export function civilIn(tz, instantMs) {
  const parts = formatterFor(tz).formatToParts(new Date(instantMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    hh: get("hour") % 24,
    mm: get("minute"),
    ss: get("second"),
  };
}

// الفرق بين الوقت المدني في المنطقة وبين UTC عند لحظة معينة (بالملي ثانية)
function offsetMs(tz, instantMs) {
  const c = civilIn(tz, instantMs);
  const wallAsUtc = Date.UTC(c.y, c.m - 1, c.d, c.hh, c.mm, c.ss);
  return wallAsUtc - Math.floor(instantMs / 1000) * 1000;
}

/** يحوّل وقت مدني في منطقة معينة للحظة UTC (ms). يتعامل مع التوقيت الصيفي. */
export function zonedToInstant(tz, y, m, d, hh, mm) {
  const wall = Date.UTC(y, m - 1, d, hh, mm, 0);
  let guess = wall - offsetMs(tz, wall);
  guess = wall - offsetMs(tz, guess);
  return guess;
}

/** يضيف n أيام على تاريخ مدني {y,m,d} (بيتعامل مع نهاية الشهر والسنة). */
export function addDaysCivil(civil, n) {
  const t = new Date(Date.UTC(civil.y, civil.m - 1, civil.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** مفتاح تاريخ ثابت YYYY-MM-DD. */
export function civilKey(civil) {
  return `${civil.y}-${pad(civil.m)}-${pad(civil.d)}`;
}

/** تاريخ بصيغة Aladhan DD-MM-YYYY. */
export function aladhanDate(civil) {
  return `${pad(civil.d)}-${pad(civil.m)}-${civil.y}`;
}

/**
 * لو الدقائق من بداية يوم civil (ممكن تكون سالبة أو أكبر من 1440) نرجع الوقت المدني الفعلي.
 * بنستخدم UTC عشان الحساب يبقى ثابت بغض النظر عن الجهاز.
 */
export function civilFromMinutes(civil, minutes) {
  const t = new Date(Date.UTC(civil.y, civil.m - 1, civil.d, 0, minutes, 0));
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    hh: t.getUTCHours(),
    mm: t.getUTCMinutes(),
  };
}

/** اللحظة (ms) لصلاة عند `minutes` من يوم civil في منطقة tz. */
export function instantForMinutes(tz, civil, minutes) {
  const c = civilFromMinutes(civil, minutes);
  return zonedToInstant(tz, c.y, c.m, c.d, c.hh, c.mm);
}

/** "HH:MM" للدقائق (من 0 إلى 1439 بعد اللف حول منتصف الليل). */
export function hhmmFromMinutes(minutes) {
  const n = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
}
