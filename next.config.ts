import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Чтобы открыть dev-сервер с телефона в той же Wi-Fi-сети (http://<IP компьютера>:3000)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
