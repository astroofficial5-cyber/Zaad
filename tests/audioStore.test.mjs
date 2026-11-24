// الصوت: قبول/رفض الملفات، والاستيراد من الرابط، ومعاينة بدون تخزين. مفيش IndexedDB هنا، فبنتأكد إن النجاح مش بيتعلن بالغلط.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { checkAudioFile, addMuezzinFromUrl } from "../lib/audioStore.js";
import { previewMuezzin, previewingId } from "../lib/audioPreview.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("checkAudioFile بيقبل الصيغ المعروفة ويرفض الغلط", () => {
  assert.equal(checkAudioFile({ name: "a.mp3", type: "", size: 1000 }), null);
  assert.equal(checkAudioFile({ name: "x", type: "audio/ogg", size: 1000 }), null);
  assert.match(checkAudioFile({ name: "a.pdf", type: "application/pdf", size: 1000 }), /مش صوت/);
  assert.match(checkAudioFile({ name: "a.mp3", type: "audio/mpeg", size: 0 }), /فاضي/);
  assert.match(checkAudioFile({ name: "a.mp3", type: "audio/mpeg", size: 21 * 1024 * 1024 }), /20 ميجا/);
});

test("الرابط اللي بيرجع صفحة HTML مش بيتقبل حتى لو اسمه mp3", async () => {
  globalThis.fetch = async () =>
    new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
  await assert.rejects(addMuezzinFromUrl("https://example.com/voice.mp3"), /صفحة مش ملف صوت/);
});

test("فشل الشبكة أو CORS بيطلع رسالة واضحة والملف ما اتحفظش", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(addMuezzinFromUrl("https://example.com/voice.mp3"), /ما اتحفظش/);
});

test("رد فيه HTTP error بيترفض", async () => {
  globalThis.fetch = async () => new Response("nope", { status: 404, headers: { "content-type": "audio/mpeg" } });
  await assert.rejects(addMuezzinFromUrl("https://example.com/voice.mp3"), /404/);
});

test("ملف صوت صحيح بيوصل للتخزين، ومع غياب التخزين بيرجع خطأ مش نجاح", async () => {
  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), { headers: { "content-type": "audio/mpeg" } });
  await assert.rejects(addMuezzinFromUrl("https://example.com/voice.mp3"), /التخزين المحلي/);
});

test("رابط غير https أو مش صحيح بيترفض قبل أي تنزيل", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("");
  };
  await assert.rejects(addMuezzinFromUrl("http://example.com/a.mp3"), /https/);
  await assert.rejects(addMuezzinFromUrl("not a url"), /مش صحيح/);
  assert.equal(called, false);
});

test("المعاينة لملف مش موجود (أو مفيش تخزين) بترجع خطأ ومفيش معاينة شغالة", async () => {
  const states = [];
  await previewMuezzin("missing-id", (state, text) => states.push([state, text]));
  assert.equal(states.length, 1);
  assert.equal(states[0][0], "error");
  assert.equal(previewingId(), null);
});
