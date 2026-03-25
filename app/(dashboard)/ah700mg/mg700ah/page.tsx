"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import LoggedInAdmin from "./LoggedInAdmin";
import { useError } from "@/app/ErrorProvider";
import { notFound } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPage() {
    const { data: session, status } = useSession();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loadingAdmin, setLoadingAdmin] = useState<boolean>(false);
    const [minLoading, setMinLoading] = useState<boolean>(true);

    const { showError } = useError() as { showError: (msg: string | object) => void };

    // Fetch admin status
    const fetchAdminStatus = useCallback(async () => {
        if (!session) return;

        setLoadingAdmin(true);

        try {
            const res = await fetch(`${apiUrl}/admin/check`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.idToken}`,
                },
            });
            setIsAdmin(res.status === 200);
        } catch (err: any) {
            setIsAdmin(false);
            showError(err);
        } finally {
            setLoadingAdmin(false);
        }
    }, [session, showError]);

    useEffect(() => {
        if (session) fetchAdminStatus();
        else setIsAdmin(false);

        const timer = setTimeout(() => setMinLoading(false), 800);
        return () => clearTimeout(timer);
    }, [session, fetchAdminStatus]);

    // Show loading state while checking admin status
    if (status === "loading" || loadingAdmin || minLoading) {
        return <p className="text-white text-center mt-20">Loading ...</p>;
    }

    // If user is not authenticated, return 404
    if (!session) {
        notFound(); // This triggers Next.js 404 page
    }

    // Admin dashboard
    if (isAdmin) return <LoggedInAdmin />;

    // If authenticated but not admin, show 404 as well
    notFound();
}