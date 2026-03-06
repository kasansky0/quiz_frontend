"use client";

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export default function Search({ value, onChange, className }: SearchProps) {
    return (
        <div className={creatingPost ? "w-full mt-3" : "w-4/5"}>
            <div className="relative flex items-center bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-full px-3 h-10 shadow-sm">
                <input
                    type="text"
                    placeholder="Search posts"
                    className="ml-2 w-full bg-transparent outline-none text-green-100 placeholder-green-500 placeholder:text-[11px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="ml-2 text-green-300 hover:text-green-400"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
);
}