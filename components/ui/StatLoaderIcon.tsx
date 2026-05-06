export default function StatLoaderIcon({ className = "w-6 h-6" }) {
    return (
        <svg
            className={`${className} animate-spin text-black`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            {/* outer ring (same vibe as stroke icons) */}
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
            />

            {/* spinning arc (same stroke weight feel) */}
            <path
                className="opacity-75"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M12 3a9 9 0 0 1 9 9"
            />
        </svg>
    );
}