"use client"
import { useState } from "react"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { submitApplication, ApplyFormPayload } from "@/app/(dashboard)/apply/submitApplication";
import { useError } from "@/app/ErrorProvider";



export default function ApplyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [submitted, setSubmitted] = useState(false); // NEW: submission state
    const [loading, setLoading] = useState(false);
    const { showError } = useError();



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
        message: string;           // Additional Information
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
        message: "",
    });

    const [errors, setErrors] = useState<{[key:string]: string}>({});

    const requiredFields = ["location", "experience", "position", "message", "availability", "travel", "overtime", "readyToMove"];
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

        // --- REQUIRED fields
        if (
            requiredFields.includes(name) &&
            !["travel", "overtime", "readyToMove"].includes(name)
        ) {
            if (!value || value.trim() === "") {
                error = "This field is required.";
            }
        }

        // --- YES/NO fields
        if (["travel", "overtime", "readyToMove"].includes(name)) {
            const v = value.trim().toLowerCase(); // ✅ FIX

            if (v === "") {
                error = "This field is required.";
            } else if (!["yes", "no", "y", "n"].includes(v)) {
                error = "Must be Yes / No / Y / N";
            }
        }

        // --- EXPERIENCE
        if (name === "experience") {
            const match = value.trim().toLowerCase().match(/^(\d+)(\s*years)?$/);
            if (value && !match) {
                error = "Must be number (0–20)";
            } else if (match) {
                const num = parseInt(match[1], 10);
                if (num < 0 || num > 20) {
                    error = "0–20 only";
                }
            }
        }

        // --- DATE
        if (name === "availability") {
            if (value && isNaN(Date.parse(value))) {
                error = "Invalid date";
            }
        }

        // --- MAX LENGTH
        if (["location", "position", "travel", "overtime", "readyToMove"].includes(name)) {
            if (value.length > 30) {
                error = "Max 30 chars";
            }
        }

        // --- MESSAGE
        if (name === "message" && value.length > 100) {
            error = "Max 100 chars";
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const newErrors: { [key: string]: string } = {};

        // --- required fields ---
        requiredFields.forEach(field => {
            const value = form[field as keyof ApplyForm];
            if (typeof value === "string" && value.trim() === "") {
                newErrors[field] = "This field is required.";
            }
            if (typeof value === "boolean" && !value) {
                // only for checkboxes like background if required
                newErrors[field] = "This field is required.";
            }
        });

        // --- Yes/No fields ---
        const yesNoFields = ["travel", "overtime", "readyToMove"];
        yesNoFields.forEach(field => {
            const rawValue = form[field as keyof typeof form];
            const value = rawValue ? String(rawValue).toLowerCase() : "";
            if (value && !["yes","no","y","n"].includes(value)) {
                newErrors[field] = "Must be 'Yes', 'No', 'Y' or 'N'.";
            }
        });

        // --- Experience: 0-20, optionally 'years' ---
        if (form.experience) {
            const exp = form.experience.trim().toLowerCase();
            const match = exp.match(/^(\d+)(\s*years)?$/);
            if (!match) {
                newErrors.experience = "Must be a number 0–20, optionally followed by 'years'.";
            } else {
                const num = parseInt(match[1], 10);
                if (num < 0 || num > 20) {
                    newErrors.experience = "Experience must be between 0 and 20 years.";
                }
            }
        }

        // --- Date validation ---
        if (form.availability && isNaN(Date.parse(form.availability))) {
            newErrors.availability = "Must be a valid date.";
        }

        // --- Certifications max 30 chars ---
        if (form.certifications && form.certifications.length > 30) {
            newErrors.certifications = "Certifications must be 30 characters or less.";
        }

        // --- Other fields max 30 chars ---
        const shortFields = ["location", "position", "travel", "overtime", "readyToMove"];
        shortFields.forEach(field => {
            const value = form[field as keyof typeof form];
            if (value && value.toString().length > 30) {
                newErrors[field] = "Maximum 30 characters allowed.";
            }
        });

        // --- Message max 100 chars ---
        if (form.message && form.message.length > 100) {
            newErrors.message = "Message cannot exceed 100 characters.";
        }

        // --- Consent ---
        if (!agreed) {
            showError("You must agree to the terms before submitting.");
            return;
        }

        // --- Stop if errors ---
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Not logged in
        if (!session?.user?.email || !session?.user?.name) {
            showError("You must be logged in to submit an application.");
            return;
        }

        setLoading(true);

        const payload: ApplyFormPayload = {
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
            message: form.message,
            consent: agreed,
        };

        // API submission error
        try {
            const result = await submitApplication(payload);

            if (result.error) {
                if (result.error.toLowerCase().includes("already submitted")) {
                    showError("It looks like you've already submitted an application. Please check your email, our team will get back to you soon!");

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
                        message: "",
                    });
                    setAgreed(false); // uncheck agreement if checked
                    setErrors({});
                } else {
                    showError(result.error);
                }
                return;
            }

            // ✅ ONLY mark success if data exists
            if (result.data?.success) {
                setSubmitted(true);
            } else {
                showError("Something went wrong. Please try again.");
            }

        } catch (err: any) {
            // If backend throws an HTTP 400 for duplicate, also catch here
            if (err?.message?.includes("Bad Request")) {
                showError("You have already submitted an application with this email.");

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
                    message: "",
                });
                setAgreed(false);
                setErrors({});
            } else {
                showError(err?.message || "Submission failed, please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return <p>Loading...</p>;
    if (!session) return <p>Please log in with Google to submit an application.</p>;

    const inputClass = (field:string) =>
        `w-full h-10 px-2 rounded-xl border text-sm appearance-none
     ${errors[field] ? "border-red-500 bg-gray-900" : "border-gray-700 bg-gray-900"}
     placeholder:text-xs placeholder:text-gray-500`;

    // --- SUBMISSION SUCCESS SCREEN ---
    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4 bg-black">
                <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-700 max-w-md w-full">
                    <svg className="w-24 h-24 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                    <p className="text-gray-300 mb-4">
                        Thank you for applying. Your application has been successfully submitted.
                        We will review it and get back to you soon.
                    </p>
                    <button
                        onClick={() => router.push("/info")} // go back to home or dashboard
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 - border border-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 text-white relative min-h-screen">



            <style jsx>{`
              input[type="date"] {
                text-align: left;
                padding-left: 0.5rem;
            
                display: block;
                width: 100%;
                min-width: 0;
                -webkit-appearance: none;
            
                height: 2.5rem;
                line-height: 2.5rem;
                padding-top: 0;
                padding-bottom: 0;
              }
            
              /* iOS inner text fix */
              input[type="date"]::-webkit-date-and-time-value {
                text-align: left;
              }
            
              /* Make calendar icon white */
              input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
              }
            `}</style>

            <div className="flex items-center justify-start mb-4">
                <button
                    onClick={() => router.back()}
                    title="Back"
                    className="p-0 m-0 flex items-center justify-center mr-4"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="2 2 21 21"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 block"
                    >
                        <path
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                    </svg>
                </button>

                <div className="text-sm sm:text-base">
                    Promoted: CBS Electrical Contractors <br /> Hiring NETA 2 Techs 📍Raleigh NC
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-black text-white p-2 pb-16 rounded-2xl space-y-4 max-w-md mx-auto"
            >
                <div className="bg-gray-900 rounded-xl p-2 border border-gray-700">
                    <p><strong>Name:</strong> {session.user.name}</p>
                    <p><strong>Email:</strong> {session.user.email}</p>
                </div>






                <div className="flex items-center space-x-2 mb-4">
                    <input
                        type="checkbox"
                        id="veteran"
                        checked={form.background}
                        onChange={(e) =>
                            setForm({ ...form, background: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-800 bg-gray-900 border-gray-700 rounded-xl focus:ring-yellow-400"
                    />
                    <label htmlFor="veteran" className="text-white text-sm select-none">
                        Veteran
                    </label>
                </div>






                <div className="flex flex-col">
                    <label htmlFor="location" className="text-white text-lg font-semibold mb-1">
                        Preferred Location
                    </label>
                    <input
                        id="location"
                        name="location"
                        placeholder="Dallas TX, Any location"
                        value={form.location}
                        onChange={handleChange}
                        className={inputClass("location")}
                    />
                </div>









                <div className="flex flex-col">
                    <label htmlFor="availability" className="text-white text-lg font-semibold mb-1">
                        Earliest Start Date
                    </label>
                    <input
                        type="date"
                        id="availability"
                        name="availability"
                        value={form.availability || ""}
                        onChange={handleChange}
                        className={inputClass("availability")}
                    />
                </div>










                <div className="flex flex-col">
                    <label htmlFor="certifications" className="text-white text-lg font-semibold mb-1">
                        Certifications
                    </label>
                    <input
                        type="text"
                        id="certifications"
                        name="certifications"
                        placeholder="NETA 2"
                        value={form.certifications as unknown as string} // treat as string for input
                        onChange={(e) => setForm({ ...form, certifications: e.target.value as unknown as string })} // just save string
                        className={inputClass("certifications")}
                    />
                </div>











                <div className="flex flex-col">
                    <label htmlFor="travel" className="text-white text-lg font-semibold mb-1">
                        Willing to Travel?
                    </label>
                    <input
                        type="text"
                        id="travel"
                        name="travel"
                        placeholder="Yes or No"
                        value={form.travel}
                        onChange={(e) => setForm({ ...form, travel: e.target.value })}
                        className={inputClass("travel")}
                    />
                </div>









                <div className="flex flex-col">
                    <label htmlFor="overtime" className="text-white text-lg font-semibold mb-1">
                        Willing to Work Overtime?
                    </label>
                    <input
                        type="text"
                        id="overtime"
                        name="overtime"
                        placeholder="Yes or No"
                        value={form.overtime}
                        onChange={(e) => setForm({ ...form, overtime: e.target.value })}
                        className={inputClass("overtime")}
                    />
                </div>









                <div className="flex flex-col">
                    <label htmlFor="readyToMove" className="text-white text-lg font-semibold mb-1">
                        Are you ready to relocate?
                    </label>
                    <input
                        type="text"
                        id="readyToMove"
                        name="readyToMove"
                        placeholder="Yes or No"
                        value={form.readyToMove}
                        onChange={(e) => setForm({ ...form, readyToMove: e.target.value })}
                        className={inputClass("readyToMove")}
                    />
                </div>












                <div className="flex flex-col">
                    <label htmlFor="experience" className="text-white text-lg font-semibold mb-1">
                        Years of Electrical Experience
                    </label>
                    <input
                        id="experience"
                        name="experience"
                        placeholder="e.g., 3"
                        value={form.experience}
                        onChange={handleChange}
                        className={inputClass("experience")}
                    />
                </div>





                <div className="flex flex-col">
                    <label htmlFor="position" className="text-white text-lg font-semibold mb-1">
                        Position Applying For
                    </label>
                    <input
                        id="position"
                        name="position"
                        placeholder="e.g., NETA Level 1 Tech, Manager, Technician"
                        value={form.position}
                        onChange={handleChange}
                        className={inputClass("position")}
                    />
                </div>






                <div className="flex flex-col">
                    <label htmlFor="message" className="text-white text-lg font-semibold mb-1">
                        Additional Information
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        placeholder="Write any additional details here, e.g., skills, availability, or notes"
                        value={form.message}
                        onChange={handleChange}
                        className={inputClass("message")}
                        rows={4}
                    />
                </div>







                <div className="flex items-start space-x-2">
                    <input
                        type="checkbox"
                        id="agree"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        disabled={!isFormComplete}
                        className={`mt-1 ${!isFormComplete ? "cursor-not-allowed opacity-50" : ""}`}
                    />
                    <label htmlFor="agree" className="text-xs text-white">
                        By submitting this application, I confirm that the information provided is accurate.
                        I consent to being contacted regarding this application and related job opportunities,
                        and I agree that my information, including my resume, may be shared with potential employers.
                        I understand this does not create an employment contract.
                    </label>
                </div>



                <button
                    type="submit"
                    disabled={loading || !agreed || submitted} // disable if loading, not agreed, or already submitted
                    className="w-full bg-gray-900 text-white p-2 rounded-xl font-semibold hover:bg-gray-800 border border-gray-700 disabled:opacity-50"
                >
                    {loading ? "Submitting..." : submitted ? "Already Submitted" : "Apply"}
                </button>


            </form>
        </div>
    )
}