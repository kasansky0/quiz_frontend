export default function Footer() {
    return (
        <div className="w-full bg-black-200 py-6 flex flex-col items-center min-h-[120px]">
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
                <a href="/contact" className="text-white hover:text-green-400 transition-colors hover:underline">Contact Us</a>
                <a href="/privacy" className="text-white hover:text-green-400 transition-colors hover:underline">Privacy Policy</a>
                <a href="/terms" className="text-white hover:text-green-400 transition-colors hover:underline">Terms of Use</a>
                <a href="/tracking" className="text-white hover:text-green-400 transition-colors hover:underline">Online Tracking</a>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
                &copy; 2025 NetaPrep. All rights reserved.
            </p>
        </div>
    )
}
