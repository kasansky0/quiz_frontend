import Link from "next/link";

export default function Footer() {
    return (
        <div className="w-full bg-dark-300 py-6 flex flex-col items-center min-h-[120px]">

            {/* Links row */}
            <div className="flex flex-row gap-4 mb-2">
                <Link
                    href="/info"
                    className="text-green-400 text-sm hover:underline"
                >
                    About
                </Link>
                <Link
                    href="/contact"
                    className="text-green-400 text-sm hover:underline"
                >
                    Contact
                </Link>
            </div>

            <p className="text-xs text-gray-400 text-center">
                &copy; 2026 NetaPrep. All rights reserved.
            </p>
        </div>
    );
}
