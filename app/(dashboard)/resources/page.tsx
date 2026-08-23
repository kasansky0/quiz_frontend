"use client";

import { useState } from "react";


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
    const [open, setOpen] = useState(false);


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
                    onClick={() => setOpen(true)}
                    className="
                        w-full
                        h-full
                        object-contain
                        cursor-zoom-in
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



            {open && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        bg-black/90
                        flex
                        items-center
                        justify-center
                    "
                    onClick={() => setOpen(false)}
                >

                    <img
                        src={images[index]}
                        alt={alt}
                        className="
                            max-w-[95%]
                            max-h-[90%]
                            object-contain
                        "
                        onClick={(e) => e.stopPropagation()}
                    />

                </div>
            )}


        </div>
    );
}





export default function ResourcesPage() {


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

    ];


    return (

        <main className="min-h-screen bg-gray-50">


            <section className="
                max-w-6xl
                mx-auto
                px-6
                py-12
            ">


                <h1 className="
                    text-4xl
                    font-bold
                    text-gray-900
                    mb-8
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