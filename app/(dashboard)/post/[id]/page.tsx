import type { Metadata } from "next";
import PostClient from "./PostClient";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

async function getPost(id: string) {
    const res = await fetch(
        `${apiUrl}/posts/${id}`,
        {
            cache: "no-store",
        }
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}


export async function generateMetadata(
    { params }: { params: { id: string } }
): Promise<Metadata> {

    const post = await getPost(params.id);

    if (!post) {
        return {
            title: "Post not found",
        };
    }


    const image =
        post.images?.[0]?.url ||
        post.images?.[0]?.secure_url ||
        "https://yourwebsite.com/logo.png";


    return {
        title: post.title,
        description: post.message,

        openGraph: {
            title: post.title,
            description: post.message,
            type: "article",
            url: `https://yourwebsite.com/post/${params.id}`,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },

        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.message,
            images: [image],
        },
    };
}


export default function Page({
                                 params,
                             }: {
    params: { id: string };
}) {
    return <PostClient />;
}