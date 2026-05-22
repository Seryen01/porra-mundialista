import withPWAInit from "next-pwa";

// next-pwa@5.6.0 is incompatible with Vercel's Next.js 16 modifyConfig —
// disable PWA in Vercel's build environment to avoid path argument errors.
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || !!process.env.VERCEL,
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
