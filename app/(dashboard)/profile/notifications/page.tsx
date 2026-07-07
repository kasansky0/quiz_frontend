"use client";

import Link from "next/link";

type Notification = {
    id: string;
    fromNickname: string;
    fromImage?: string;
    message: string;
    preview: string;
    postId: string;
    seen: boolean;
    timestamp: string;
};


export default function NotificationsPage() {

    const notifications: Notification[] = [
        {
            id: "1",
            fromNickname: "Power_120∠0°",
            message: "replied to your comment",
            preview: "Calculations",
            postId: "6a022158b7a6178b43d91963",
            seen: false,
            timestamp: "2 hours ago",
            fromImage:
                "https://lh3.googleusercontent.com/a/ACg8ocIENQUcvgOqCRJTJ2li7ZYQ5w4fuKOfWt4ufnIWqLwCPLShEQ=s96-c",
        },
        {
            id: "2",
            fromNickname: "Relay_Master",
            message: "replied to your comment",
            preview: "Transformer differential protection",
            postId: "123456",
            seen: true,
            timestamp: "1 day ago",
        },
    ];


    return (
        <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">

            <div className="w-full max-w-xl">


                {/* HEADER */}
                <div className="bg-white rounded-t-xl border p-5">

                    <Link
                        href="/profile"
                        className="text-blue-600 text-sm hover:underline"
                    >
                        ← Back to profile
                    </Link>


                    <h1 className="text-xl font-semibold mt-4">
                        Notifications
                    </h1>

                </div>



                {/* LIST */}
                <div className="bg-white border border-t-0 rounded-b-xl divide-y">


                    {notifications.length === 0 ? (

                        <div className="p-10 text-center text-gray-500">
                            No notifications
                        </div>

                    ) : (

                        notifications.map((notification) => (

                            <Link
                                key={notification.id}
                                href={`/post/${notification.postId}`}
                            >

                                <div
                                    className={`
                                    flex gap-4 p-5
                                    hover:bg-gray-50
                                    transition
                                    cursor-pointer
                                    ${!notification.seen ? "bg-blue-50/40" : ""}
                                    `}
                                >


                                    {/* AVATAR */}

                                    {notification.fromImage ? (

                                        <img
                                            src={notification.fromImage}
                                            className="w-12 h-12 rounded-full object-cover border"
                                        />

                                    ) : (

                                        <div
                                            className="
                                            w-12 h-12 rounded-full
                                            bg-gray-200
                                            flex items-center justify-center
                                            font-semibold
                                            text-gray-600
                                            "
                                        >
                                            {notification.fromNickname[0]}
                                        </div>

                                    )}



                                    {/* CONTENT */}

                                    <div className="flex-1">


                                        <p className="text-sm">

                                            <span className="font-semibold">
                                                {notification.fromNickname}
                                            </span>{" "}

                                            <span className="text-gray-700">
                                                {notification.message}
                                            </span>

                                        </p>



                                        <p className="text-sm text-gray-500 mt-1">
                                            "{notification.preview}"
                                        </p>



                                        <p className="text-xs text-gray-400 mt-2">
                                            {notification.timestamp}
                                        </p>


                                    </div>



                                    {/* UNREAD DOT */}

                                    {!notification.seen && (

                                        <div className="
                                            w-2.5
                                            h-2.5
                                            rounded-full
                                            bg-blue-600
                                            mt-3
                                        "/>

                                    )}


                                </div>

                            </Link>

                        ))

                    )}


                </div>


            </div>

        </div>
    );
}