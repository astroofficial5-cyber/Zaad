/** @type {import('next').NextConfig} */
// output: "export" بيبني موقع ثابت في مجلد out/ عشان الغلاف الأندرويد يحمّله من assets.
// assetPrefix نسبي عشان الملفات تتحمل من https://appassets.androidplatform.net/assets/web/.
// (مجرّب؟ لأ. لازم يتتأكد بعد أول build.)
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  assetPrefix: "./",
  images: { unoptimized: true },
};

export default nextConfig;
