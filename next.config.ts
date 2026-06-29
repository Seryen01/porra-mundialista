import withPWAInit from "next-pwa";

// next-pwa@5.6.0 is incompatible with Vercel's Next.js 16 modifyConfig —
// disable PWA in Vercel's build environment to avoid path argument errors.
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || !!process.env.VERCEL || !!process.env.NETLIFY || !!process.env.RAILWAY_ENVIRONMENT,
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: (process.env.RAILWAY_ENVIRONMENT ? "standalone" : undefined) as "standalone" | undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
