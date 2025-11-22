import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL; // e.g. https://api.netaprep.com

export async function GET() {
    try {
        const res = await fetch(`${API_BASE}/questions/random`);

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to load question" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await fetch(`${API_BASE}/answer/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
