import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
    try {
        const cookieHeader = cookies().toString();

        const headers = {
            Cookie: cookieHeader,
        };

        // Run both requests in parallel
        const [userRes, profileRes] = await Promise.all([
            fetch(`${API_URL}/user`, {
                headers,
                cache: "no-store",
            }),
            fetch(`${API_URL}/profile`, {
                headers,
                cache: "no-store",
            }),
        ]);

        const [userText, profileText] = await Promise.all([
            userRes.text(),
            profileRes.text(),
        ]);

        let user, profile;

        try {
            user = JSON.parse(userText);
        } catch {
            return Response.json(
                { error: "Invalid /user response", raw: userText },
                { status: 500 }
            );
        }

        try {
            profile = JSON.parse(profileText);
        } catch {
            return Response.json(
                { error: "Invalid /profile response", raw: profileText },
                { status: 500 }
            );
        }

        return Response.json({
            user,
            activity: profile?.activity ?? profile, // flexible fallback
        });
    } catch (e) {
        return Response.json(
            { error: "Profile route failed" },
            { status: 500 }
        );
    }
}