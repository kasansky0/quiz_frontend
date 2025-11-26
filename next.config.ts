import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    generateEtags: false, // optional, helps with caching issues
    experimental: {
        optimizeCss: true,
    },
    // Force cache-busting headers for all routes
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Cache-Control", value: "no-store, max-age=0" },
                ],
            },
        ];
    },
};

export default nextConfig;
