// app/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { UserProvider } from "./UserContext";
import { ErrorProvider } from "@/app/ErrorProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <UserProvider>
                <ErrorProvider>
                    {children}
                </ErrorProvider>
            </UserProvider>
        </SessionProvider>
    );
}
