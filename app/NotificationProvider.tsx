"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type NotificationContextType = {
    newPostComments: Map<string, number>;
};

const NotificationContext = createContext<NotificationContextType>({
    newPostComments: new Map(),
});

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [newPostComments, setNewPostComments] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        if (!session?.idToken) return;

        let interval: NodeJS.Timeout;

        const poll = async () => {
            try {
                const res = await fetch(`${apiUrl}/posts/?skip=0&limit=10`, {
                    headers: {
                        Authorization: `Bearer ${session.idToken}`,
                    },
                });

                const data = await res.json();

                if (!Array.isArray(data.posts)) return;

                setNewPostComments(prev => {
                    const next = new Map(prev);

                    data.posts.forEach((p: any) => {
                        const old = next.get(p.id) || 0;

                        if (p.commentCount > old) {
                            next.set(p.id, p.commentCount); // store latest count
                        }
                    });

                    return next;
                });
            } catch (e) {
                // ignore silently
            }

            interval = setTimeout(poll, 10000); // 10s
        };

        poll();

        return () => clearTimeout(interval);
    }, [session]);

    return (
        <NotificationContext.Provider value={{ newPostComments }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);