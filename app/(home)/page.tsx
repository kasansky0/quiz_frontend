"use client";

import { useSession } from "next-auth/react";
import LoggedIn from "./LoggedIn";
import LoggedOut from "./LoggedOut";

export default function Page() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return session ? <LoggedIn /> : <LoggedOut />;
}
