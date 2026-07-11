import PostClient from "./PostClient";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function generateMetadata({
                                           params,
                                       }: {
    params: { id: string };
}) {

    const res = await fetch(
        `${apiUrl}/posts/${params.id}/share`,
        {
            next: {
                revalidate: 60,
            },
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
            images: [post.image],
        },
    };
}


export default function Page() {
    return <PostClient />;
}