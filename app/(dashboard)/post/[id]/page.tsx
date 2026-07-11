import PostClient from "./PostClient";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ id: string }>;
}) {

    const { id } = await params;

    const res = await fetch(
        `${apiUrl}/posts/${id}/share`,
        {
            cache: "no-store",
        }
    );


    if (!res.ok) {
        return {
            title: "Post",
        };
    }


    const post = await res.json();


    return {
        title: post.title,
        description: post.message?.slice(0,160),

        openGraph: {
            type: "article",
            title: post.title,
            description: post.message?.slice(0,160),
            images: [
                {
                    url: post.image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },

        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.message?.slice(0,160),
            images: [post.image],
        },
    };
}


export default function Page() {
    return <PostClient />;
}