"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { submitApplication, ApplyFormPayload } from "@/app/(dashboard)/position/apply/[jobId]/submitApplication";
import { useError } from "@/app/ErrorProvider";
import { useParams } from "next/navigation";



export default function ApplyPage() {
    const params = useParams<{ jobId: string }>();
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [submitted, setSubmitted] = useState(false); // NEW: submission state
    const [loading, setLoading] = useState(false);
    const { showError } = useError();
    const [initialLoading, setInitialLoading] = useState(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // move to next day
    const localTomorrow = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

    const fieldLimits: Record<string, number> = {
        location: 100,
        certifications: 100,
        travel: 100,
        overtime: 100,
        readyToMove: 100,
        experience: 100,
        position: 500,
    };


    const Counter = ({ field, value }: { field: string; value: string }) => {
        const max = fieldLimits[field];
        if (!max) return null;

        return (
            <div className="text-xs text-black text-right mt-1">
                {value.length}/{max}
            </div>
        );
    };




    const company = selectedJob
        ? {
            name: selectedJob.company,
            role: selectedJob.title,
            location: selectedJob.location
        }
        : null;


    interface ApplyForm {
        name: string;              // session.user.name
        email: string;             // session.user.email
        background: boolean;        // Veteran? checkbox
        location: string;          // Preferred Location
        availability: string;      // Earliest Start Date
        certifications: string;  // Certifications selected
        travel: string;            // Willing to Travel? (yes/no)
        overtime: string;          // Willing to Work Overtime? (yes/no)
        readyToMove: string;       // Ready to Relocate? (yes/no)
        experience: string;        // Years of Electrical Experience
        position: string;          // Position Applying For

    }

    const [form, setForm] = useState<ApplyForm>({
        name: "",                  // filled automatically from session
        email: "",                 // filled automatically from session
        background: false,            // empty or "veteran"
        location: "",
        availability: "",
        certifications: "",
        travel: "",
        overtime: "",
        readyToMove: "",
        experience: "",
        position: "",
    });

    const [errors, setErrors] = useState<{[key:string]: string}>({});

    const requiredFields = ["location", "experience", "position", "availability", "travel", "overtime", "readyToMove"];
    const isFormComplete = requiredFields.every(field => {
        const value = form[field as keyof typeof form];
        if (Array.isArray(value)) return value.length > 0;
        return value && value.toString().trim() !== "";
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        let error = "";

        const val = value?.toString() || "";

        // REQUIRED fields
        if (requiredFields.includes(name) && val.trim() === "") {
            error = "Required field";
        }

        // MAX LENGTH rules (single source of truth)
        const maxLimits: Record<string, number> = {
            location: 100,
            certifications: 100,
            travel: 100,
            overtime: 100,
            readyToMove: 100,
            experience: 100,
            position: 500,
        };

        if (maxLimits[name] && val.length > maxLimits[name]) {
            error = `Max ${maxLimits[name]} chars`;
        }

        // DATE validation
        if (name === "availability") {
            if (val && isNaN(Date.parse(val))) {
                error = "Invalid date";
            } else if (val) {
                const selected = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selected < today) {
                    error = "Date cannot be in the past";
                }
            }
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        // REQUIRED
        requiredFields.forEach(field => {
            const value = form[field as keyof ApplyForm];
            if (!value || value.toString().trim() === "") {
                newErrors[field] = "Required field";
            }
        });

        // CONSENT
        if (!agreed) {
            showError("You must agree to the terms before submitting.");
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!session?.user?.email || !session?.user?.name) {
            showError("You must be logged in to submit.");
            return;
        }

        setLoading(true);

        // rest stays same...

        const payload: ApplyFormPayload = {
            jobId: selectedJob._id,
            company: selectedJob.company,
            jobTitle: selectedJob.title,
            jobLocation: selectedJob.location,
            name: session.user.name,
            email: session.user.email,
            location: form.location,
            availability: form.availability,
            certifications: form.certifications,
            travel: form.travel,
            overtime: form.overtime,
            readyToMove: form.readyToMove,
            background: form.background,
            experience: form.experience,
            position: form.position,
            consent: agreed,
        };

        // API submission error
        try {
            setLoading(true);
            const result = await submitApplication(payload);

            if (result.error) {
                let friendlyMsg = "Something went wrong. Please try again.";

                if (typeof result.error === "string") {
                    if (result.error.includes("Prohibited content detected") || result.error.includes("<script")) {
                        friendlyMsg = "Check your content and try again.";
                    } else if (result.error.includes("already submitted")) {
                        friendlyMsg = "You’ve already submitted an application!";
                    } else {
                        friendlyMsg = result.error;
                    }
                } else if (typeof result.error === "object") {
                    friendlyMsg = "Check your content and try again.";
                }

                showError(friendlyMsg, result.loginRequired);

                setForm({
                    ...form,
                    background: false,
                    location: "",
                    availability: "",
                    certifications: "",
                    travel: "",
                    overtime: "",
                    readyToMove: "",
                    experience: "",
                    position: "",
                });

                setAgreed(false);
                setErrors({});

                setLoading(false); // ✅ IMPORTANT FIX HERE

                return;
            }

            if (result.data?.success) {
                setSubmitted(true);
            } else {
                showError("Something went wrong. Please try again.");

                // --- CLEAR ALL TEXT INPUTS AND TEXTAREAS ---
                setForm({
                    ...form,
                    background: false,
                    location: "",
                    availability: "",
                    certifications: "",
                    travel: "",
                    overtime: "",
                    readyToMove: "",
                    experience: "",
                    position: "",
                });
                setAgreed(false);
                setErrors({});
                setLoading(false);
            }

        } catch (err: any) {
            showError(err?.message || "Submission failed, please try again.");

            // --- CLEAR ALL TEXT INPUTS AND TEXTAREAS ---
            setForm({
                ...form,
                background: false,
                location: "",
                availability: "",
                certifications: "",
                travel: "",
                overtime: "",
                readyToMove: "",
                experience: "",
                position: "",
            });
            setAgreed(false);
            setErrors({});
        }
    };

    useEffect(() => {
        const fetchJob = async () => {
            if (!params.jobId) return;

            setInitialLoading(true);

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/submitAds/${params.jobId}`
                );

                const data = await res.json();

                if (!res.ok) {
                    showError?.(data.detail || "Failed to load job");
                    return;
                }

                setSelectedJob(data.data);

                // 👇 force minimum loader time
                setTimeout(() => {
                    setInitialLoading(false);
                }, 500);

            } catch (err: any) {
                showError(err?.message || "Submission failed, please try again.");

                setForm({
                    ...form,
                    background: false,
                    location: "",
                    availability: "",
                    certifications: "",
                    travel: "",
                    overtime: "",
                    readyToMove: "",
                    experience: "",
                    position: "",
                });

                setAgreed(false);
                setErrors({});
                setLoading(false); // ✅ make sure ALWAYS reset
            }
        };

        fetchJob();
    }, [params.jobId]);

    if (status === "loading") return <p>Loading...</p>;
    if (!session) return <p>Please log in with Google to submit an application.</p>;

    const inputClass = (field:string) =>
        `w-full h-10 px-2 rounded-xl border text-sm appearance-none
     ${errors[field] ? "border-red-500 bg-black-200" : "border-black bg-black-200"}
     placeholder:text-xs placeholder:text-neutral-400`;

    // --- SUBMISSION SUCCESS SCREEN (LinkedIn-style + growth loop) ---
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f3f2ef] flex items-start justify-center px-4 py-4">

                <div className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 mt-2 text-center">

                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    {/* Headline */}
                    <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
                        Application submitted
                    </h2>

                    <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                        Your application has been sent to{" "}
                        <span className="font-semibold text-neutral-800">
                            {selectedJob?.company}
                        </span>.
                        <br />
                        The employer will review it and reach out if there’s a match.
                        <br />
                        <span className="text-xs text-neutral-500 block mt-2">
                            Updates will be sent to your email address.
                        </span>
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">

                        <button
                            onClick={() => router.push("/position")}
                            className="flex-1 bg-[#0a66c2] hover:bg-[#004182] text-white py-3 rounded-full font-semibold transition"
                        >
                            Back to Jobs
                        </button>

                        <button
                            onClick={() => router.push("/quiz")}
                            className="flex-1 border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 py-3 rounded-full font-semibold transition"
                        >
                            Take Quiz
                        </button>

                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-neutral-500 mt-6 leading-relaxed">
                        Your quiz score and application information help employers evaluate your skill level.
                        Consistent practice increases visibility and hiring chances.
                    </p>

                </div>
            </div>
        );
    }

    if (initialLoading || !selectedJob) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                </span>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 bg-black-200 text-black">
            <div className="w-full max-w-xl mx-auto">

                <style jsx>{`
                  input[type="date"] {
                    text-align: left;
                    padding-left: 0.5rem;
                  }
                
                  @media screen and (-webkit-min-device-pixel-ratio: 0) {
                    input[type="date"]::-webkit-date-and-time-value {
                      text-align: left !important;
                    }
                  }
                
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    opacity: 0.6;
                    cursor: pointer;
                    filter: none;
                  }
                
                  input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                  }
                `}</style>

                {/* HEADER */}
                <div className="relative w-full mb-4 flex items-center min-h-[48px]">

                    <button
                        onClick={() => router.back()}
                        title="Back"
                        className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 text-black"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>

                    <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-neutral-800 whitespace-nowrap">
                        Application Form
                    </h1>

                </div>

                {/* COMPANY CARD */}
                {company && (
                    <div className="w-full text-sm bg-white border border-neutral-200 rounded-xl p-4 space-y-1 shadow-sm mb-4">
                        <p><span className="font-semibold">Company:</span> {company.name}</p>
                        <p><span className="font-semibold">Position:</span> {company.role}</p>
                        <p><span className="font-semibold">Location:</span> 📍{company.location}</p>
                        <p><span className="font-semibold">Name:</span> {session.user.name}</p>
                        <p><span className="font-semibold">Email:</span> {session.user.email}</p>
                    </div>
                )}

                {/* FORM CARD */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-5 space-y-4 max-w-xl mx-auto"
                >
                    {/* VETERAN */}
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="veteran"
                                checked={form.background}
                                onChange={(e) =>
                                    setForm({ ...form, background: e.target.checked })
                                }
                                className="w-4 h-4 accent-blue-600"
                            />
                            <label htmlFor="veteran" className="text-sm text-neutral-700">
                                Veteran
                            </label>
                        </div>

                        <div className="text-xs text-neutral-500 mt-1 ml-6">
                            Check this if you have served in the U.S. Military.
                        </div>
                    </div>

                    {/* LOCATION */}
                    <div className="flex flex-col">
                        <label htmlFor="location" className="text-sm font-medium text-neutral-700 mb-1">
                            Your current Location
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Write down your current location (city/state). This helps match with nearby job opportunities.
                        </div>

                        <input
                            id="location"
                            name="location"
                            placeholder="Dallas TX"
                            value={form.location}
                            onChange={handleChange}
                            className={inputClass("location") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="location" value={form.location} />
                    </div>

                    {/* DATE */}
                    <div className="flex flex-col">
                        <label htmlFor="availability" className="text-sm font-medium text-neutral-700 mb-1">
                            Earliest Start Date
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Choose the earliest date you can begin.
                        </div>

                        <input
                            type="date"
                            id="availability"
                            name="availability"
                            value={form.availability || ""}
                            onChange={handleChange}
                            min={localTomorrow}
                            className={
                                inputClass("availability") +
                                " bg-white border-neutral-300 rounded-lg text-left appearance-none"
                            }
                        />
                    </div>

                    {/* CERTIFICATIONS */}
                    <div className="flex flex-col">
                        <label htmlFor="certifications" className="text-sm font-medium text-neutral-700 mb-1">
                            Certifications
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            (e.g. NETA, NICET) Include whether you have passed or previously attempted.
                        </div>

                        <input
                            type="text"
                            id="certifications"
                            name="certifications"
                            placeholder="NETA 2 (passed / scheduled / in progress)"
                            value={form.certifications as unknown as string}
                            onChange={handleChange}
                            className={inputClass("certifications") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <div className="text-xs text-neutral-500 text-right mt-1">
                            {form.certifications.length}/100
                        </div>
                    </div>

                    {/* TRAVEL */}
                    <div className="flex flex-col">
                        <label htmlFor="travel" className="text-sm font-medium text-neutral-700 mb-1">
                            Willing to Travel?
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            2–4 week travel required. Vehicle, fuel, per diem, lodging provided.
                        </div>

                        <input
                            type="text"
                            id="travel"
                            name="travel"
                            placeholder="Yes or No"
                            value={form.travel}
                            onChange={handleChange}
                            className={inputClass("travel") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="travel" value={form.travel} />
                    </div>

                    {/* OVERTIME */}
                    <div className="flex flex-col">
                        <label htmlFor="overtime" className="text-sm font-medium text-neutral-700 mb-1">
                            Willing to Work Overtime?
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Work may require overtime and emergency response. Pay is typically time-and-a-half or double time.
                        </div>

                        <input
                            type="text"
                            id="overtime"
                            name="overtime"
                            placeholder="Yes or No"
                            value={form.overtime}
                            onChange={handleChange}
                            className={inputClass("overtime") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="overtime" value={form.overtime} />
                    </div>

                    {/* RELOCATE */}
                    <div className="flex flex-col">
                        <label htmlFor="readyToMove" className="text-sm font-medium text-neutral-700 mb-1">
                            Are you ready to relocate?
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Work may require relocation to out-of-state job sites.
                        </div>

                        <input
                            type="text"
                            id="readyToMove"
                            name="readyToMove"
                            placeholder="Yes / No / When (e.g. on start date, 2 weeks after)"
                            value={form.readyToMove}
                            onChange={handleChange}
                            className={inputClass("readyToMove") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="readyToMove" value={form.readyToMove} />
                    </div>

                    {/* EXPERIENCE */}
                    <div className="flex flex-col">
                        <label htmlFor="experience" className="text-sm font-medium text-neutral-700 mb-1">
                            What is your electrical experience?
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Include total electrical experience (military/civilian), MOS, years, and schematic reading ability.
                        </div>

                        <input
                            id="experience"
                            name="experience"
                            placeholder="e.g., 3 years civilian electrician + 4 years military MOS (electrical systems)"
                            value={form.experience}
                            onChange={handleChange}
                            className={inputClass("experience") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="experience" value={form.experience} />
                    </div>

                    {/* POSITION */}
                    <div className="flex flex-col">
                        <label htmlFor="position" className="text-sm font-medium text-neutral-700 mb-1">
                            Briefly describe what are you looking for?
                        </label>

                        <div className="text-xs text-neutral-500 mb-1">
                            Describe your goals, preferred work, schedule, locations, and opportunities.
                        </div>

                        <input
                            id="position"
                            name="position"
                            placeholder="e.g., what is your goal?"
                            value={form.position}
                            onChange={handleChange}
                            className={inputClass("position") + " bg-white border-neutral-300 rounded-lg"}
                        />

                        <Counter field="position" value={form.position} />
                    </div>

                    {/* ✅ CONSENT (UNCHANGED FULL BLOCK - KEPT EXACT) */}
                    <div className="flex items-start space-x-2">
                        <input
                            type="checkbox"
                            id="agree"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            disabled={!isFormComplete}
                            className={`mt-1 ${!isFormComplete ? "cursor-not-allowed opacity-50" : ""}`}
                        />
                        <label htmlFor="agree" className="text-xs text-neutral-600 leading-relaxed">
                            By submitting this application, I confirm that all information provided is true and accurate to the best of my knowledge. I consent to being contacted regarding this application and related employment opportunities. I understand and agree that my information, including my resume, may be shared with potential employers for hiring purposes. I acknowledge that submission of this application does not create an employment contract or guarantee of employment.
                        </label>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={loading || !agreed || submitted || !isFormComplete}
                        className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white p-3 rounded-full font-semibold transition disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : submitted ? "Already Submitted" : "Apply"}
                    </button>

                </form>
            </div>
        </div>
    );
}