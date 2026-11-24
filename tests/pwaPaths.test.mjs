// PWA على GitHub Pages بيتنشر تحت /Zaad/: كل المسارات لازم تكون نسبية، مش مطلقة من الجذر.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("manifest بمسارات نسبية", () => {
  const m = JSON.parse(read("public/manifest.json"));
  assert.equal(m.start_url, "./");
  assert.equal(m.icons[0].src, "./icon.svg");
});

test("تسجيل Service Worker بمسار نسبي", () => {
  assert.ok(read("app/page.tsx").includes('register("./sw.js")'));
  assert.ok(!read("app/page.tsx").includes('register("/sw.js")'));
});

test("manifest في layout بمسار نسبي", () => {
  assert.ok(read("app/layout.tsx").includes('manifest: "./manifest.json"'));
});

test("Service Worker: كاش جديد وقائمة الملفات نسبية", () => {
  const sw = read("public/sw.js");
  assert.ok(sw.includes('const CACHE = "zaad-v7"'));
  assert.ok(sw.includes('const SHELL = ["./", "./manifest.json", "./icon.svg"];'));
  assert.ok(!/["']\/(?!\/)/.test(sw.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n").replace(/https?:\/\/\S+/g, "")));
});
