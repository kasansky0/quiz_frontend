"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import { useRouter } from "next/navigation";
import { submitAd } from "./submitAd";
import { useUser } from "@/app/UserContext";

export default function HireFormPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { data: session, status } = useSession();
    const token = session?.idToken;
    const [checkingRole, setCheckingRole] = useState(true);
    const { isEmployer, userId } = useUser();
    const { showError } = useError();
    const router = useRouter();
    const [blocked, setBlocked] = useState(false);

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        company: "",
        title: "",
        location: "",
        payMin: "",
        payMax: "",
        type: "",
        travel: "",
        overtime: "",
        relocation: "",
        perDiem: "",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const requiredFields = [
        "title",
        "location",
        "payMin",
        "payMax",
        "type",
        "travel",
        "overtime",
        "relocation",
    ];

    const isFormComplete = requiredFields.every(
        (field) => form[field as keyof typeof form].toString().trim() !== ""
    );

    const inputClass = (field: string) =>
        `w-full h-10 px-3 rounded-lg border text-sm transition bg-white
        ${errors[field] ? "border-red-500" : "border-neutral-300"}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        placeholder:text-xs placeholder:text-neutral-400`;

    useEffect(() => {
        if (userId === null || isEmployer === undefined) return;

        if (!isEmployer) {
            router.replace("/info");
        }
    }, [isEmployer, userId, router]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        let error = "";

        if (requiredFields.includes(name) && !value.trim()) {
            error = "This field is required.";
        }

        if ((name === "payMin" || name === "payMax") && value) {
            const num = Number(value);
            if (isNaN(num) || num < 0 || num > 300) {
                error = "Must be 0 - 300";
            }
        }

        if (name === "perDiem" && value) {
            if (value !== "no") {
                const num = Number(value);
                if (isNaN(num) || num < 0 || num > 500) {
                    error = "Enter number or 'no'";
                }
            }
        }

        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!token) {
            showError("You need to log in again.", true);
            return;
        }

        const newErrors: any = {};
        requiredFields.forEach((field) => {
            if (!form[field as keyof typeof form].toString().trim()) {
                newErrors[field] = "This field is required.";
            }
        });

        const min = Number(form.payMin);
        const max = Number(form.payMax);

        if (min > max) {
            newErrors.payMax = "Max must be greater than min";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        const result = await submitAd(
            {
                title: form.title,
                location: form.location,
                pay: {
                    min: Number(form.payMin),
                    max: Number(form.payMax),
                },
                type: form.type,
                travel: form.travel,
                overtime: form.overtime,
                relocation: form.relocation,
            },
            token!
        );

        if (result.error) {
            showError(result.error, result.loginRequired);
            setLoading(false); // 🔥 FIX HERE
            return;
        }

        setLoading(false); // also good to be explicit
        router.push("/hire");
    };

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center pt-[56px] text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]" />
                    </span>
                </p>
            </div>
        );
    }

    const isReady =
        session &&
        isEmployer !== undefined &&
        userId !== null;

    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center pt-[56px] text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]" />
                    </span>
                </p>
            </div>
        );
    }

    if (!isEmployer) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-100 p-6 text-black">
            <div className="w-full max-w-xl mx-auto">

                {/* HEADER */}
                <div className="relative flex items-center mb-6">
                    <button
                        onClick={() => router.push("/hire")}
                        className="absolute left-0 text-neutral-500 hover:text-neutral-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-7 h-7"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>

                    <div className="mx-auto text-center">
                        <h1 className="text-2xl font-semibold">Create Job Ad</h1>
                        <p className="text-sm text-neutral-500">
                            Fill in job details below
                        </p>
                    </div>
                </div>

                {/* FORM CARD (LinkedIn style) */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl space-y-5 border border-neutral-200 shadow-sm"
                >

                    {/* TITLE */}
                    <div>
                        <label className="text-sm text-neutral-600">Job Title</label>

                        <div className="text-xs text-neutral-500 mb-1">
                            List active positions you are currently hiring for or will be hiring for soon. Do not include roles that are not available.
                        </div>

                        <input
                            name="title"
                            value={form.title}
                            maxLength={300}
                            onChange={handleChange}
                            className={inputClass("title")}
                        />

                        {/* helper bottom note */}
                        <div className="text-[11px] text-neutral-400 mt-1">
                            Tip: Use clear role names like “NETA Level 2 Technician” instead of vague titles.
                        </div>

                        {/* character counter */}
                        <div className="text-[11px] text-neutral-400 mt-1 flex justify-end">
                            {form.title.length}/300
                        </div>
                    </div>

                    {/* LOCATION */}
                    <div>
                        <label className="text-sm text-neutral-600">Location</label>

                        <div className="text-xs text-neutral-500 mb-1">
                            You can list multiple locations where these positions are open or will be available.
                        </div>

                        <input
                            name="location"
                            value={form.location}
                            maxLength={300}
                            onChange={handleChange}
                            className={inputClass("location")}
                        />

                        {/* helper bottom note */}
                        <div className="text-[11px] text-neutral-400 mt-1">
                            Tip: Separate multiple locations with commas (e.g. “Miami FL, Charlotte NC, Remote”).
                        </div>

                        {/* character counter */}
                        <div className="text-[11px] text-neutral-400 mt-1 flex justify-end">
                            {form.location.length}/300
                        </div>
                    </div>

                    {/* PAY */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-neutral-600">Pay Min ($/hr)</label>
                            <div className="text-xs text-neutral-500 mb-1">
                                Minimum hourly rate across all positions (lowest paid role).
                            </div>

                            <input
                                name="payMin"
                                value={form.payMin}
                                onChange={handleChange}
                                className={inputClass("payMin")}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-neutral-600">Pay Max ($/hr)</label>
                            <div className="text-xs text-neutral-500 mb-1">
                                Maximum hourly rate across all positions (highest paid role).
                            </div>

                            <input
                                name="payMax"
                                value={form.payMax}
                                onChange={handleChange}
                                className={inputClass("payMax")}
                            />
                        </div>
                    </div>

                    {/* TYPE */}
                    <div>
                        <div className="text-sm font-medium text-neutral-700">
                            Employment type
                        </div>
                        <div className="text-xs text-neutral-500 mb-1">
                            Choose how this job is structured (full-time, contract, field work, etc.)
                        </div>

                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className={inputClass("type")}
                        >
                            <option value="" disabled>
                                -- Choose Job Type --
                            </option>
                            <option value="Full-time">Full-time</option>
                            <option value="Travel">Travel</option>
                            <option value="Contract">Contract</option>
                            <option value="Field">Field</option>
                        </select>
                    </div>

                    {/* TRAVEL */}
                    <div>
                        <div className="text-sm font-medium text-neutral-700">
                            Travel requirements
                        </div>
                        <div className="text-xs text-neutral-500 mb-1">
                            Define how often this role requires travel
                        </div>

                        <select
                            name="travel"
                            value={form.travel}
                            onChange={handleChange}
                            className={inputClass("travel")}
                        >
                            <option value="" disabled>
                                -- Choose Travel --
                            </option>
                            <option value="Nationwide">Nationwide</option>
                            <option value="Regional">Regional</option>
                            <option value="Local">Local</option>
                            <option value="None">None</option>
                        </select>
                    </div>

                    {/* OVERTIME */}
                    <div>
                        <div className="text-sm font-medium text-neutral-700">
                            Overtime policy
                        </div>
                        <div className="text-xs text-neutral-500 mb-1">
                            Set expectations for overtime availability or guarantees
                        </div>

                        <select
                            name="overtime"
                            value={form.overtime}
                            onChange={handleChange}
                            className={inputClass("overtime")}
                        >
                            <option value="" disabled>
                                -- Choose Overtime --
                            </option>
                            <option value="OT available">OT available</option>
                            <option value="Guaranteed OT">Guaranteed OT</option>
                            <option value="No OT">No OT</option>
                        </select>
                    </div>

                    {/* RELOCATION */}
                    <div>
                        <div className="text-sm font-medium text-neutral-700">
                            Relocation support
                        </div>
                        <div className="text-xs text-neutral-500 mb-1">
                            Specify if relocation assistance is provided
                        </div>

                        <select
                            name="relocation"
                            value={form.relocation}
                            onChange={handleChange}
                            className={inputClass("relocation")}
                        >
                            <option value="" disabled>
                                -- Choose Relocation --
                            </option>
                            <option value="Paid relocation">Possible paid relocation</option>
                            <option value="Partial relocation">Partial relocation</option>
                            <option value="No relocation">No relocation</option>
                        </select>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={loading || !isFormComplete}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-full font-medium hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? "Submitting..." : "Submit for Approval"}
                    </button>

                </form>
            </div>
        </div>
    );
}