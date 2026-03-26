"use client"
import { useState } from "react"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ApplyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [anyLocation, setAnyLocation] = useState(false);
    const [submitted, setSubmitted] = useState(false); // NEW: submission state
    const [loading, setLoading] = useState(false);



    interface ApplyForm {
        location: string;
        background: string;
        experience: string;
        position: string;
        message: string;
        availability: string;
        certifications: string[];
        travel: string;
        overtime: string;
        readyToMove: string;
    }

    const [form, setForm] = useState<ApplyForm>({
        location: "",
        background: "",
        experience: "",
        position: "",
        message: "",
        availability: "",
        certifications: [],
        travel: "",
        overtime: "",
        readyToMove: ""
    });

    const [errors, setErrors] = useState<{[key:string]: boolean}>({});

    const requiredFields = ["location", "background", "experience", "position", "message", "availability", "travel", "overtime", "readyToMove"];
    const isFormComplete = requiredFields.every(field => {
        if (field === "location" && anyLocation) return true;
        const value = form[field as keyof typeof form];
        if (Array.isArray(value)) return value.length > 0;
        return value && value.toString().trim() !== "";
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: false });
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        try {
            // validation logic...
            // fetch logic...
        } finally {
            setLoading(false);
        }

        // --- validation ---
        const newErrors: { [key: string]: boolean } = {};
        requiredFields.forEach(field => {
            if (field === "location" && anyLocation) return;
            if (!form[field as keyof typeof form] || form[field as keyof typeof form].toString().trim() === "") {
                newErrors[field] = true;
            }
        });

        if (!agreed) {
            alert("You must agree to the terms before submitting.");
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!session?.user?.email || !session?.user?.name) {
            alert("You must be logged in to submit an application.");
            return;
        }

        setLoading(true);

        // --- MOCK submit (simulate network delay) ---
//        setTimeout(() => {
//            setLoading(false);
//            setSubmitted(true); // simulate successful submission
//        }, 2000); // 2-second delay for testing spinner

        // --- send form ---
        const payload = { ...form, email: session.user.email, name: session.user.name, anyLocation };
        try {
            const res = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // show professional submission screen
                setSubmitted(true);
            } else {
                const error = await res.json();
                alert(error.message || "Submission failed");
            }
        } catch (err) {
            alert("Submission failed, please try again.");
        }
    }

    if (status === "loading") return <p>Loading...</p>;
    if (!session) return <p>Please log in with Google to submit an application.</p>;

    const inputClass = (field:string) =>
        `w-full p-2 rounded border ${errors[field] ? "border-red-500 bg-gray-900" : "border-gray-700 bg-gray-900"}`;

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
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
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
              /* Make the native calendar icon white */
              input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1); /* invert color to white */
                cursor: pointer;   /* optional: makes it clickable */
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
                className="bg-black text-white p-2 rounded-2xl space-y-4 max-w-md mx-auto"
            >
                <div className="bg-gray-900 rounded p-2 border border-gray-700">
                    <p><strong>Name:</strong> {session.user.name}</p>
                    <p><strong>Email:</strong> {session.user.email}</p>
                </div>








                <div className="flex flex-col">
                    <label htmlFor="location" className="text-gray-400 text-sm mb-1">
                        Preferred Location
                    </label>
                    <input
                        id="location"
                        name="location"
                        placeholder="Dallas TX, Any location"
                        value={anyLocation ? "Open to any location" : form.location}
                        onChange={handleChange}
                        className={inputClass("location")}
                        disabled={anyLocation}
                    />
                </div>









                <div className="flex flex-col">
                    <label htmlFor="availability" className="text-gray-400 text-sm mb-1">
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
                    <label className="text-gray-400 text-sm mb-1">
                        Certifications
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {["NETA 1","NETA 2","NETA 3","NETA 4","NICET 1","NICET 2","NICET 3","NICET 4"].map(cert => (
                            <label key={cert} className="flex items-center space-x-1">
                                <input
                                    type="checkbox"
                                    name="certifications"
                                    value={cert}
                                    checked={form.certifications?.includes(cert) || false}
                                    onChange={(e) => {
                                        const selected = form.certifications || [];
                                        if (e.target.checked) {
                                            setForm({ ...form, certifications: [...selected, cert] });
                                        } else {
                                            setForm({ ...form, certifications: selected.filter(c => c !== cert) });
                                        }
                                    }}
                                    className="mt-1"
                                />
                                <span className="text-gray-300 text-sm">{cert}</span>
                            </label>
                        ))}
                    </div>
                </div>











                <div className="flex flex-col">
                    <label htmlFor="travel" className="text-gray-400 text-sm mb-1">
                        Willing to Travel?
                    </label>
                    <select
                        id="travel"
                        name="travel"
                        value={form.travel || ""}
                        onChange={handleChange}
                        className={inputClass("travel")}
                    >
                        <option value="">-- Choose an option --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>









                <div className="flex flex-col">
                    <label htmlFor="overtime" className="text-gray-400 text-sm mb-1">
                        Willing to Work Overtime?
                    </label>
                    <select
                        id="overtime"
                        name="overtime"
                        value={form.overtime || ""}
                        onChange={handleChange}
                        className={inputClass("overtime")}
                    >
                        <option value="">-- Choose an option --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>









                <div className="flex flex-col">
                    <label htmlFor="readyToMove" className="text-gray-400 text-sm mb-1">
                        Are you ready to relocate?
                    </label>
                    <select
                        id="readyToMove"
                        name="readyToMove" // changed from "background"
                        onChange={handleChange}
                        className={inputClass("readyToMove")} // use the new field for styling errors if needed
                        value={form.readyToMove || ""} // make sure the value is controlled
                    >
                        <option value="">-- Choose an option --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>







                <div className="flex flex-col">
                    <label htmlFor="background" className="text-gray-400 text-sm mb-1">
                        Select your background
                    </label>
                    <select
                        id="background"
                        name="background"
                        onChange={handleChange}
                        className={inputClass("background")}
                    >
                        <option value="">-- Choose an option --</option>
                        <option value="veteran">Veteran</option>
                        <option value="nonveteran">Non-Veteran</option>
                        <option value="preferNotToSay">Prefer not to say</option>
                    </select>
                </div>






                <div className="flex flex-col">
                    <label htmlFor="experience" className="text-gray-400 text-sm mb-1">
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
                    <label htmlFor="position" className="text-gray-400 text-sm mb-1">
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
                    <label htmlFor="message" className="text-gray-400 text-sm mb-1">
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
                    <label htmlFor="agree" className="text-xs text-gray-400">
                        By submitting this application, I confirm that the information provided is accurate.
                        I consent to being contacted regarding this application and related job opportunities,
                        and I agree that my information, including my resume, may be shared with potential employers.
                        I understand this does not create an employment contract.
                    </label>
                </div>



                <button type="submit" disabled={loading}  className="w-full bg-gray-900 text-white p-2 rounded font-semibold hover:bg-gray-800 border border-gray-700">
                    {loading ? "Submitting..." : "Apply"}
                </button>


            </form>
        </div>
    )
}