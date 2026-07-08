"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
    unreadCount: number;
};

export default function NotificationBell({ unreadCount }: Props) {
    const hasUnread = unreadCount > 0;

    return (
        <Link
            href="/profile/notifications"
            aria-label="Notifications"
            className="
                relative
                flex
                items-center
                justify-center
                w-11
                h-11
                rounded-full
                hover:bg-gray-100
                transition
            "
        >
            <motion.div
                animate={
                    hasUnread
                        ? {
                            rotate: [0, -15, 15, -10, 10, 0],
                        }
                        : {
                            rotate: 0,
                        }
                }
                transition={
                    hasUnread
                        ? {
                            duration: 0.8,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut",
                        }
                        : {}
                }
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="28px"
                    viewBox="0 -960 960 960"
                    width="28px"
                    fill="#444"
                >
                    <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"/>
                </svg>
            </motion.div>


            {hasUnread && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                    }}
                    className="
                        absolute
                        -top-1
                        -right-1
                        min-w-5
                        h-5
                        px-1
                        rounded-full
                        bg-red-800
                        text-white
                        text-xs
                        font-semibold
                        flex
                        items-center
                        justify-center
                        border-2
                        border-white
                    "
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
            )}
        </Link>
    );
}