import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // You can read the userId from the query if you want
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    console.log("Mock fetch for userId:", userId);

    // Mock data
    const mockData = {
        quizzesCompleted: 5,
        averageScore: 87,
        lastAttempt: "2025-11-16",
    };

    return NextResponse.json(mockData);
}
