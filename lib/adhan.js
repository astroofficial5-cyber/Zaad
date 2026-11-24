// تنبيهات الأذان داخل صفحة الويب.
// حدود مهمة: المؤقتات (setTimeout) بتشتغل بس والتبويب مفتوح وغير مجمّد.
// ده مش تنبيه مضمون عند إغلاق التطبيق أو قفل الجهاز. التنبيه الفعلي في الخلفية على أندرويد في طبقة Android المرفقة (AlarmManager).

import { getMuezzinObjectUrl } from "./audioStore.js";

/**
 * items: [{ key, at }] بلحظات حقيقية (ms). المؤقت بيتحسب من Date.now() وده مستقل عن توقيت الجهاز.
 * بيرجع دالة إلغاء.
 */
export function scheduleAdhanAt(items, onFire) {
  const now = Date.now();
  const timers = (items || [])
    .filter((it) => it.at > now)
    .map((it) => setTimeout(() => onFire(it.key), it.at - now));
  return () => timers.forEach(clearTimeout);
}

/** يرجع "granted" أو "denied" أو "default" أو "unsupported". */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

export async function notifyPrayer({ key, name, playAudio, muezzinId }) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(`حان وقت صلاة ${name}`, { body: "حيّ على الصلاة", tag: `prayer-${key}` });
    } catch {
      // بعض المتصفحات بتمنع new Notification، ومش هنوقف الصوت عشانها
    }
  }
  if (playAudio) await playAdhanSound(muezzinId);
}

async function playAdhanSound(muezzinId) {
  let url = null;
  if (muezzinId) {
    try {
      url = await getMuezzinObjectUrl(muezzinId);
    } catch {
      url = null;
    }
  }
  if (url) {
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    try {
      await audio.play();
    } catch {
      // المتصفح ممكن يمنع التشغيل التلقائي لو مفيش تفاعل من المستخدم
      URL.revokeObjectURL(url);
    }
    return;
  }
  playTone(); // نغمة تنبيه، مش أذان
}

function playTone() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    osc.start();
    osc.stop(ctx.currentTime + 2);
    osc.onended = () => ctx.close();
  } catch {
    // لا يوجد صوت متاح
  }
}
