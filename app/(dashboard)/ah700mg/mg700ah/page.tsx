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

    const { showError } = useError();

    // Fetch admin status
    const fetchAdminStatus = useCallback(async () => {
        if (!session) return;

        setLoadingAdmin(true);

        try {
            const res = await fetch(`${apiUrl}/admin/check`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            setIsAdmin(res.status === 200);

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                if (res.status === 401) {
                    showError("You need to log in again.", true);
                } else {
                    showError(data?.detail || data?.error || "Failed to check admin status");
                }
                return;
            }
        } catch {
            setIsAdmin(false);
            showError("⚠️ Network error.");
        } finally {
            setLoadingAdmin(false);
        }
    }, [showError]);

    useEffect(() => {
        if (session) fetchAdminStatus();
        else setIsAdmin(false);

        const timer = setTimeout(() => setMinLoading(false), 800);
        return () => clearTimeout(timer);
    }, [fetchAdminStatus]);

    // Show loading state while checking admin status
    if (status === "loading" || loadingAdmin || minLoading) {
        return null;
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