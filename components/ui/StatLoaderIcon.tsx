export default function StatLoaderIcon() {
    return (
        <svg
            className="w-4 h-4 animate-spin text-black/60"
            viewBox="0 0 24 24"
            fill="none"
        >
            {/* soft background ring (very subtle) */}
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.15"
            />

            {/* modern gradient arc */}
            <path
                d="M12 3
                   a9 9 0 0 1 9 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
            />

            {/* highlight dot (gives “LinkedIn loading feel”) */}
            <circle
                cx="21"
                cy="12"
                r="1.5"
                fill="currentColor"
                className="opacity-80"
            />
        </svg>
    );
}