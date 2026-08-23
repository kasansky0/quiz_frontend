"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PositionCard from "@/app/PositionCard";


type ResourceMediaProps = {
    images: string[];
    alt?: string;
};


type Resource = {
    name: string;
    images: string[];
    description: string;
    technicianNotes: string;
    amazonLink: string;
};


function ResourceMedia({
                           images,
                           alt = "resource image",
                       }: ResourceMediaProps) {

    const [index, setIndex] = useState(0);


    if (!images || images.length === 0) return null;


    const total = images.length;


    const prev = () => {
        setIndex((i) => i === 0 ? total - 1 : i - 1);
    };


    const next = () => {
        setIndex((i) => i === total - 1 ? 0 : i + 1);
    };


    return (
        <div className="w-full">


            <div
                className="
                    relative
                    aspect-[4/3]
                    bg-black
                    rounded-xl
                    overflow-hidden
                "
            >

                <img
                    src={images[index]}
                    alt={`${alt}-${index}`}
                    className="
                        w-full
                        h-full
                        object-contain
                    "
                />


                {total > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                bg-black/50
                                text-white
                                rounded-full
                                px-3
                                py-2
                            "
                        >
                            ‹
                        </button>


                        <button
                            onClick={next}
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                bg-black/50
                                text-white
                                rounded-full
                                px-3
                                py-2
                            "
                        >
                            ›
                        </button>
                    </>
                )}

            </div>


            {total > 1 && (
                <div className="flex justify-center gap-2 mt-3">

                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`
                                        w-2
                                        h-2
                                        rounded-full
                                        ${
                                            i === index
                                                ? "bg-black"
                                                : "bg-gray-300"
                                        }
                                        `}
                        />
                    ))}

                </div>
            )}

        </div>
    );
}





export default function ResourcesPage() {

    const router = useRouter();
    const resources: Resource[] = [

        {
            name: "Elenco Banana to Banana Test Lead Set - TL-18",

            images: [
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787448618/s-l1600_rv5kjf.webp",
            ],

            description:
                "36-inch red and black test leads with stackable 3-way banana plugs, designed for electrical testing and measurement applications.",

            technicianNotes:
                "A useful set of test leads for technicians performing electrical testing with compatible meters and test equipment.",

            amazonLink: "https://amzn.to/4zuRq1j",
        },
        {
            name: "TestHelper AC262 Insulated Alligator Clip Test Leads - 5-Piece Set",

            images: [
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787450041/alligator_clip_1_ehc9b6.webp",
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787450041/alligator_clip_2_fhtno0.webp",
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787450040/alligator_clip_3_n3ty7h.webp",
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787450040/alligator_clip_4_epuspe.webp",
                "https://res.cloudinary.com/ddkkoi4as/image/upload/v1787450040/alligator_clip_5_fgyw4k.webp"
            ],

            description:
                "Insulated alligator clip test leads with 4mm banana plug connections, suitable for electrical testing and measurement applications.",

            technicianNotes:
                "A practical accessory for connecting test equipment to terminals, conductors, and other points during electrical testing.",

            amazonLink: "https://amzn.to/4c49y8b",
        },

    ];


    return (

        <main className="min-h-screen bg-gray-50">


            <section className="
                max-w-6xl
                mx-auto
                p-4
                md:p-8
            ">


                <div className="relative flex items-center mb-4">

                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        className="
                            p-2
                            rounded-full
                            hover:bg-white
                            border
                            border-transparent
                            hover:border-neutral-200
                            transition
                            z-10
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="w-8 h-8 text-neutral-700"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>

                    {/* Ads card */}
                    <PositionCard />

                </div>

                <h1 className="
                    text-2xl
                    font-bold
                    text-gray-900
                    mb-8
                    text-center
                ">
                    NETA Technician Resources
                </h1>



                <div className="
                    grid
                    grid-cols-1
                    gap-8
                ">


                    {resources.map((resource) => (

                        <div
                            key={resource.name}
                            className="
                                bg-white
                                rounded-2xl
                                border
                                border-gray-100
                                shadow-sm
                                overflow-hidden
                                w-full
                            "
                        >


                            <ResourceMedia
                                images={resource.images}
                                alt={resource.name}
                            />



                            <div className="p-5">


                                <h2 className="
                                    text-xl
                                    font-semibold
                                    text-gray-900
                                ">
                                    {resource.name}
                                </h2>



                                <p className="
                                    mt-3
                                    text-sm
                                    text-gray-600
                                ">
                                    {resource.description}
                                </p>



                                <p className="
                                    mt-4
                                    text-sm
                                    text-gray-500
                                    italic
                                ">
                                    {resource.technicianNotes}
                                </p>



                                <a
                                    href={resource.amazonLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        mt-5
                                        block
                                        w-full
                                        rounded-xl
                                        bg-blue-600
                                        text-white
                                        py-3
                                        text-center
                                        font-medium
                                        hover:bg-blue-700
                                    "
                                >
                                    View on Amazon
                                </a>


                            </div>


                        </div>

                    ))}


                </div>


            </section>


        </main>

    );
}