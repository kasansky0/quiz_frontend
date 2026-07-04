import { cookies } from "next/headers";

type UserStats = {
    name: string;
    email: string;
    image: string;
    nickname: string;
    platform_stats?: any;
};

type ProfileActivity = {
    posts: any[];
    comments: any[];
};

// -----------------------------
// CALL NEXT ROUTE ONLY
// -----------------------------
async function getProfile(): Promise<{
    user: UserStats;
    activity: ProfileActivity;
} | null> {
    try {
        const cookieHeader = cookies().toString();

        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/profile`, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
            },
            cache: "no-store",
        });

        if (!res.ok) return null;

        return await res.json();
    } catch (e) {
        console.error("Profile fetch failed:", e);
        return null;
    }
}

// -----------------------------
// PAGE
// -----------------------------
export default async function ProfilePage() {
    console.log("🔥 ProfilePage SSR START");

    const result = await getProfile();

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Failed to load profile
            </div>
        );
    }

    const { user, activity } = result;

    const posts = activity.posts ?? [];
    const comments = activity.comments ?? [];

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
                    <img
                        src={user.image}
                        className="w-20 h-20 rounded-full object-cover border"
                    />

                    <div>
                        <h1 className="text-2xl font-semibold">{user.name}</h1>
                        <p className="text-gray-500">{user.email}</p>

                        <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full inline-block">
                            {user.nickname}
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Posts</p>
                        <p className="text-2xl font-bold">{posts.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Comments</p>
                        <p className="text-2xl font-bold">{comments.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Total Activity</p>
                        <p className="text-2xl font-bold">
                            {posts.length + comments.length}
                        </p>
                    </div>
                </div>

                {/* POSTS */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">Your Posts</h2>
                    <div className="space-y-3">
                        {posts.map((post: any) => (
                            <div key={post.id} className="border-b pb-3">
                                <p className="font-semibold">{post.title}</p>
                                <p className="text-sm text-gray-500">
                                    {post.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COMMENTS */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">Your Comments</h2>
                    <div className="space-y-3">
                        {comments.map((comment: any) => (
                            <div key={comment.id} className="border-b pb-3">
                                <p className="text-sm">{comment.message}</p>
                                <p className="text-xs text-gray-400">
                                    Post ID: {comment.postId}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}