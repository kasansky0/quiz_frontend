import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from '@/lib/utils'
import "./styles/globals.css";
import Footer from "@/app/components/sections/Footer"
import Providers from "@/app/components/Providers"; // <-- make sure this line exists



const FontSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-sans'
})

export const metadata: Metadata = {
    title: "NETA Level 2 Practice Tests & Exam Prep | Netaprep.com",
    description: "Prepare for the NETA Level 2 certification exam with realistic practice questions...",
    keywords: [ "NETA Level 2", "NETA practice exam", "NETA study guide", "electrical testing certification" ],
    metadataBase: new URL("https://netaprep.com"),
    alternates: { canonical: "https://netaprep.com" },
    openGraph: {
        title: "NETA Level 2 Practice Tests | Netaprep.com",
        description: "Master the NETA Level 2 exam with realistic questions, explanations...",
        url: "https://netaprep.com",
        siteName: "Netaprep",
        type: "website",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NETA Practice Exam – Netaprep" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "NETA Level 2 Exam Prep | Netaprep",
        description: "Realistic NETA Level 2 practice questions...",
        images: ["/og-image.png"],
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
            { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
            { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        ],
        apple: "/apple-touch-icon.png",
        shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
    themeColor: "#ffffff",
    authors: [{ name: "Netaprep", url: "https://netaprep.com" }],
    category: "Education",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
        }
    },

};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full w-full bg-black">
        <body
            className={cn(
                'h-full w-full bg-black font-sans antialiased overflow-x-hidden',
                FontSans.variable
            )}
        >
        <Providers>
            {children}  {/* all pages/components inside here */}
        </Providers>
        </body>
        </html>
    );
}

