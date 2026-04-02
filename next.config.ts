import type { NextConfig } from "next";

// Configuración actualizada - forzar recompilación
const nextConfig: NextConfig = {
  // Para Vercel, no usar standalone
  // output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
