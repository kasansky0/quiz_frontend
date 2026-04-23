"use client";

export default function TopBar() {
    return (
        <div className="fixed top-0 left-0 w-full h-14 bg-black-200 border-b border-green-500/20 flex items-center justify-between px-6 z-50">
            {/* Left side brand */}
            <div className="text-black font-semibold text-lg">
                <span className="text-green-500">Neta</span>Prep
            </div>

            {/* Right side info */}
            <div className="text-sm text-green-400">
                Free • No Ads
            </div>
        </div>
    );
}