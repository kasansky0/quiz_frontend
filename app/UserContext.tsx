"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface UserContextType {
    userId: string | null;
    setUserId: (id: string | null) => void;

    isEmployer: boolean | null; // 👈 allow ONLY true/false/null (loading state)
    setIsEmployer: (value: boolean | null) => void;
}

const UserContext = createContext<UserContextType>({
    userId: null,
    setUserId: () => {},

    isEmployer: null,
    setIsEmployer: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [isEmployer, setIsEmployer] = useState<boolean | null>(null);

    return (
        <UserContext.Provider
            value={{
                userId,
                setUserId,
                isEmployer,
                setIsEmployer,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);