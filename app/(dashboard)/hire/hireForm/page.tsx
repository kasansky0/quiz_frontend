"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import { useRouter } from "next/navigation";
import { submitAd } from "./submitAd";

export default function HireFormPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { data: session } = useSession();
    const token = session?.idToken;

    const { showError } = useError();
    const router = useRouter();

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
        `w-full h-10 px-2 rounded-xl border text-sm
        ${errors[field] ? "border-red-500 bg-gray-900" : "border-gray-700 bg-gray-900"}
        placeholder:text-xs placeholder:text-gray-500`;

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
            showError("You need to log in.", true);
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
                perDiem:
                    form.perDiem === "no" || form.perDiem === ""
                        ? null
                        : Number(form.perDiem),
            },
            token!
        );

        if (result.error) {
            showError(result.error, result.loginRequired);
            setLoading(false);
            return;
        }

        router.push("/hire");
        setLoading(false);
    };

    if (!session) return <p className="text-white p-4">Please log in.</p>;

    return (
        <div className="p-4 text-white min-h-screen">
            <div className="w-full max-w-xl mx-auto">

                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Create Job Ad</h1>
                    <p className="text-sm text-gray-400">
                        Fill in job details below
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-black p-4 rounded-2xl space-y-4 border border-gray-800"
                >

                    {/* TITLE */}
                    <div>
                        <label className="text-sm">Job Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className={inputClass("title")}
                        />
                    </div>

                    {/* LOCATION */}
                    <div>
                        <label className="text-sm">Location</label>
                        <input
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            className={inputClass("location")}
                        />
                    </div>

                    {/* PAY */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm">Pay Min ($/hr)</label>
                            <input
                                name="payMin"
                                value={form.payMin}
                                onChange={handleChange}
                                className={inputClass("payMin")}
                            />
                        </div>
                        <div>
                            <label className="text-sm">Pay Max ($/hr)</label>
                            <input
                                name="payMax"
                                value={form.payMax}
                                onChange={handleChange}
                                className={inputClass("payMax")}
                            />
                        </div>
                    </div>

                    {/* TYPE */}
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className={inputClass("type")}
                    >
                        <option value="">Job Type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Travel">Travel</option>
                        <option value="Contract">Contract</option>
                        <option value="Field">Field</option>
                    </select>

                    {/* TRAVEL */}
                    <select
                        name="travel"
                        value={form.travel}
                        onChange={handleChange}
                        className={inputClass("travel")}
                    >
                        <option value="">Travel</option>
                        <option value="Nationwide">Nationwide</option>
                        <option value="Regional">Regional</option>
                        <option value="Local">Local</option>
                        <option value="None">None</option>
                    </select>

                    {/* OVERTIME */}
                    <select
                        name="overtime"
                        value={form.overtime}
                        onChange={handleChange}
                        className={inputClass("overtime")}
                    >
                        <option value="">Overtime</option>
                        <option value="OT available">OT available</option>
                        <option value="Guaranteed OT">Guaranteed OT</option>
                        <option value="No OT">No OT</option>
                    </select>

                    {/* RELOCATION */}
                    <select
                        name="relocation"
                        value={form.relocation}
                        onChange={handleChange}
                        className={inputClass("relocation")}
                    >
                        <option value="">Relocation</option>
                        <option value="Paid relocation">Paid relocation</option>
                        <option value="Partial relocation">Partial relocation</option>
                        <option value="No relocation">No relocation</option>
                    </select>

                    {/* PER DIEM */}
                    <div>
                        <label className="text-sm">Per Diem ($ or "no")</label>
                        <input
                            name="perDiem"
                            value={form.perDiem}
                            onChange={handleChange}
                            placeholder="120 or no"
                            className={inputClass("perDiem")}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isFormComplete}
                        className="w-full bg-gray-900 text-white p-2 rounded-xl font-semibold hover:bg-gray-800 border border-gray-700 disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit for Approval"}
                    </button>

                </form>
            </div>
        </div>
    );
}