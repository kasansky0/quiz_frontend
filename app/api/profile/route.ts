import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
    try {
        const cookieHeader = cookies().toString();

        const res = await fetch(`${API_URL}/profile/`, {
            headers: {
                Cookie: cookieHeader,
            },
            cache: "no-store",
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return Response.json(
                { error: "Invalid backend response", raw: text },
                { status: 500 }
            );
        }

        return Response.json(data);
    } catch (e) {
        return Response.json(
            { error: "Profile route failed" },
            { status: 500 }
        );
    }
}