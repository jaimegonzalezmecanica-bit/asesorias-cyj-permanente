import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force clean rebuild - v3
  experimental: {
    // Enable any experimental feature to force config change detection
    optimizePackageImports: ['lucide-react', 'recharts'],
    // Force rebuild
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
