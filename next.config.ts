import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false, // <-- prevent double useEffect calls in development
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;