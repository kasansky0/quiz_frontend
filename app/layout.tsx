import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from '@/lib/utils'
import "./styles/globals.css";
import Footer from "@/app/components/sections/Footer"
import Providers from "@/app/components/Providers"; // <-- make sure this line exists
import Script from "next/script";

const FontSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap'
})




export const metadata: Metadata = {
    title: "NETA Level 2 Practice Exam & Study Guide | Netaprep", // Keyword upfront
    description: "Prepare for the NETA Level 2 certification exam with realistic practice questions, detailed explanations, and study guides to help you pass on the first try.", // Longer + CTA
    keywords: [
        "NETA Level 2",
        "NETA practice exam",
        "NETA study guide",
        "electrical testing certification",
        "NETA Level 2 exam prep",
        "NETA certification practice"
    ],
    metadataBase: new URL("https://netaprep.com"),
    alternates: { canonical: "https://netaprep.com" },
    openGraph: {
        title: "NETA Level 2 Practice Exam | Netaprep",
        description: "Master the NETA Level 2 exam with realistic questions, explanations, and exam tips.",
        url: "https://netaprep.com",
        siteName: "Netaprep",
        type: "website",
        images: [{
            url: "https://netaprep.com/android-chrome-512x512.png",
            width: 1200,
            height: 630,
            alt: "NETA Practice Exam – Netaprep"
        }],
    },
    twitter: {
        card: "summary_large_image",
        title: "NETA Level 2 Exam Prep | Netaprep",
        description: "Realistic NETA Level 2 practice questions with explanations to boost your score.",
        images: ["https://netaprep.com/android-chrome-512x512.png"],
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" }, // <-- ADD THIS LINE
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
        <html
            lang="en"
            className="h-full w-full"
            style={{ backgroundColor: '#000000' }}
        >
        <body
            className={cn(
                'h-full w-full min-h-screen font-sans antialiased overflow-x-hidden',
                FontSans.variable
            )}
            style={{ backgroundColor: '#000000' }}
        >

        {/* Google Analytics */}
        <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=G-8TYPXH8EQF`}
        />
        <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                          window.dataLayer = window.dataLayer || [];
                          function gtag(){dataLayer.push(arguments);}
                          gtag('js', new Date());
                          gtag('config', 'G-8TYPXH8EQF', { page_path: window.location.pathname });
                        `,
            }}
        />

        {/* ------------------ STRUCTURED DATA ------------------ */}
        <Script
            id="structured-data"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "NETA Level 2 Practice Exam",
                    "description": "Prepare for the NETA Level 2 certification exam with realistic practice questions, explanations, and study guides.",
                    "provider": {
                        "@type": "Organization",
                        "name": "Netaprep",
                        "sameAs": "https://netaprep.com"
                    },
                    "educationalCredentialAwarded": "NETA Level 2 Certification",
                    "audience": {
                        "@type": "Audience",
                        "educationalRole": "student"
                    },
                    "hasCourseInstance": {
                        "@type": "CourseInstance",
                        "name": "NETA Level 2 Practice Exam 2026",
                        "courseMode": "Online",
                        "instructor": {
                            "@type": "Person",
                            "name": "Netaprep Team"
                        }
                    }
                })
            }}
        />


        <Providers>
            {/* ------------------ ADD H1 IN PAGE COMPONENTS ------------------ */}
            {/* Every page should have one H1 matching main keyword */}
            {children}
        </Providers>

        </body>
        </html>
    );
}


