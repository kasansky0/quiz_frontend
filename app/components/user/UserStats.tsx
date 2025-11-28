"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export default function UserStats() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="flex flex-col items-center w-full text-white font-sans">

            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-3xl font-bold text-white shadow-md">
                {session.user?.name?.[0] ?? "?"}
            </div>

            {/* Username */}
            <h2 className="text-xl font-semibold mt-4 tracking-wide">
                {session.user?.name || "User"}
            </h2>

            {/* Styled Google Sign-Out Button (matches sign-in button) */}
            <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} className="mt-6">
                <button
                    onClick={() => signOut()}
                    className="flex items-center mt-0 gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-green-400/20 shadow-lg"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-6 h-6"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span className="text-white font-medium">Sign out</span>
                </button>
            </motion.div>



            {/* Row container */}
            <div className="flex items-center space-x-3 mt-6">

                {/* Percentage score */}
                <div className="w-10 h-10 flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-full shadow-lg relative">
                    <span className="text-green-300 text-xs font-medium flex flex-col items-center leading-tight">
                        1%
                    </span>
                </div>

                {/* Percentage score */}
                <div className="w-10 h-10 flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-full shadow-lg relative">
                    <span className="text-green-300 text-xs font-medium flex flex-col items-center leading-tight">
                        10h
                    </span>
                </div>

            </div>

            <div className="w-full mt-6 p-6 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg relative
                h-64 flex flex-col">

                {/* Heading (fixed) */}
                <h2 className="text-green-300 text-sm font-medium mb-3 text-center z-10">
                    Formula Sheet
                </h2>

                {/* Formula List (scrollable) */}
                <ul className="w-full text-xs font-mono space-y-2 overflow-y-auto flex-1"
                    style={{
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none" // IE 10+
                    }}>
                    <li>
                        <span className="text-green-300 font-medium">Ohm's Law:</span>
                        <div className="text-green-100 ml-2">V = IR</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Power single phase:</span>
                        <div className="text-green-100 ml-2">P(kVA) = VI / 1000</div>
                        <div className="text-green-100 ml-2">P(kW) = VIpf / 1000</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Power three phase:</span>
                        <div className="text-green-100 ml-2">P(kVA) = √3VI / 1000</div>
                        <div className="text-green-100 ml-2">P(kW) = √3VIpf / 1000</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Capacitance:</span>
                        <div className="text-green-100 ml-2">C = Q / V</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Inductance:</span>
                        <div className="text-green-100 ml-2">V = L × (dI/dt)</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Series R :</span>
                        <div className="text-green-100 ml-2">Rₛ = R₁ + R₂ + ...</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Parallel R :</span>
                        <div className="text-green-100 ml-2">1/Rₚ = 1/R₁ + 1/R₂ + ...</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Inductive Z :</span>
                        <div className="text-green-100 ml-2">XL=2πfL</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Capacitive Z :</span>
                        <div className="text-green-100 ml-2">XC=1/2πfC</div>
                    </li>
                    {/* Add more formulas, scroll will appear */}
                </ul>
            </div>

        </div>
    );
}
