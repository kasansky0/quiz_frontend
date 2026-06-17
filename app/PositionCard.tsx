"use client";

import Link from "next/link";

type PositionCardProps = {
    href?: string;
    title?: string;
    subtitle?: string;
    badge?: string;
    cta?: string;
    className?: string;
};

export default function PositionCard({
                                         href = "/position",
                                         title = "Hiring NETA Technicians",
                                         subtitle = "OT available • Relocation support",
                                         badge = "NEW |",
                                         cta = "View openings now",
                                         className = "",
                                     }: PositionCardProps) {
    return (
        <Link
            href={href}
            className={`
                w-full text-center text-xs block
                active:bg-transparent focus:bg-transparent
                [-webkit-tap-highlight-color:transparent]
                transition duration-200 ease-out
                hover:-translate-y-[1px]
                active:scale-[0.98]
                rounded-md
                ${className}
            `}
        >
            <div className="flex flex-col items-center space-y-1 relative overflow-hidden p-2">

                {/* SHINE */}
                <div className="absolute inset-0 -translate-x-full animate-[shine_4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {/* TITLE + BADGE INLINE (badge second) */}
                <div className="flex items-center justify-center gap-2 text-center flex-wrap">

                    {/* TITLE */}
                    <div className="font-semibold flex items-center justify-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-blue-400 flex-shrink-0"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 7.5h-16.5A2.25 2.25 0 001.5 9.75v9A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75v-9A2.25 2.25 0 0020.25 7.5z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 7.5V6a3.75 3.75 0 017.5 0v1.5"
                            />
                        </svg>

                        <span className="leading-none">{title}</span>
                    </div>



                </div>

                {/* SUBTITLE */}
                <div className="text-xs text-center flex items-center justify-center gap-1 text-neutral-600">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 text-blue-400 flex-shrink-0"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                    </svg>

                    <span>{subtitle}</span>
                </div>

                <div className="flex items-center gap-1">
                    {/* BADGE */}
                    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-[softPulse_1.6s_ease-in-out_infinite]" />
                        {badge}
                    </div>

                    {/* CTA */}
                    <div className="text-blue-500 text-xs flex items-center gap-1 group font-medium">
                        <span>{cta}</span>

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3 10a.75.75 0 01.75-.75h10.69L10.22 5.03a.75.75 0 011.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.22-4.22H3.75A.75.75 0 013 10z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

            </div>

            {/* SHINE KEYFRAME */}
            <style jsx>{`
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </Link>
    );
}