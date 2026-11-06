/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  // Build terpisah untuk automation test agar server dev (.next) tidak tertimpa.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};
