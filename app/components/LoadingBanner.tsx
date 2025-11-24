"use client";

export default function LoadingBanner() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-md p-4">

            {/* Centered Tesla-style card */}
            <div className="w-full max-w-md md:max-w-lg p-6 md:p-8 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col items-center">

                {/* Loading Text */}
                <h1 className="text-2xl md:text-3xl font-bold text-green-400/70 tracking-wider uppercase mb-2 text-center">
                    ⚡ NETA Level 2
                </h1>
                <p className="text-md md:text-lg font-mono text-green-400/50 uppercase tracking-widest text-center">
                    Loading...
                </p>

                {/* Subtle glow line */}
                <div className="mt-6 w-2/3 h-1 bg-green-400/40 rounded-full animate-pulse"></div>
            </div>
        </div>
    );
}
