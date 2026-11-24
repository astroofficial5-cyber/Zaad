// مراجعة التصميم: الوضع الغامق افتراضياً، أهداف لمس 44 بكسل، تركيز واضح، وهامش 16 بكسل على الموبايل.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("الغامق هو الافتراضي والفاتح بالاختيار فقط", () => {
  assert.match(css, /:root \{[^}]*--bg: #121412/);
  assert.match(css, /:root\[data-theme="light"\] \{[^}]*--bg: #f7f7f5/);
});

test("أهداف اللمس بحد أدنى 44 بكسل", () => {
  assert.match(css, /\.tab, \.chip \{[^}]*min-height: 44px/);
  assert.match(css, /button\.primary, \.btn-like \{[^}]*min-height: 44px/);
  assert.match(css, /button\.ghost \{[^}]*min-height: 44px/);
});

test("تركيز واضح وهامش جانبي 16 بكسل", () => {
  assert.match(css, /:focus-visible \{ outline: 2px solid var\(--accent\)/);
  assert.match(css, /\.app \{[^}]*padding: 12px 16px/);
});

test("الصور والـSVG ما بتعديش عرض الصفحة", () => {
  assert.match(css, /img, svg, canvas \{ max-width: 100%; \}/);
});
