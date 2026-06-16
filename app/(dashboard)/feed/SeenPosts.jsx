export default function PostViews({
                                      uniqueViews,
                                      totalViews,
                                      className = "",
                                  }) {
    return (
        <div
            className={`flex items-center gap-2 text-xs text-gray-500 leading-none ${className}`}
        >
            {/* UNIQUE VIEWS */}
            <div
                className="flex items-center gap-1 leading-none"
                title={`${uniqueViews.toLocaleString()} unique viewers`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3 w-3 block"
                >
                    <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.98 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
                </svg>

                <span className="leading-none relative top-[1px]">
                    {uniqueViews.toLocaleString()}
                </span>
            </div>

            {/* TOTAL VIEWS */}
            <div
                className="flex items-center gap-1 leading-none"
                title={`${totalViews.toLocaleString()} total views`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 block"
                >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>

                <span className="leading-none relative top-[1px]">
                    {totalViews.toLocaleString()}
                </span>
            </div>
        </div>
    );
}