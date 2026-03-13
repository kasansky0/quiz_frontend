"use client";

import { useSession } from "next-auth/react";
import LoggedOut from "./LoggedOut";
import DashboardLayout from "@/app/(dashboard)/layout";
import { useState, useEffect } from "react";

export default function Page() {
    const { data: session, status } = useSession();
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        // Minimum loader time 2 seconds
        const timer = setTimeout(() => setShowLoader(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // While NextAuth is loading OR minimum loader time not passed
    if (status === "loading" || showLoader) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                </p>
            </div>
        );
    }

    return session ? <DashboardLayout>
        <div />
    </DashboardLayout> : <LoggedOut />;
}